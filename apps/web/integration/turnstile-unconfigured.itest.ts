import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { setupWeb, validContact, validQuotation, type Web } from './support';

/**
 * Turnstile with NO secret configured. In development that is skipped so the forms stay usable locally; in
 * PRODUCTION it must FAIL CLOSED: a public form may never silently run with no bot protection because one
 * environment variable was forgotten. `NODE_ENV` is read per request, so both modes live in this file.
 */

let web: Web;
let info: ReturnType<typeof mock.method<Console, 'info'>>;
const env = process.env as Record<string, string | undefined>;

before(async () => {
  web = await setupWeb();
});

after(async () => {
  await web.stop();
});

beforeEach(() => {
  info = mock.method(console, 'info', () => {});
  mock.method(console, 'error', () => {});
  mock.method(console, 'warn', () => {});
});

afterEach(() => {
  mock.restoreAll();
  env['NODE_ENV'] = 'test';
});

const FORMS = [
  {
    name: '/api/contact',
    post: (body: unknown) => web.postContact(body),
    valid: validContact,
    count: () => web.contacts.countDocuments(),
    hook: 'contact.received',
  },
  {
    name: '/api/quotation',
    post: (body: unknown) => web.postQuotation(body),
    valid: validQuotation,
    count: () => web.quotations.countDocuments(),
    hook: 'quotation.received',
  },
] as const;

for (const form of FORMS) {
  describe(form.name, () => {
    it('outside production: verification is skipped and the submission is accepted', async () => {
      env['NODE_ENV'] = 'development';
      const before = await form.count();
      const reply = await form.post(form.valid);
      assert.equal(reply.status, 201);
      assert.equal(await form.count(), before + 1);
    });

    it('in PRODUCTION: refuses with 503, stores nothing, fires no hook, and tells the visitor another way to get in touch', async () => {
      env['NODE_ENV'] = 'production';
      const before = await form.count();
      const reply = await form.post({ ...form.valid, turnstileToken: 'anything' });
      assert.equal(reply.status, 503);
      assert.equal(reply.body.error?.code, 'SERVICE_UNAVAILABLE');
      assert.match(reply.body.error?.message ?? '', /email or call us/i);
      assert.equal(await form.count(), before);
      assert.equal(
        info.mock.calls.filter((call) => String(call.arguments[0]).includes(form.hook)).length,
        0,
      );
    });
  });
}
