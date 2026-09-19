import { z } from 'zod';

/**
 * Whether an admin account can sign in and act. A suspended account is refused at login AND every
 * session it had is revoked at once. Accounts are never deleted through the admin: suspending keeps
 * the record (and the audit trail that refers to it).
 */
export const ADMIN_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type AdminStatus = (typeof ADMIN_STATUS)[keyof typeof ADMIN_STATUS];

export const ADMIN_STATUSES = [ADMIN_STATUS.ACTIVE, ADMIN_STATUS.SUSPENDED] as const;

export const adminStatusSchema = z.enum(ADMIN_STATUSES, {
  error: 'Please choose a valid status: active or suspended',
});

/** Why an action on an account is not offered. Shown to the admin as words, not just a greyed button. */
export type AdminLockReason = 'last_super_admin' | 'self';

/**
 * The words for each lock reason. One copy: the API sends it as the 409 message when such a change is
 * attempted anyway, and the users page shows it next to the disabled control that would have caused it.
 */
export const ADMIN_LOCK_MESSAGES: Record<AdminLockReason, string> = {
  last_super_admin:
    'This is the only active super admin. Suspending or demoting them would leave nobody able to manage accounts. Make another account a super admin first.',
  self: 'You can’t suspend or change the role of your own account. Ask another super admin to do it.',
};
