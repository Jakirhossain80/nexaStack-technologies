import {
  ADMIN_LOCK_MESSAGES,
  ADMIN_STATUS,
  type AdminLockReason,
  type AdminStatus,
  type Role,
} from '@nexastack/shared';

/**
 * The rules that protect the admin area from locking itself out. Pure, so they can be tested without
 * a database and shared by the API (which enforces them) and the users list (which explains them).
 *
 *  1. The last ACTIVE `super_admin` can never be suspended or demoted. With no super_admin nobody can
 *     manage accounts again, and the only recovery would be editing the database by hand.
 *  2. Nobody can suspend or change the role of THEIR OWN account. It would end their own session or
 *     strip their own access by accident; another super_admin can do it deliberately.
 */

export interface AccountSnapshot {
  id: string;
  role: Role;
  status: AdminStatus;
}

export type AccountChange =
  | { kind: 'role'; role: Role }
  | { kind: 'status'; status: AdminStatus };

const isActiveSuperAdmin = (account: AccountSnapshot): boolean =>
  account.role === 'super_admin' && account.status === ADMIN_STATUS.ACTIVE;

/** Would this change stop the account being an active super_admin? */
function removesSuperAdmin(account: AccountSnapshot, change: AccountChange): boolean {
  if (!isActiveSuperAdmin(account)) return false;
  return change.kind === 'role'
    ? change.role !== 'super_admin'
    : change.status !== ADMIN_STATUS.ACTIVE;
}

/**
 * Why this change must be refused, or null if it is allowed. `activeSuperAdminCount` counts every
 * active super_admin INCLUDING the target. When both rules apply, the last-super-admin one is reported:
 * it is the more useful thing to tell someone who is the only one.
 */
export function findSafeguardViolation(input: {
  actorId: string;
  target: AccountSnapshot;
  change: AccountChange;
  activeSuperAdminCount: number;
}): AdminLockReason | null {
  const { actorId, target, change, activeSuperAdminCount } = input;
  if (removesSuperAdmin(target, change) && activeSuperAdminCount <= 1) return 'last_super_admin';
  if (actorId === target.id) return 'self';
  return null;
}

/**
 * The same rules from the users list's point of view: is suspending or changing the role of this
 * account refused right now, and why? Drives the disabled state and its visible explanation.
 */
export function lockedReasonFor(input: {
  actorId: string;
  target: AccountSnapshot;
  activeSuperAdminCount: number;
}): AdminLockReason | null {
  const { actorId, target, activeSuperAdminCount } = input;
  if (isActiveSuperAdmin(target) && activeSuperAdminCount <= 1) return 'last_super_admin';
  if (actorId === target.id) return 'self';
  return null;
}

/** The wording lives in shared, so the users page shows exactly what the API would answer. */
export const SAFEGUARD_MESSAGES = ADMIN_LOCK_MESSAGES;
