import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { signCloudinaryParams, type CloudinaryConfig } from './cloudinary.js';
import {
  MEDIA_FOLDER,
  RASTER_UPLOAD_TRANSFORMATION,
  buildMediaUrl,
  buildUploadParams,
  destroyMediaAsset,
  mediaAssetExists,
  newMediaPublicId,
  resourceTypeFor,
  uploadMediaAsset,
} from './mediaCloudinary.js';
import type { ValidatedMediaFile } from './uploadValidation.js';

const CONFIG: CloudinaryConfig = { cloudName: 'testcloud', apiKey: '123456', apiSecret: 'shh-secret' };

const PNG: ValidatedMediaFile = { mimeType: 'image/png', mediaType: 'image', extension: 'png' };
const SVG: ValidatedMediaFile = { mimeType: 'image/svg+xml', mediaType: 'image', extension: 'svg' };
const PDF: ValidatedMediaFile = { mimeType: 'application/pdf', mediaType: 'document', extension: 'pdf' };

afterEach(() => mock.restoreAll());

/** Replaces global fetch for one test, recording every call. */
function mockFetch(respond: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  mock.method(globalThis, 'fetch', async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return respond(url, init);
  });
  return calls;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('public ids and delivery URLs', () => {
  it('images and SVG map to Cloudinary "image"; a PDF to "raw"', () => {
    assert.equal(resourceTypeFor('image'), 'image');
    assert.equal(resourceTypeFor('document'), 'raw');
  });

  it('generates unguessable ids in the media folder, with .pdf on a raw id only', () => {
    const png = newMediaPublicId(PNG);
    const pdf = newMediaPublicId(PDF);
    assert.match(png, new RegExp(`^${MEDIA_FOLDER}/[0-9a-f]{24}$`));
    assert.match(pdf, new RegExp(`^${MEDIA_FOLDER}/[0-9a-f]{24}\\.pdf$`));
    assert.notEqual(newMediaPublicId(PNG), png);
  });

  it('builds the public URL: auto format/quality for raster, .svg for SVG, raw for PDF', () => {
    assert.equal(
      buildMediaUrl('c', { resourceType: 'image', publicId: 'nexastack/media/abc', version: 12, extension: 'webp' }),
      'https://res.cloudinary.com/c/image/upload/f_auto,q_auto/v12/nexastack/media/abc',
    );
    assert.equal(
      buildMediaUrl('c', { resourceType: 'image', publicId: 'nexastack/media/abc', version: 12, extension: 'svg' }),
      'https://res.cloudinary.com/c/image/upload/v12/nexastack/media/abc.svg',
    );
    assert.equal(
      buildMediaUrl('c', { resourceType: 'raw', publicId: 'nexastack/media/abc.pdf', version: 12, extension: 'pdf' }),
      'https://res.cloudinary.com/c/raw/upload/v12/nexastack/media/abc.pdf',
    );
  });
});

describe('buildUploadParams', () => {
  it('caps a raster image at the maximum dimension and signs that transformation', () => {
    const params = buildUploadParams('nexastack/media/abc', PNG, CONFIG, 1_700_000_000);
    assert.equal(params.transformation, RASTER_UPLOAD_TRANSFORMATION);
    assert.match(RASTER_UPLOAD_TRANSFORMATION, /^c_limit,w_2400,h_2400$/, 'limit: never enlarges');
    assert.equal(
      params.signature,
      signCloudinaryParams(
        { public_id: 'nexastack/media/abc', timestamp: 1_700_000_000, transformation: RASTER_UPLOAD_TRANSFORMATION },
        CONFIG.apiSecret,
      ),
    );
    assert.equal(params.api_key, CONFIG.apiKey);
    assert.equal(JSON.stringify(params).includes(CONFIG.apiSecret), false, 'the secret is never sent');
  });

  it('leaves SVG and PDF untransformed', () => {
    assert.equal('transformation' in buildUploadParams('a', SVG, CONFIG, 1), false);
    assert.equal('transformation' in buildUploadParams('a.pdf', PDF, CONFIG, 1), false);
  });
});

describe('uploadMediaAsset', () => {
  const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);

  it('posts a signed multipart upload to the right resource type and returns the public URL', async () => {
    const calls = mockFetch((_url, init) => {
      const form = init.body as FormData;
      return json({
        public_id: form.get('public_id'),
        version: 1712345678,
        bytes: 4,
        width: 800,
        height: 600,
        resource_type: 'image',
        type: 'upload',
      });
    });

    const asset = await uploadMediaAsset(bytes, 'photo.png', PNG, CONFIG);

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://api.cloudinary.com/v1_1/testcloud/image/upload');
    const form = calls[0]?.init.body as FormData;
    assert.equal(form.get('transformation'), RASTER_UPLOAD_TRANSFORMATION);
    assert.ok(form.get('signature'));
    assert.equal((form.get('file') as File).name, 'photo.png');
    assert.match(asset.url, /^https:\/\/res\.cloudinary\.com\/testcloud\/image\/upload\/f_auto,q_auto\/v1712345678\/nexastack\/media\/[0-9a-f]{24}$/);
    assert.deepEqual([asset.width, asset.height, asset.bytes], [800, 600, 4]);
  });

  it('uploads a PDF as raw, with the .pdf in the public id and no transformation', async () => {
    const calls = mockFetch((_url, init) => {
      const form = init.body as FormData;
      return json({ public_id: form.get('public_id'), version: 1, resource_type: 'raw', type: 'upload', bytes: 4 });
    });
    const asset = await uploadMediaAsset(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), 'brief.pdf', PDF, CONFIG);
    assert.equal(calls[0]?.url, 'https://api.cloudinary.com/v1_1/testcloud/raw/upload');
    assert.equal((calls[0]?.init.body as FormData).get('transformation'), null);
    assert.match(asset.url, /\/raw\/upload\/v1\/nexastack\/media\/[0-9a-f]{24}\.pdf$/);
    assert.equal(asset.width, null);
  });

  it('refuses a response that is not a public upload of the type asked for', async () => {
    for (const reply of [
      { type: 'authenticated', resource_type: 'image', version: 1 },
      { type: 'upload', resource_type: 'video', version: 1 },
      { type: 'upload', resource_type: 'image', version: 1, public_id: 'someone/elses/file' },
      { type: 'upload', resource_type: 'image' },
    ]) {
      mockFetch(() => json(reply));
      await assert.rejects(uploadMediaAsset(bytes, 'a.png', PNG, CONFIG));
      mock.restoreAll();
    }
  });

  it('throws on a non-2xx response and on a dropped connection', async () => {
    mockFetch(() => json({ error: { message: 'nope' } }, 401));
    await assert.rejects(uploadMediaAsset(bytes, 'a.png', PNG, CONFIG), /status 401/);
    mock.restoreAll();
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed');
    });
    await assert.rejects(uploadMediaAsset(bytes, 'a.png', PNG, CONFIG));
  });
});

describe('destroyMediaAsset', () => {
  it('sends a signed destroy with invalidate=true to the right resource type', async () => {
    const calls = mockFetch(() => json({ result: 'ok' }));
    assert.equal(await destroyMediaAsset('raw', 'nexastack/media/abc.pdf', CONFIG), 'deleted');

    assert.equal(calls[0]?.url, 'https://api.cloudinary.com/v1_1/testcloud/raw/destroy');
    const body = calls[0]?.init.body as URLSearchParams;
    assert.equal(body.get('public_id'), 'nexastack/media/abc.pdf');
    assert.equal(body.get('invalidate'), 'true');
    assert.equal(body.get('api_key'), CONFIG.apiKey);
    assert.equal(
      body.get('signature'),
      signCloudinaryParams(
        { invalidate: 'true', public_id: 'nexastack/media/abc.pdf', timestamp: body.get('timestamp') ?? '' },
        CONFIG.apiSecret,
      ),
    );
    assert.equal(body.toString().includes(CONFIG.apiSecret), false);
  });

  it('treats "not found" as already gone, and anything unexpected as a failure', async () => {
    mockFetch(() => json({ result: 'not found' }));
    assert.equal(await destroyMediaAsset('image', 'x', CONFIG), 'not-found');
    mock.restoreAll();

    mockFetch(() => json({ result: 'weird' }));
    await assert.rejects(destroyMediaAsset('image', 'x', CONFIG));
    mock.restoreAll();

    mockFetch(() => json({}, 500));
    await assert.rejects(destroyMediaAsset('image', 'x', CONFIG), /status 500/);
  });
});

describe('mediaAssetExists', () => {
  it('asks the Admin API (basic auth) and maps 200 / 404 / anything else', async () => {
    const calls = mockFetch(() => json({}, 200));
    assert.equal(await mediaAssetExists('image', 'nexastack/media/abc', CONFIG), true);
    assert.equal(
      calls[0]?.url,
      'https://api.cloudinary.com/v1_1/testcloud/resources/image/upload/nexastack/media/abc',
    );
    const auth = (calls[0]?.init.headers as Record<string, string>).Authorization;
    assert.equal(auth, `Basic ${Buffer.from('123456:shh-secret').toString('base64')}`);
    mock.restoreAll();

    mockFetch(() => json({}, 404));
    assert.equal(await mediaAssetExists('image', 'x', CONFIG), false);
    mock.restoreAll();

    mockFetch(() => json({}, 500));
    assert.equal(await mediaAssetExists('image', 'x', CONFIG), null);
    mock.restoreAll();

    mock.method(globalThis, 'fetch', async () => {
      throw new Error('offline');
    });
    assert.equal(await mediaAssetExists('image', 'x', CONFIG), null);
  });
});
