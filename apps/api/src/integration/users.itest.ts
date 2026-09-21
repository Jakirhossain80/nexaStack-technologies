import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ADMIN_LOCK_MESSAGES } from '@nexastack/shared';

import { API, freshIp, startApi, type Api } from './support/harness.js';

/**
 * Admin account management (super_admin only) against a real database: creation with a one-time temporary
 * password, bcrypt storage, suspension that kills live sessions, role changes, and the safeguards that stop
 * the last super_admin (or yourself) being locked out. This file owns its whole database, so "the only
 * super_admin" is a real, controllable state.
 */

let api: Api;
let superAdmin: { id: string; email: string; password: string };
let cookie: string;

before(async () => {
  api = await startApi();
  superAdmin = await api.seedAdmin('super_admin');
  cookie = await api.loginAs(superAdmin);
});

after(async () => {
  await api.stop();
});

const call = (path: string, method = 'GET', body?: unknown, as = cookie) =>
  api.request(`${API}${path}`, { method, cookie: as, body });
const stored = (id: string) => api.models.AdminUser.findById(id).select('+passwordHash').lean();

describe('creating an account', () => {
  it('returns the temporary password ONCE, stores only a bcrypt (cost 12) hash, and starts the account locked to a password change', async () => {
    const created = await call('/admin/users', 'POST', {
      email: 'test-new-editor@example.com',
      role: 'content_editor',
    });
    assert.equal(created.status, 201);
    const { user, temporaryPassword } = created.body.data;
    assert.equal(user.email, 'test-new-editor@example.com');
    assert.equal(user.role, 'content_editor');
    assert.equal(user.mustChangePassword, true);
    assert.equal(user.status, 'active');
    assert.ok(
      typeof temporaryPassword === 'string' && temporaryPassword.length >= 12,
      'a strong temporary password',
    );
    assert.doesNotMatch(JSON.stringify(user), /passwordHash|\$2[aby]\$/);

    const row = await stored(user.id);
    assert.match(row!.passwordHash, /^\$2[aby]\$12\$/);
    assert.notEqual(row!.passwordHash, temporaryPassword);
    assert.equal(String(row!.createdByAdminId), superAdmin.id);

    const list = await call('/admin/users');
    assert.doesNotMatch(
      list.text,
      /temporaryPassword|passwordHash|\$2[aby]\$/,
      'the list never shows a password or hash',
    );

    // The temporary password works, and only lets the new admin change it.
    const newCookie = await api.loginAs({
      email: 'test-new-editor@example.com',
      password: temporaryPassword,
    });
    const blocked = await call('/admin/blog/posts', 'GET', undefined, newCookie);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error?.code, 'PASSWORD_CHANGE_REQUIRED');
    const audit = await api.models.AdminActivityLog.findOne({
      eventType: 'admin_account_created',
      'metadata.targetEmail': 'test-new-editor@example.com',
    }).lean();
    assert.equal(String(audit?.adminUserId), superAdmin.id);
    assert.doesNotMatch(
      JSON.stringify(audit),
      new RegExp(temporaryPassword),
      'the audit log never records the password',
    );
  });

  it('refuses a duplicate email (any case) with 409, an invalid role or email with 400, and creates nothing', async () => {
    await call('/admin/users', 'POST', { email: 'test-dup@example.com', role: 'admin' });
    const before = await api.models.AdminUser.countDocuments();
    const dup = await call('/admin/users', 'POST', {
      email: 'TEST-DUP@example.com',
      role: 'admin',
    });
    assert.equal(dup.status, 409);
    assert.equal(
      (await call('/admin/users', 'POST', { email: 'test-x@example.com', role: 'owner' })).status,
      400,
    );
    assert.equal(
      (await call('/admin/users', 'POST', { email: 'not-an-email', role: 'admin' })).status,
      400,
    );
    assert.equal(await api.models.AdminUser.countDocuments(), before);
  });
});

describe('suspending and reactivating', () => {
  it('suspending revokes every live session at once and blocks sign-in; reactivating allows it again', async () => {
    const target = await api.seedAdmin('admin');
    const targetCookie = await api.loginAs(target);
    assert.equal((await call('/admin/enquiries', 'GET', undefined, targetCookie)).status, 200);

    const suspended = await call(`/admin/users/${target.id}/status`, 'PATCH', {
      status: 'suspended',
    });
    assert.equal(suspended.status, 200);
    assert.equal((await stored(target.id))?.status, 'suspended');
    assert.equal(
      (await call('/admin/enquiries', 'GET', undefined, targetCookie)).status,
      401,
      'the live session is dead',
    );
    assert.equal(
      await api.models.AdminSession.countDocuments({ adminUserId: target.id, revokedAt: null }),
      0,
      'every session record is revoked',
    );
    const refused = await api.request(`${API}/auth/login`, {
      method: 'POST',
      body: { email: target.email, password: target.password },
      ip: freshIp(),
    });
    assert.equal(refused.status, 403);

    assert.equal(
      (await call(`/admin/users/${target.id}/status`, 'PATCH', { status: 'active' })).status,
      200,
    );
    assert.equal(
      (
        await api.request(`${API}/auth/login`, {
          method: 'POST',
          body: { email: target.email, password: target.password },
          ip: freshIp(),
        })
      ).status,
      200,
    );
  });
});

describe('role changes', () => {
  it('changes a role, takes effect on the target’s very next request, and is audit-logged', async () => {
    const target = await api.seedAdmin('content_editor');
    const targetCookie = await api.loginAs(target);
    assert.equal((await call('/admin/enquiries', 'GET', undefined, targetCookie)).status, 403);
    assert.equal(
      (await call(`/admin/users/${target.id}/role`, 'PATCH', { role: 'admin' })).status,
      200,
    );
    assert.equal((await stored(target.id))?.role, 'admin');
    assert.equal((await call('/admin/enquiries', 'GET', undefined, targetCookie)).status, 200);
    assert.ok(
      await api.models.AdminActivityLog.exists({
        eventType: 'admin_role_changed',
        'metadata.targetId': target.id,
      }),
    );
  });

  it('an unknown role is a 400 and an unknown account a 404', async () => {
    const target = await api.seedAdmin('admin');
    assert.equal(
      (await call(`/admin/users/${target.id}/role`, 'PATCH', { role: 'root' })).status,
      400,
    );
    assert.equal((await stored(target.id))?.role, 'admin');
    assert.equal(
      (await call('/admin/users/507f1f77bcf86cd799439099/role', 'PATCH', { role: 'admin' })).status,
      404,
    );
  });
});

describe('resetting a password', () => {
  it('issues a new one-time temporary password, revokes sessions, and forces a change again', async () => {
    const target = await api.seedAdmin('admin');
    const targetCookie = await api.loginAs(target);
    const reset = await call(`/admin/users/${target.id}/reset-password`, 'POST');
    assert.equal(reset.status, 200);
    const temp = reset.body.data.temporaryPassword as string;
    assert.ok(temp && temp !== target.password);
    assert.equal(
      (await call('/admin/enquiries', 'GET', undefined, targetCookie)).status,
      401,
      'old sessions are revoked',
    );
    assert.equal(
      (
        await api.request(`${API}/auth/login`, {
          method: 'POST',
          body: { email: target.email, password: target.password },
          ip: freshIp(),
        })
      ).status,
      401,
      'the old password is dead',
    );
    const newCookie = await api.loginAs({ email: target.email, password: temp });
    assert.equal(
      (await call('/admin/enquiries', 'GET', undefined, newCookie)).body.error?.code,
      'PASSWORD_CHANGE_REQUIRED',
    );
    assert.equal((await stored(target.id))?.mustChangePassword, true);
  });
});

describe('the lock-out safeguards (nobody can strand the site without a super_admin)', () => {
  it('you cannot suspend or change the role of your OWN account', async () => {
    const suspend = await call(`/admin/users/${superAdmin.id}/status`, 'PATCH', {
      status: 'suspended',
    });
    assert.equal(suspend.status, 409);
    assert.equal(
      suspend.body.error?.message,
      ADMIN_LOCK_MESSAGES.last_super_admin,
      'as the only super_admin, this is the more important reason',
    );
    const demote = await call(`/admin/users/${superAdmin.id}/role`, 'PATCH', { role: 'admin' });
    assert.equal(demote.status, 409);
    const row = await stored(superAdmin.id);
    assert.equal(row?.role, 'super_admin');
    assert.equal(row?.status, 'active');
    assert.equal((await call('/auth/session')).status, 200, 'and you are still signed in');
  });

  it('the last active super_admin cannot be demoted or suspended by ANOTHER super_admin either, until a second one exists', async () => {
    const second = await api.seedAdmin('super_admin');
    const secondCookie = await api.loginAs(second);
    // Two super_admins now: the second may act on the first.
    assert.equal(
      (await call(`/admin/users/${superAdmin.id}/role`, 'PATCH', { role: 'admin' }, secondCookie))
        .status,
      200,
    );
    // The first is now an admin, so the second is the ONLY active super_admin: nobody (even themselves) can remove them.
    const self = await call(
      `/admin/users/${second.id}/status`,
      'PATCH',
      { status: 'suspended' },
      secondCookie,
    );
    assert.equal(self.status, 409);
    assert.equal((await stored(second.id))?.status, 'active');
    // Put the fixture back for any later test in this file.
    await api.models.AdminUser.updateOne({ _id: superAdmin.id }, { role: 'super_admin' });
  });

  it('an admin who was demoted can no longer manage accounts', async () => {
    const editor = await api.seedAdmin('admin');
    const editorCookie = await api.loginAs(editor);
    assert.equal((await call('/admin/users', 'GET', undefined, editorCookie)).status, 403);
  });
});
