import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

/**
 * Production mode of the notification hook (the log shape is chosen once, at module load, from NODE_ENV,
 * so this needs its own process: `node --test` gives every file one). Still the hook, not delivery.
 */

const env = process.env as Record<string, string | undefined>;
env['NODE_ENV'] = 'production';

const { notifyContactSubmission, notifyQuotationSubmission } = await import('./notifications');

let info: ReturnType<typeof mock.method<Console, 'info'>>;

beforeEach(() => {
  info = mock.method(console, 'info', () => {});
});

afterEach(() => {
  mock.restoreAll();
});

describe('notifications in production', () => {
  it('logs one structured JSON line per contact submission, marked deferred, with the id but NOT the subject', () => {
    notifyContactSubmission({
      id: 'abc123',
      subject: 'Sender-supplied subject that must not be logged',
    });
    assert.equal(info.mock.callCount(), 1);
    const line = String(info.mock.calls[0]!.arguments[0]);
    assert.deepEqual(JSON.parse(line), {
      event: 'contact.received',
      id: 'abc123',
      delivery: 'deferred',
    });
    assert.doesNotMatch(line, /Sender-supplied/);
  });

  it('logs one structured JSON line per quotation submission, with the reference number', () => {
    notifyQuotationSubmission({ referenceNumber: 'NXQ-1234ABCD' });
    assert.equal(info.mock.callCount(), 1);
    assert.deepEqual(JSON.parse(String(info.mock.calls[0]!.arguments[0])), {
      event: 'quotation.received',
      referenceNumber: 'NXQ-1234ABCD',
      delivery: 'deferred',
    });
  });
});
