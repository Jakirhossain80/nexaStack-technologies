import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

import type { ApiFailure } from '@nexastack/shared';

// Explicit test configuration; never load .env files or connect to a database.
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/nexastack_test';
process.env.JWT_SECRET = 'x'.repeat(40);
process.env.WEB_APP_URL = 'http://localhost:3000';
process.env.LOG_LEVEL = 'silent';
process.env.TRUST_PROXY = '0';

const { createApp } = await import('../app.js');

let server: Server;
let endpoint: string;

before(async () => {
  await new Promise<void>((resolve, reject) => {
    server = createApp().listen(0, '127.0.0.1', (error) => (error ? reject(error) : resolve()));
  });
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/contact`;
});

after(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
});

const enquiry = {
  name: 'Test Visitor',
  email: 'test@example.com',
  subject: 'Test enquiry',
  message: 'This synthetic message must never be acknowledged as saved.',
};

async function submit(body: unknown): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
}

describe('retired Express contact endpoint', () => {
  it('rejects a valid enquiry with 410 instead of claiming it was received', async () => {
    const response = await submit(enquiry);
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('location'), null, 'must not redirect personal data');
    const body = (await response.json()) as ApiFailure;
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'ENDPOINT_RETIRED');
    assert.match(body.error.message, /not saved/);
    assert.match(body.error.message, /\/contact/);
    assert.equal('data' in body, false);
  });

  it('retains validation rather than acknowledging invalid submissions', async () => {
    const response = await submit({});
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiFailure;
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  it('retains rate limiting and never accepts repeated submissions', async () => {
    let limited = false;
    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await submit(enquiry);
      assert.ok([410, 429].includes(response.status));
      const body = (await response.json()) as ApiFailure;
      assert.equal(body.success, false);
      if (response.status === 429) {
        assert.equal(body.error.code, 'RATE_LIMITED');
        limited = true;
      }
    }
    assert.equal(limited, true);
  });
});
