import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

/**
 * Turnstile with NO secret configured: skipped in development (so the forms stay usable locally) but
 * FAIL CLOSED in production: a public form must never silently run without bot protection because one
 * environment variable was forgotten. NODE_ENV is read per call, so both cases live in this one file.
 */

const env = process.env as Record<string, string | undefined>;
env['MONGODB_URI'] = 'mongodb://127.0.0.1:1/nexastack_test';
delete env['TURNSTILE_SECRET_KEY'];

const { verifyTurnstileToken } = await import('./turnstile');

let fetchSpy: ReturnType<typeof mock.method<typeof globalThis, 'fetch'>>;
let errorSpy: ReturnType<typeof mock.method<Console, 'error'>>;
const originalNodeEnv = env['NODE_ENV'];

beforeEach(() => {
  fetchSpy = mock.method(globalThis, 'fetch', async () => new Response('{"success":true}'));
  errorSpy = mock.method(console, 'error', () => {});
  mock.method(console, 'warn', () => {});
});

afterEach(() => {
  mock.restoreAll();
  env['NODE_ENV'] = originalNodeEnv;
});

describe('verifyTurnstileToken with no secret configured', () => {
  it('development: skipped, without calling Cloudflare', async () => {
    env['NODE_ENV'] = 'development';
    assert.deepEqual(await verifyTurnstileToken(undefined, 'contact'), { outcome: 'skipped' });
    assert.deepEqual(await verifyTurnstileToken('any-token', 'quotation'), { outcome: 'skipped' });
    assert.equal(fetchSpy.mock.callCount(), 0);
  });

  it('production: fails closed as "unavailable", logs at error level, and never calls Cloudflare', async () => {
    env['NODE_ENV'] = 'production';
    assert.deepEqual(await verifyTurnstileToken('any-token', 'contact'), {
      outcome: 'unavailable',
    });
    assert.deepEqual(await verifyTurnstileToken(undefined, 'quotation'), {
      outcome: 'unavailable',
    });
    assert.equal(fetchSpy.mock.callCount(), 0);
    assert.equal(errorSpy.mock.callCount(), 2);
    assert.match(
      String(errorSpy.mock.calls[0]!.arguments[0]),
      /TURNSTILE_SECRET_KEY is not set in production/,
    );
  });
});
