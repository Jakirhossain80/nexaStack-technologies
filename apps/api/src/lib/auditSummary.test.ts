import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dhakaDayRange } from './auditDates.js';
import { summarizeAdminEvent } from './auditSummary.js';

describe('summarizeAdminEvent', () => {
  it('says what happened and to whom, for each account event', () => {
    assert.equal(
      summarizeAdminEvent('admin_account_created', { targetEmail: 'ed@x.co', role: 'content_editor' }),
      'Created ed@x.co as content editor',
    );
    assert.equal(
      summarizeAdminEvent('admin_role_changed', { targetEmail: 'ed@x.co', from: 'content_editor', to: 'admin' }),
      'ed@x.co: content editor → admin',
    );
    assert.equal(summarizeAdminEvent('admin_account_suspended', { targetEmail: 'ed@x.co' }), 'Suspended ed@x.co');
    assert.equal(summarizeAdminEvent('admin_account_activated', { targetEmail: 'ed@x.co' }), 'Reactivated ed@x.co');
    assert.equal(
      summarizeAdminEvent('admin_password_reset', { targetEmail: 'ed@x.co' }),
      'Reset the temporary password for ed@x.co',
    );
  });

  it('distinguishes a forced first-login password change from a voluntary one', () => {
    assert.equal(summarizeAdminEvent('password_changed', { forced: true }), 'Changed their temporary password');
    assert.equal(summarizeAdminEvent('password_changed', { forced: false }), 'Changed their password');
    assert.equal(summarizeAdminEvent('password_changed', undefined), 'Changed their password');
  });

  it('returns null for every other event, and tolerates missing or odd metadata', () => {
    for (const type of ['login_success', 'media_deleted', 'blog_post_created', 'logout']) {
      assert.equal(summarizeAdminEvent(type, { anything: 1 }), null, type);
    }
    assert.equal(summarizeAdminEvent('admin_role_changed', undefined), 'an account: unknown role → unknown role');
    assert.equal(summarizeAdminEvent('admin_account_created', { targetEmail: 5, role: 'wizard' }), 'Created an account as unknown role');
  });

  it('can never print a password: it reads only the named safe fields', () => {
    const summary = summarizeAdminEvent('admin_account_created', {
      targetEmail: 'ed@x.co',
      role: 'admin',
      temporaryPassword: 'SuperSecret123',
      password: 'SuperSecret123',
    });
    assert.equal(summary?.includes('SuperSecret123'), false);
  });
});

describe('dhakaDayRange (a date filter means a day on the founder’s clock, UTC+6)', () => {
  it('starts a day at 00:00 Dhaka, which is 18:00 UTC the evening before', () => {
    assert.equal(dhakaDayRange('2026-09-19', undefined).gte?.toISOString(), '2026-09-18T18:00:00.000Z');
  });

  it('ends a day at 23:59:59.999 Dhaka, inclusive', () => {
    assert.equal(dhakaDayRange(undefined, '2026-09-19').lte?.toISOString(), '2026-09-19T17:59:59.999Z');
  });

  it('a one-day range covers exactly 24 hours, so an early-morning Dhaka event is not lost', () => {
    const { gte, lte } = dhakaDayRange('2026-09-19', '2026-09-19');
    assert.ok(gte && lte);
    assert.equal(lte.getTime() - gte.getTime(), 24 * 60 * 60 * 1000 - 1);
    const earlyMorningDhaka = new Date('2026-09-19T02:30:00+06:00'); // 20:30 UTC on the 18th
    assert.ok(earlyMorningDhaka >= gte && earlyMorningDhaka <= lte);
  });

  it('is open on the side that is not given', () => {
    assert.deepEqual(dhakaDayRange(undefined, undefined), {});
    assert.equal('lte' in dhakaDayRange('2026-09-19', undefined), false);
    assert.equal('gte' in dhakaDayRange(undefined, '2026-09-19'), false);
  });
});
