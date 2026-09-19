import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

/**
 * Real multipart HTTP requests to the REAL upload controller (multipart reader, byte validation,
 * alt-text rules, error envelope). Only two things are stubbed: the admin session (the router's
 * `requireSession` is bypassed) and, implicitly, storage: there is no Cloudinary configuration here,
 * and every check under test runs BEFORE storage is contacted. A request that passes validation
 * therefore ends in the "storage not configured" 503, which is how these tests tell "was accepted by
 * validation" from "was rejected by it" without a database or a Cloudinary account.
 */

// The environment is read at import time, so set it before importing anything that reads it.
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/dummy';
process.env.JWT_SECRET = 'x'.repeat(40);
process.env.WEB_APP_URL = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;

const { default: express } = await import('express');
const controller = await import('./adminMedia.controller.js');
const { errorHandler } = await import('../middleware/errorHandler.js');

const MB = 1024 * 1024;
const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF_HEAD = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const enc = (text: string): Uint8Array => new TextEncoder().encode(text);

function bytes(head: number[], total = 64): Uint8Array {
  const out = new Uint8Array(total);
  out.set(head);
  return out;
}

let server: Server;
let base: string;

before(async () => {
  const app = express();
  app.use((req, _res, next) => {
    (req as unknown as { admin: unknown }).admin = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      role: 'admin',
    };
    next();
  });
  app.post('/media', controller.uploadMedia);
  app.use(errorHandler);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

interface Sent {
  file?: { data: Uint8Array; name: string; type: string };
  fields?: Record<string, string>;
}

interface Reply {
  status: number;
  code: string | undefined;
  message: string | undefined;
  paths: string[];
  details: string[];
}

async function upload({ file, fields = {} }: Sent): Promise<Reply> {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, value);
  if (file) form.append('file', new Blob([file.data as Uint8Array<ArrayBuffer>], { type: file.type }), file.name);

  const response = await fetch(`${base}/media`, { method: 'POST', body: form });
  const body = (await response.json()) as {
    success: boolean;
    error?: { code: string; message: string; details?: { path: string; message: string }[] };
  };
  assert.equal(body.success, false, 'these requests must never succeed here');
  return {
    status: response.status,
    code: body.error?.code,
    message: body.error?.message,
    paths: body.error?.details?.map((detail) => detail.path) ?? [],
    details: body.error?.details?.map((detail) => detail.message) ?? [],
  };
}

const png = (name = 'photo.png'): Sent['file'] => ({ data: bytes(PNG_HEAD), name, type: 'image/png' });

describe('POST /media: alt text is mandatory for images, enforced on the server', () => {
  it('rejects an image with no altText field at all (400, path altText), before storage is contacted', async () => {
    const reply = await upload({ file: png() });
    assert.equal(reply.status, 400);
    assert.equal(reply.code, 'VALIDATION_ERROR');
    assert.deepEqual(reply.paths, ['altText']);
    assert.match(reply.details[0] ?? '', /alt text is required/i);
  });

  it('rejects blank, whitespace-only and too-short alt text', async () => {
    for (const altText of ['', '   ', '\t\n', 'x']) {
      const reply = await upload({ file: png(), fields: { altText } });
      assert.equal(reply.status, 400, JSON.stringify(altText));
      assert.deepEqual(reply.paths, ['altText'], JSON.stringify(altText));
    }
  });

  it('rejects alt text longer than 200 characters', async () => {
    const reply = await upload({ file: png(), fields: { altText: 'a'.repeat(201) } });
    assert.equal(reply.status, 400);
    assert.deepEqual(reply.paths, ['altText']);
  });

  it('applies to every image type, including WebP and SVG', async () => {
    const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    const svg = enc('<svg xmlns="http://www.w3.org/2000/svg"/>');
    for (const file of [
      { data: webp, name: 'a.webp', type: 'image/webp' },
      { data: svg, name: 'a.svg', type: 'image/svg+xml' },
      { data: bytes([0xff, 0xd8, 0xff, 0xe0]), name: 'a.jpg', type: 'image/jpeg' },
    ]) {
      const reply = await upload({ file });
      assert.deepEqual(reply.paths, ['altText'], file.name);
    }
  });

  it('accepts valid alt text as far as validation goes (then stops at storage: 503, not 400)', async () => {
    const reply = await upload({ file: png(), fields: { altText: 'The NexaStack team at work' } });
    assert.equal(reply.status, 503);
    assert.equal(reply.code, 'SERVICE_UNAVAILABLE');
  });

  it('does NOT require alt text for a document (a PDF takes an optional description instead)', async () => {
    const reply = await upload({ file: { data: bytes(PDF_HEAD), name: 'brochure.pdf', type: 'application/pdf' } });
    assert.equal(reply.status, 503, 'passed validation with no alt text and no description');
    const withDescription = await upload({
      file: { data: bytes(PDF_HEAD), name: 'brochure.pdf', type: 'application/pdf' },
      fields: { description: 'Company brochure, 2026' },
    });
    assert.equal(withDescription.status, 503);
  });

  it('a document description over 300 characters is rejected, naming the field', async () => {
    const reply = await upload({
      file: { data: bytes(PDF_HEAD), name: 'brochure.pdf', type: 'application/pdf' },
      fields: { description: 'd'.repeat(301) },
    });
    assert.equal(reply.status, 400);
    assert.deepEqual(reply.paths, ['description']);
  });

  it('decides "image" from the bytes, not from the client: a PNG declared as a PDF still needs alt text', async () => {
    const reply = await upload({ file: { data: bytes(PNG_HEAD), name: 'sneaky.pdf', type: 'application/pdf' } });
    assert.deepEqual(reply.paths, ['altText']);
  });
});

describe('POST /media: type and size are enforced on the real bytes, whatever the client says', () => {
  const ALT = { altText: 'A description' };

  it('rejects HTML and scripts disguised as images or PDFs (name and declared type both lie)', async () => {
    for (const [name, type] of [
      ['photo.png', 'image/png'],
      ['photo.jpg', 'image/jpeg'],
      ['brief.pdf', 'application/pdf'],
      ['icon.svg', 'image/svg+xml'],
    ] as const) {
      const reply = await upload({
        file: { data: enc('<html><script>alert(1)</script></html>'), name, type },
        fields: ALT,
      });
      assert.equal(reply.status, 400, name);
      assert.deepEqual(reply.paths, ['file'], name);
      assert.match(reply.details[0] ?? '', /isn't a supported type/, name);
    }
  });

  it('rejects an executable and a ZIP/Office file named like an accepted type', async () => {
    for (const head of [[0x4d, 0x5a, 0x90, 0x00], [0x50, 0x4b, 0x03, 0x04]]) {
      const reply = await upload({ file: { data: bytes(head), name: 'report.pdf', type: 'application/pdf' }, fields: ALT });
      assert.equal(reply.status, 400);
      assert.deepEqual(reply.paths, ['file']);
    }
  });

  it('rejects an empty file', async () => {
    const reply = await upload({ file: { data: new Uint8Array(), name: 'empty.png', type: 'image/png' }, fields: ALT });
    assert.equal(reply.status, 400);
    assert.deepEqual(reply.paths, ['file']);
  });

  it('rejects a raster image or PDF over 10 MB with 413', async () => {
    for (const [head, name, type] of [
      [PNG_HEAD, 'big.png', 'image/png'],
      [PDF_HEAD, 'big.pdf', 'application/pdf'],
    ] as const) {
      const reply = await upload({ file: { data: bytes([...head], 10 * MB + 1), name, type }, fields: ALT });
      assert.equal(reply.status, 413, name);
      assert.equal(reply.code, 'PAYLOAD_TOO_LARGE');
    }
  });

  it('rejects an SVG over 1 MB with 413, though the same size would be fine as a PNG', async () => {
    const big = new Uint8Array(2 * MB).fill(0x20);
    big.set(enc('<svg xmlns="http://www.w3.org/2000/svg">'));
    const reply = await upload({ file: { data: big, name: 'big.svg', type: 'image/svg+xml' }, fields: ALT });
    assert.equal(reply.status, 413);

    const okPng = await upload({ file: { data: bytes(PNG_HEAD, 2 * MB), name: 'ok.png', type: 'image/png' }, fields: ALT });
    assert.equal(okPng.status, 503, 'a 2 MB PNG is within its limit');
  });

  it('rejects an SVG containing a script, an event handler or an external reference', async () => {
    for (const svg of [
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>',
    ]) {
      const reply = await upload({ file: { data: enc(svg), name: 'icon.svg', type: 'image/svg+xml' }, fields: ALT });
      assert.equal(reply.status, 400, svg);
      assert.match(reply.details[0] ?? '', /SVG can't be uploaded because/, svg);
    }
  });

  it('accepts a plain SVG drawing as far as validation goes', async () => {
    const svg = enc('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>');
    const reply = await upload({ file: { data: svg, name: 'dot.svg', type: 'image/svg+xml' }, fields: ALT });
    assert.equal(reply.status, 503);
  });

  it('rejects a request with no file, and a non-multipart request', async () => {
    assert.deepEqual((await upload({ fields: ALT })).paths, ['file']);

    const json = await fetch(`${base}/media`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ altText: 'x' }),
    });
    assert.equal(json.status, 400);
  });

  it('sends the standard error envelope and never leaks internals', async () => {
    const response = await fetch(`${base}/media`, {
      method: 'POST',
      body: (() => {
        const form = new FormData();
        form.append('file', new Blob([bytes(PNG_HEAD)], { type: 'image/png' }), 'a.png');
        return form;
      })(),
    });
    const text = await response.text();
    assert.equal(/stack|node_modules|\.ts:|mongo/i.test(text), false);
    const body = JSON.parse(text) as { success: boolean; error: { code: string; message: string } };
    assert.equal(body.success, false);
    assert.equal(typeof body.error.message, 'string');
  });
});
