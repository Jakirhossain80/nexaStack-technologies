import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

/**
 * THE EMAIL HOOK, NOT EMAIL DELIVERY.
 *
 * No transactional email provider has been chosen (root CLAUDE.md 22 item 4), so nothing is ever sent and
 * real delivery CANNOT be tested. What can be tested is the seam: that the hook is invoked with the right
 * data, that it never throws into the caller, and that it does not send even if a provider key appears.
 * The hook has no injectable sink, so these tests spy on its real output channel (`console.info`).
 *
 * Development mode. See notifications.production.test.ts for the production log shape.
 */

const env = process.env as Record<string, string | undefined>;
env['NODE_ENV'] = 'test';

const { notifyContactSubmission, notifyQuotationSubmission } = await import('./notifications');

let info: ReturnType<typeof mock.method<Console, 'info'>>;
let error: ReturnType<typeof mock.method<Console, 'error'>>;

beforeEach(() => {
  info = mock.method(console, 'info', () => {});
  error = mock.method(console, 'error', () => {});
});

afterEach(() => {
  mock.restoreAll();
  delete env['RESEND_API_KEY'];
});

describe('notifyContactSubmission (development)', () => {
  it('fires exactly once, as contact.received, carrying the stored id and the subject', () => {
    notifyContactSubmission({ id: 'abc123', subject: 'Test enquiry' });
    assert.equal(info.mock.callCount(), 1);
    const [message, fields] = info.mock.calls[0]!.arguments as [string, Record<string, string>];
    assert.match(message, /contact\.received/);
    assert.match(message, /nothing sent/);
    assert.deepEqual(fields, { id: 'abc123', subject: 'Test enquiry' });
  });

  it('never carries the sender name, email or message (only what the caller passed: id and subject)', () => {
    notifyContactSubmission({ id: 'abc123', subject: 'Test enquiry' });
    assert.deepEqual(Object.keys(info.mock.calls[0]!.arguments[1] as object).sort(), [
      'id',
      'subject',
    ]);
  });

  it('does not throw into the caller when logging itself fails, and reports the failure', () => {
    info.mock.mockImplementation(() => {
      throw new Error('log sink is down');
    });
    assert.doesNotThrow(() => notifyContactSubmission({ id: 'abc123', subject: 'x' }));
    assert.equal(error.mock.callCount(), 1);
    assert.match(String(error.mock.calls[0]!.arguments[0]), /contact\.received hook failed/);
  });
});

describe('notifyQuotationSubmission (development)', () => {
  it('fires exactly once, as quotation.received, carrying the reference number only', () => {
    notifyQuotationSubmission({ referenceNumber: 'NXQ-1234ABCD' });
    assert.equal(info.mock.callCount(), 1);
    const [message, fields] = info.mock.calls[0]!.arguments as [string, Record<string, string>];
    assert.match(message, /quotation\.received/);
    assert.deepEqual(fields, { referenceNumber: 'NXQ-1234ABCD' });
  });

  it('does not throw into the caller when logging itself fails', () => {
    info.mock.mockImplementation(() => {
      throw new Error('log sink is down');
    });
    assert.doesNotThrow(() => notifyQuotationSubmission({ referenceNumber: 'NXQ-1234ABCD' }));
    assert.equal(error.mock.callCount(), 1);
  });
});

describe('no provider is wired: nothing is sent even if a provider key appears', () => {
  it('makes no network request when RESEND_API_KEY is set', () => {
    env['RESEND_API_KEY'] = 're_test_dummy_key';
    const fetchSpy = mock.method(globalThis, 'fetch', () =>
      Promise.reject(new Error('the hook must not send anything')),
    );
    notifyContactSubmission({ id: 'abc123', subject: 'Test enquiry' });
    notifyQuotationSubmission({ referenceNumber: 'NXQ-1234ABCD' });
    assert.equal(fetchSpy.mock.callCount(), 0);
    assert.equal(info.mock.callCount(), 2);
  });
});
