import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';

import { readMultipart } from './multipart.js';

const BOUNDARY = '----nexastack-test-boundary';
const MB = 1024 * 1024;

interface Part {
  name: string;
  value?: string;
  filename?: string;
  contentType?: string;
  data?: Uint8Array;
}

function body(parts: Part[]): Buffer {
  const chunks: Buffer[] = [];
  for (const part of parts) {
    const disposition =
      `Content-Disposition: form-data; name="${part.name}"` +
      (part.filename !== undefined ? `; filename="${part.filename}"` : '');
    const type = part.contentType ? `\r\nContent-Type: ${part.contentType}` : '';
    chunks.push(Buffer.from(`--${BOUNDARY}\r\n${disposition}${type}\r\n\r\n`));
    chunks.push(part.data ? Buffer.from(part.data) : Buffer.from(part.value ?? '', 'utf8'));
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

/** A stand-in for Express's request: a readable stream with headers. */
function request(
  payload: Buffer,
  headers: Record<string, string | undefined> = {},
  chunkSize = 16 * 1024,
): IncomingMessage {
  const chunks: Buffer[] = [];
  for (let i = 0; i < payload.length; i += chunkSize) chunks.push(payload.subarray(i, i + chunkSize));
  return Object.assign(Readable.from(chunks), {
    headers: {
      'content-type': `multipart/form-data; boundary=${BOUNDARY}`,
      'content-length': String(payload.length),
      ...headers,
    },
  }) as unknown as IncomingMessage;
}

async function statusOf(promise: Promise<unknown>): Promise<{ status: number; path?: string }> {
  try {
    await promise;
  } catch (err) {
    const e = err as { statusCode?: number; details?: { path: string }[] };
    return { status: e.statusCode ?? 0, path: e.details?.[0]?.path };
  }
  assert.fail('expected the upload to be rejected');
}

describe('readMultipart', () => {
  it('reads a file and text fields; binary bytes (including CRLF and NUL) survive intact', async () => {
    const data = Uint8Array.from([0x89, 0x50, 0x0d, 0x0a, 0x00, 0xff, 0x0d, 0x0a, 0x2d, 0x2d, 0x7f]);
    const parsed = await readMultipart(
      request(
        body([
          { name: 'altText', value: 'A team photo — বাংলা' },
          { name: 'file', filename: 'photo.png', contentType: 'image/png', data },
        ]),
      ),
      10 * MB,
    );
    assert.equal(parsed.fields.altText, 'A team photo — বাংলা');
    assert.ok(parsed.file);
    assert.equal(parsed.file.name, 'photo.png');
    assert.deepEqual(new Uint8Array(await parsed.file.arrayBuffer()), data);
  });

  it('a request with fields but no file yields file: null (the caller decides that is an error)', async () => {
    const parsed = await readMultipart(request(body([{ name: 'altText', value: 'x' }])), 10 * MB);
    assert.equal(parsed.file, null);
  });

  it('reads a multi-megabyte file delivered in many chunks', async () => {
    const data = new Uint8Array(3 * MB).fill(0x41);
    const parsed = await readMultipart(
      request(body([{ name: 'file', filename: 'big.pdf', data }]), {}, 64 * 1024),
      10 * MB,
    );
    assert.equal(parsed.file?.size, 3 * MB);
  });

  it('rejects a non-multipart request (JSON, or a missing boundary) with a 400 on "file"', async () => {
    assert.deepEqual(
      await statusOf(readMultipart(request(Buffer.from('{}'), { 'content-type': 'application/json' }), MB)),
      { status: 400, path: 'file' },
    );
    assert.equal(
      (await statusOf(readMultipart(request(Buffer.from('x'), { 'content-type': 'multipart/form-data' }), MB))).status,
      400,
    );
    assert.equal(
      (await statusOf(readMultipart(request(Buffer.from('x'), { 'content-type': undefined }), MB))).status,
      400,
    );
  });

  it('refuses a declared Content-Length over the cap with 413, without reading the body', async () => {
    let read = false;
    const req = request(body([{ name: 'file', filename: 'x.pdf', data: new Uint8Array(10) }]), {
      'content-length': String(50 * MB),
    });
    req.on('data', () => {
      read = true;
    });
    // `on('data')` would start flowing; detach immediately so only the pre-check can be observed.
    req.removeAllListeners('data');
    assert.deepEqual(await statusOf(readMultipart(req, 10 * MB)), { status: 413, path: 'file' });
    assert.equal(read, false);
  });

  it('cuts off a body that lies about its length (or is chunked) once it passes the cap', async () => {
    const data = new Uint8Array(3 * MB).fill(0x42);
    const payload = body([{ name: 'file', filename: 'big.pdf', data }]);
    // Declares a tiny length, or none, but streams 3 MB against a 1 MB cap.
    for (const lie of ['100', undefined]) {
      const result = await statusOf(
        readMultipart(request(payload, { 'content-length': lie }, 64 * 1024), MB / 2),
      );
      assert.deepEqual(result, { status: 413, path: 'file' }, `content-length: ${lie}`);
    }
  });

  it('rejects two files, a file under another field name, and garbage with a valid boundary (400)', async () => {
    const two = body([
      { name: 'file', filename: 'a.png', data: new Uint8Array(3) },
      { name: 'file', filename: 'b.png', data: new Uint8Array(3) },
    ]);
    assert.equal((await statusOf(readMultipart(request(two), MB))).status, 400);

    const other = body([{ name: 'attachment', filename: 'a.png', data: new Uint8Array(3) }]);
    assert.equal((await statusOf(readMultipart(request(other), MB))).status, 400);

    assert.equal(
      (await statusOf(readMultipart(request(Buffer.from('this is not multipart at all')), MB))).status,
      400,
    );
  });

  it('rejects an over-long text field, naming the field', async () => {
    const result = await statusOf(
      readMultipart(request(body([{ name: 'altText', value: 'x'.repeat(2_500) }])), MB),
    );
    assert.deepEqual(result, { status: 400, path: 'altText' });
  });
});
