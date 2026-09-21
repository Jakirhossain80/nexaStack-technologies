import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { API, startApi, type Api } from './support/harness.js';

/**
 * Cross-cutting behaviour of the real app: the response envelope on every kind of failure, security headers,
 * health endpoints, and body limits. Nothing here needs a signed-in admin, because these are the first things
 * an anonymous client (or an attacker) sees.
 */

let api: Api;

before(async () => {
  api = await startApi();
});

after(async () => {
  await api.stop();
});

describe('health', () => {
  it('GET /health is liveness with no dependencies', async () => {
    const reply = await api.request('/health');
    assert.equal(reply.status, 200);
    assert.equal(reply.body.success, true);
  });

  it('GET /health/ready checks the real database connection (200 while connected)', async () => {
    const reply = await api.request('/health/ready');
    assert.equal(reply.status, 200, reply.text);
    assert.equal(reply.body.success, true);
  });
});

describe('the error envelope (root CLAUDE.md 11.2) on every kind of failure', () => {
  const failure = (
    reply: {
      status: number;
      body: { success: boolean; error?: { code: string; message: string } };
    },
    status: number,
    code: string,
  ) => {
    assert.equal(reply.status, status);
    assert.equal(reply.body.success, false);
    assert.equal(reply.body.error?.code, code);
    assert.equal(typeof reply.body.error?.message, 'string');
  };

  it('an unknown route is a 404 envelope, not an HTML page or framework default', async () => {
    const reply = await api.request(`${API}/no-such-route`);
    failure(reply, 404, 'NOT_FOUND');
    assert.match(reply.headers.get('content-type') ?? '', /application\/json/);
    assert.doesNotMatch(reply.text, /Cannot GET|<html|express/i);
  });

  it('unauthenticated -> 401, malformed JSON -> 400, oversized body -> 413, all in the envelope', async () => {
    failure(await api.request(`${API}/admin/enquiries`), 401, 'UNAUTHENTICATED');
    failure(
      await api.request(`${API}/auth/login`, { method: 'POST', rawBody: '{"email": ' }),
      400,
      'INVALID_JSON',
    );
    failure(
      await api.request(`${API}/auth/login`, {
        method: 'POST',
        rawBody: JSON.stringify({ email: 'test@example.com', password: 'x'.repeat(150_000) }),
      }),
      413,
      'PAYLOAD_TOO_LARGE',
    );
  });

  it('a wrong method on a real path is not a 500', async () => {
    const reply = await api.request(`${API}/auth/session`, { method: 'DELETE' });
    assert.ok([401, 404, 405].includes(reply.status), String(reply.status));
    assert.equal(reply.body.success, false);
  });

  it('an unreadable body encoding is a client error, not a 500', async () => {
    const reply = await api.request(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-7' },
      rawBody: '{"email":"x"}',
    });
    assert.ok(reply.status >= 400 && reply.status < 500, String(reply.status));
    assert.equal(reply.body.success, false);
  });

  it('every response carries a request id, for correlating a report with a log line', async () => {
    const reply = await api.request(`${API}/admin/enquiries`);
    assert.match(reply.headers.get('x-request-id') ?? '', /.+/);
  });
});

describe('security headers on API responses', () => {
  it('sends the hardened Helmet set: nosniff, no framing, no referrer, HSTS, a deny-everything CSP, and no X-Powered-By', async () => {
    const reply = await api.request(`${API}/admin/enquiries`);
    assert.equal(reply.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(reply.headers.get('x-powered-by'), null, 'do not advertise the framework');
    assert.equal(reply.headers.get('referrer-policy'), 'no-referrer');
    assert.match(reply.headers.get('strict-transport-security') ?? '', /max-age=\d+/);
    const csp = reply.headers.get('content-security-policy') ?? '';
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
  });

  it('private data is never cacheable: auth and admin responses say no-store', async () => {
    for (const path of [`${API}/admin/enquiries`, `${API}/auth/session`]) {
      const reply = await api.request(path);
      assert.match(reply.headers.get('cache-control') ?? '', /no-store/i, path);
    }
  });
});
