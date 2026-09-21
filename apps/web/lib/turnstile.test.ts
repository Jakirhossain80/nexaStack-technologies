import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

/**
 * Cloudflare Turnstile verification, with the siteverify call stubbed so it is deterministic and offline.
 * (A real round trip against Cloudflare's published test keys is part of the browser suite.)
 * The secret is read at import, so this file is the "configured" case; see turnstile.unconfigured.test.ts.
 */

const env = process.env as Record<string, string | undefined>;
env['MONGODB_URI'] = 'mongodb://127.0.0.1:1/nexastack_test';
env['TURNSTILE_SECRET_KEY'] = 'test-secret-not-a-real-key';

const { verifyTurnstileToken } = await import('./turnstile');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

let fetchSpy: ReturnType<typeof mock.method<typeof globalThis, 'fetch'>>;

function stubSiteverify(body: unknown, init: ResponseInit = {}) {
  fetchSpy.mock.mockImplementation(async () => new Response(JSON.stringify(body), init));
}

beforeEach(() => {
  fetchSpy = mock.method(globalThis, 'fetch', async () => new Response('{}'));
  mock.method(console, 'error', () => {});
  mock.method(console, 'warn', () => {});
});

afterEach(() => {
  mock.restoreAll();
});

describe('verifyTurnstileToken with a secret configured', () => {
  it('fails without calling Cloudflare when there is no token', async () => {
    assert.deepEqual(await verifyTurnstileToken(undefined, 'contact'), { outcome: 'failed' });
    assert.deepEqual(await verifyTurnstileToken('', 'quotation'), { outcome: 'failed' });
    assert.equal(fetchSpy.mock.callCount(), 0);
  });

  it('passes when Cloudflare says success, and posts the secret and token to the real siteverify URL', async () => {
    stubSiteverify({ success: true });
    assert.deepEqual(await verifyTurnstileToken('token-abc', 'contact'), { outcome: 'passed' });
    assert.equal(fetchSpy.mock.callCount(), 1);
    const [url, init] = fetchSpy.mock.calls[0]!.arguments as [string, RequestInit];
    assert.equal(url, VERIFY_URL);
    assert.equal(init.method, 'POST');
    const body = new URLSearchParams(String(init.body));
    assert.equal(body.get('secret'), 'test-secret-not-a-real-key');
    assert.equal(body.get('response'), 'token-abc');
  });

  it('fails when Cloudflare says the token is invalid', async () => {
    stubSiteverify({ success: false, 'error-codes': ['invalid-input-response'] });
    assert.deepEqual(await verifyTurnstileToken('bad-token', 'contact'), { outcome: 'failed' });
  });

  it('fails (closed) when the siteverify request throws, and when it answers with something that is not JSON', async () => {
    fetchSpy.mock.mockImplementation(async () => {
      throw new Error('network down');
    });
    assert.deepEqual(await verifyTurnstileToken('token-abc', 'quotation'), { outcome: 'failed' });
    fetchSpy.mock.mockImplementation(async () => new Response('<html>502</html>', { status: 502 }));
    assert.deepEqual(await verifyTurnstileToken('token-abc', 'quotation'), { outcome: 'failed' });
  });
});
