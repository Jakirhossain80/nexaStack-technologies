import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issuesByPath, parseValid } from '../test-utils/issues.js';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  adminRoleChangeSchema,
  adminStatusChangeSchema,
  changePasswordFormSchema,
  changePasswordSchema,
  createAdminUserSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from './auth.js';

describe('loginSchema', () => {
  it('accepts a valid email and password, trimming the email but never the password', () => {
    const data = parseValid(loginSchema, {
      email: '  test@example.com ',
      password: '  spaced pass  ',
    });
    assert.equal(data.email, 'test@example.com');
    assert.equal(data.password, '  spaced pass  ');
  });

  it('rejects a malformed email, a short password and missing fields', () => {
    assert.match(
      issuesByPath(loginSchema, { email: 'nope', password: 'longenough' })['email']?.[0] ?? '',
      /valid email/,
    );
    assert.match(
      issuesByPath(loginSchema, {
        email: 'test@example.com',
        password: 'x'.repeat(PASSWORD_MIN_LENGTH - 1),
      })['password']?.[0] ?? '',
      /at least 8 characters/,
    );
    const issues = issuesByPath(loginSchema, {});
    assert.match(issues['email']?.[0] ?? '', /enter your email/);
    assert.match(issues['password']?.[0] ?? '', /enter your password/);
  });

  it('rejects NoSQL-operator objects where strings are expected', () => {
    assert.equal(
      loginSchema.safeParse({ email: { $ne: null }, password: { $ne: null } }).success,
      false,
    );
    assert.equal(
      loginSchema.safeParse({ email: 'test@example.com', password: { $gt: '' } }).success,
      false,
    );
  });
});

describe('password reset schemas', () => {
  it('request: accepts an email only', () => {
    parseValid(passwordResetRequestSchema, { email: 'test@example.com' });
    assert.equal(passwordResetRequestSchema.safeParse({ email: 'nope' }).success, false);
  });

  it('confirm: needs a non-empty token and a new password of at least 8 characters', () => {
    parseValid(passwordResetConfirmSchema, { token: 'abc', newPassword: 'long-enough-1' });
    assert.match(
      issuesByPath(passwordResetConfirmSchema, { token: '', newPassword: 'long-enough-1' })[
        'token'
      ]?.[0] ?? '',
      /reset link/,
    );
    assert.match(
      issuesByPath(passwordResetConfirmSchema, { token: 'abc', newPassword: 'short' })[
        'newPassword'
      ]?.[0] ?? '',
      /at least 8/,
    );
  });
});

describe('changePasswordSchema and changePasswordFormSchema', () => {
  const valid = { currentPassword: 'old-password-1', newPassword: 'new-password-2' };

  it('accepts a different, in-range new password', () => {
    parseValid(changePasswordSchema, valid);
  });

  it('rejects a new password equal to the current one, reported on newPassword', () => {
    const issues = issuesByPath(changePasswordSchema, {
      currentPassword: 'same-password',
      newPassword: 'same-password',
    });
    assert.match(issues['newPassword']?.[0] ?? '', /different from your current one/);
  });

  it(`enforces the bcrypt ceiling: ${PASSWORD_MAX_LENGTH} accepted, ${PASSWORD_MAX_LENGTH + 1} refused`, () => {
    parseValid(changePasswordSchema, { ...valid, newPassword: 'a'.repeat(PASSWORD_MAX_LENGTH) });
    const issues = issuesByPath(changePasswordSchema, {
      ...valid,
      newPassword: 'a'.repeat(PASSWORD_MAX_LENGTH + 1),
    });
    assert.match(issues['newPassword']?.[0] ?? '', /72 characters or fewer/);
  });

  it('requires the current password', () => {
    const issues = issuesByPath(changePasswordSchema, { ...valid, currentPassword: '' });
    assert.match(issues['currentPassword']?.[0] ?? '', /current password/);
  });

  it('form variant: additionally requires the confirmation to match, reported on confirmNewPassword', () => {
    parseValid(changePasswordFormSchema, { ...valid, confirmNewPassword: valid.newPassword });
    const mismatch = issuesByPath(changePasswordFormSchema, {
      ...valid,
      confirmNewPassword: 'something-else-3',
    });
    assert.match(mismatch['confirmNewPassword']?.[0] ?? '', /do not match/);
    const missing = issuesByPath(changePasswordFormSchema, { ...valid });
    assert.match(missing['confirmNewPassword']?.[0] ?? '', /type the new password again/);
  });
});

describe('admin management schemas', () => {
  it('createAdminUserSchema: accepts each real role, refuses an unknown one, and has no password field', () => {
    for (const role of ['super_admin', 'admin', 'content_editor']) {
      parseValid(createAdminUserSchema, { email: 'test@example.com', role });
    }
    const issues = issuesByPath(createAdminUserSchema, {
      email: 'test@example.com',
      role: 'owner',
    });
    assert.match(issues['role']?.[0] ?? '', /valid role/);
    const data = parseValid(createAdminUserSchema, {
      email: 'test@example.com',
      role: 'admin',
      password: 'smuggled-in-1',
    });
    assert.equal('password' in data, false);
  });

  it('adminRoleChangeSchema and adminStatusChangeSchema accept only real values', () => {
    parseValid(adminRoleChangeSchema, { role: 'content_editor' });
    assert.equal(adminRoleChangeSchema.safeParse({ role: 'root' }).success, false);
    assert.equal(adminStatusChangeSchema.safeParse({ status: 'deleted' }).success, false);
    parseValid(adminStatusChangeSchema, { status: 'suspended' });
  });
});
