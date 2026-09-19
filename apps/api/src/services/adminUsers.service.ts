import {
  ADMIN_STATUS,
  type AdminStatus,
  type AdminUserAdmin,
  type AdminUserCreated,
  type CreateAdminUserInput,
  type Role,
} from '@nexastack/shared';
import mongoose from 'mongoose';

import { adminEmailsById } from '../lib/adminEmails.js';
import {
  SAFEGUARD_MESSAGES,
  findSafeguardViolation,
  lockedReasonFor,
  type AccountChange,
} from '../lib/adminSafeguards.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { hashPassword } from '../lib/password.js';
import { generateTemporaryPassword } from '../lib/tempPassword.js';
import { AdminSession } from '../models/AdminSession.js';
import { AdminUser } from '../models/AdminUser.js';
import { type AdminActionContext, logAdminAction } from './adminActivityLog.service.js';

/**
 * Admin-account lifecycle. Every function here is reached only through routes gated by
 * `manage:admins`. The service never returns a password hash, and the one plaintext secret it ever
 * produces (a temporary password) is returned to the caller once and is neither stored in readable form
 * nor written to the audit log.
 */

const NOT_FOUND_MESSAGE = 'That admin account was not found.';

interface LeanAdmin {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: string;
  status?: string | null;
  mustChangePassword?: boolean | null;
  createdByAdminId?: mongoose.Types.ObjectId | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
}

/** A MISSING status is active: accounts created before the field existed have none. */
const statusOf = (user: LeanAdmin): AdminStatus =>
  user.status === ADMIN_STATUS.SUSPENDED ? ADMIN_STATUS.SUSPENDED : ADMIN_STATUS.ACTIVE;

/** Active super admins. `$ne: 'suspended'` (not `= 'active'`) so an account with no status field counts. */
async function countActiveSuperAdmins(): Promise<number> {
  // `trusted`: `sanitizeFilter` would otherwise turn `$ne` into `$eq`. The operand is a constant.
  return AdminUser.countDocuments({
    role: 'super_admin',
    status: mongoose.trusted({ $ne: ADMIN_STATUS.SUSPENDED }),
  });
}

function toRow(
  user: LeanAdmin,
  actorId: string,
  activeSuperAdminCount: number,
  emails: Map<string, string>,
): AdminUserAdmin {
  const status = statusOf(user);
  return {
    id: String(user._id),
    email: user.email,
    role: user.role as Role,
    status,
    mustChangePassword: user.mustChangePassword === true,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    createdByEmail: user.createdByAdminId ? (emails.get(String(user.createdByAdminId)) ?? null) : null,
    lockedReason: lockedReasonFor({
      actorId,
      target: { id: String(user._id), role: user.role as Role, status },
      activeSuperAdminCount,
    }),
  };
}

async function loadRow(id: string, actorId: string): Promise<AdminUserAdmin> {
  const [user, count] = await Promise.all([
    AdminUser.findById(id).lean<LeanAdmin>(),
    countActiveSuperAdmins(),
  ]);
  if (!user) throw new NotFoundError(NOT_FOUND_MESSAGE);
  const emails = await adminEmailsById(user.createdByAdminId ? [String(user.createdByAdminId)] : []);
  return toRow(user, actorId, count, emails);
}

export async function listAdminUsers(actorId: string): Promise<AdminUserAdmin[]> {
  const [users, count] = await Promise.all([
    AdminUser.find().sort({ createdAt: 1 }).lean<LeanAdmin[]>(),
    countActiveSuperAdmins(),
  ]);
  const emails = await adminEmailsById(
    users.flatMap((user) => (user.createdByAdminId ? [String(user.createdByAdminId)] : [])),
  );
  return users.map((user) => toRow(user, actorId, count, emails));
}

/**
 * Creates an account with a server-generated temporary password (shown once, to the creator) and
 * `mustChangePassword`, so the account can do nothing but change it until it has.
 */
export async function createAdminUser(
  input: CreateAdminUserInput,
  context: AdminActionContext,
): Promise<AdminUserCreated> {
  const email = input.email.toLowerCase();
  if (await AdminUser.exists({ email })) {
    throw new ConflictError('An admin account with that email address already exists.');
  }

  const temporaryPassword = generateTemporaryPassword();
  let created;
  try {
    created = await AdminUser.create({
      email,
      passwordHash: await hashPassword(temporaryPassword),
      role: input.role,
      status: ADMIN_STATUS.ACTIVE,
      mustChangePassword: true,
      createdByAdminId: context.adminId,
    });
  } catch (err) {
    // Two creates for the same email at once: the unique index decides, the loser gets the same message.
    if ((err as { code?: number }).code === 11000) {
      throw new ConflictError('An admin account with that email address already exists.');
    }
    throw err;
  }

  await logAdminAction(context, 'admin_account_created', {
    targetId: String(created._id),
    targetEmail: email,
    role: input.role,
  });
  return { user: await loadRow(String(created._id), context.adminId), temporaryPassword };
}

/** Loads the target and applies the safeguards for a role or status change; throws 409 if refused. */
async function guardedTarget(id: string, change: AccountChange, context: AdminActionContext) {
  const target = await AdminUser.findById(id).lean<LeanAdmin>();
  if (!target) throw new NotFoundError(NOT_FOUND_MESSAGE);

  const violation = findSafeguardViolation({
    actorId: context.adminId,
    target: { id, role: target.role as Role, status: statusOf(target) },
    change,
    activeSuperAdminCount: await countActiveSuperAdmins(),
  });
  if (violation) throw new ConflictError(SAFEGUARD_MESSAGES[violation]);
  return target;
}

/**
 * After a change that could have removed a super admin, recount. The pre-check above is not atomic:
 * two super admins demoting or suspending EACH OTHER at the same moment could both pass it. So the change
 * is applied, then verified, and undone if it left nobody. (If both see zero, both undo: nobody is ever
 * left without a super admin.)
 */
async function ensureSuperAdminRemains(revert: () => Promise<unknown>): Promise<void> {
  if ((await countActiveSuperAdmins()) === 0) {
    await revert();
    throw new ConflictError(SAFEGUARD_MESSAGES.last_super_admin);
  }
}

export async function changeAdminRole(
  id: string,
  role: Role,
  context: AdminActionContext,
): Promise<AdminUserAdmin> {
  const target = await guardedTarget(id, { kind: 'role', role }, context);
  const from = target.role as Role;
  if (from === role) throw new ConflictError('That account already has that role.');

  // Conditional on the role we just read, so a concurrent change is a 409, not a silent overwrite.
  const result = await AdminUser.updateOne({ _id: id, role: from }, { $set: { role } });
  if (result.modifiedCount !== 1) {
    throw new ConflictError('This account was changed by someone else. Reload the page and try again.');
  }
  if (from === 'super_admin') {
    await ensureSuperAdminRemains(() => AdminUser.updateOne({ _id: id }, { $set: { role: from } }));
  }

  // The role is read from the database on every request, so this applies to the account's very next
  // request; no session needs revoking.
  await logAdminAction(context, 'admin_role_changed', {
    targetId: id,
    targetEmail: target.email,
    from,
    to: role,
  });
  return loadRow(id, context.adminId);
}

/**
 * Suspend or reactivate. Suspending revokes EVERY active session of the account immediately, and the
 * session check also refuses a suspended account on its next request, so it takes effect at once, not
 * at the next sign-in.
 */
export async function changeAdminStatus(
  id: string,
  status: AdminStatus,
  context: AdminActionContext,
): Promise<AdminUserAdmin> {
  const target = await guardedTarget(id, { kind: 'status', status }, context);
  const from = statusOf(target);
  if (from === status) {
    throw new ConflictError(
      status === ADMIN_STATUS.SUSPENDED ? 'That account is already suspended.' : 'That account is already active.',
    );
  }

  const result = await AdminUser.updateOne(
    { _id: id, status: mongoose.trusted({ $ne: status }) },
    { $set: { status } },
  );
  if (result.modifiedCount !== 1) {
    throw new ConflictError('This account was changed by someone else. Reload the page and try again.');
  }

  if (status === ADMIN_STATUS.SUSPENDED) {
    if (target.role === 'super_admin') {
      await ensureSuperAdminRemains(() => AdminUser.updateOne({ _id: id }, { $set: { status: from } }));
    }
    await AdminSession.updateMany({ adminUserId: id, revokedAt: null }, { revokedAt: new Date() });
  }

  await logAdminAction(
    context,
    status === ADMIN_STATUS.SUSPENDED ? 'admin_account_suspended' : 'admin_account_activated',
    { targetId: id, targetEmail: target.email },
  );
  return loadRow(id, context.adminId);
}

/**
 * Gives an account a NEW temporary password and puts it back on the forced-change path: for a temporary
 * password that was lost before first sign-in (there is no email reset), or an account someone can no
 * longer get into. All of its sessions are revoked. Not for your own account: use "Change password".
 */
export async function resetAdminPassword(
  id: string,
  context: AdminActionContext,
): Promise<AdminUserCreated> {
  if (id === context.adminId) {
    throw new ConflictError('To change your own password, use "Change password" instead.');
  }
  const target = await AdminUser.findById(id).lean<LeanAdmin>();
  if (!target) throw new NotFoundError(NOT_FOUND_MESSAGE);

  const temporaryPassword = generateTemporaryPassword();
  await AdminUser.updateOne(
    { _id: id },
    { $set: { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true } },
  );
  await AdminSession.updateMany({ adminUserId: id, revokedAt: null }, { revokedAt: new Date() });

  await logAdminAction(context, 'admin_password_reset', { targetId: id, targetEmail: target.email });
  return { user: await loadRow(id, context.adminId), temporaryPassword };
}
