import {
  permissionsFor,
  type AuthenticatedAdmin,
  type ChangePasswordInput,
  type LoginInput,
  type PasswordResetConfirmInput,
  type PasswordResetRequestInput,
  type Role,
} from '@nexastack/shared';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { ForbiddenError, UnauthenticatedError, ValidationError } from '../lib/errors.js';
import { signSessionToken } from '../lib/jwt.js';
import { sendPasswordResetEmail } from '../lib/mailer.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { generateRandomToken, hashToken } from '../lib/randomToken.js';
import { evaluateSessionAccess } from '../lib/sessionAccess.js';
import { PASSWORD_RESET_TOKEN_LIFETIME_MS, SESSION_LIFETIME_MS } from '../lib/sessionPolicy.js';
import { AdminSession } from '../models/AdminSession.js';
import { AdminUser } from '../models/AdminUser.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { logAdminActivity } from './adminActivityLog.service.js';

export interface RequestContext {
  ipAddress: string;
  userAgent: string | undefined;
}

export type { AuthenticatedAdmin };

export interface LoginResult {
  token: string;
  admin: AuthenticatedAdmin;
}

const GENERIC_LOGIN_ERROR = 'Incorrect email or password.';

/**
 * Shown ONLY after the correct password has been supplied (see `login`). Someone without the password
 * always gets the generic error above, so this cannot be used to discover which emails are real or
 * suspended; the legitimate owner of a suspended account still gets a clear, actionable message.
 */
const SUSPENDED_LOGIN_ERROR = 'This account has been suspended. Contact the site owner.';

/** The signed-in admin as the API reports it. `permissions` comes from the ONE role-to-capability map. */
export function toAuthenticatedAdmin(user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: string;
  mustChangePassword?: boolean | null | undefined;
}): AuthenticatedAdmin {
  const role = user.role as Role;
  return {
    id: user._id.toString(),
    email: user.email,
    role,
    mustChangePassword: user.mustChangePassword === true,
    permissions: [...permissionsFor(role)],
  };
}

/**
 * Validates credentials and, on success, creates a real server-side session (Fork 2 — a
 * stateless JWT alone can't be revoked before expiry). Never reveals whether the email or the
 * password was wrong — same generic message and same log shape either way, so a failed attempt
 * against a real email address isn't distinguishable from one against a nonexistent account.
 */
export async function login(input: LoginInput, context: RequestContext): Promise<LoginResult> {
  const email = input.email.toLowerCase();
  const user = await AdminUser.findOne({ email }).select('+passwordHash');

  if (!user) {
    await logAdminActivity({
      eventType: 'login_failure',
      attemptedEmail: email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    throw new UnauthenticatedError(GENERIC_LOGIN_ERROR);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    await logAdminActivity({
      eventType: 'login_failure',
      adminUserId: user._id,
      attemptedEmail: email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    throw new UnauthenticatedError(GENERIC_LOGIN_ERROR);
  }

  // Only now, with the right password in hand, is it safe to say why sign-in is refused.
  if (evaluateSessionAccess(user, { allowPasswordChange: true }) === 'suspended') {
    await logAdminActivity({
      eventType: 'login_failure',
      adminUserId: user._id,
      attemptedEmail: email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'suspended' },
    });
    throw new ForbiddenError(SUSPENDED_LOGIN_ERROR);
  }

  const sessionId = generateRandomToken();
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await AdminSession.create({ adminUserId: user._id, sessionId, expiresAt });

  user.lastLoginAt = new Date();
  await user.save();

  await logAdminActivity({
    eventType: 'login_success',
    adminUserId: user._id,
    attemptedEmail: email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    token: signSessionToken(sessionId),
    admin: toAuthenticatedAdmin(user),
  };
}

/** Revokes the session record — the real "logout invalidates" property. The JWT itself keeps
 * decoding successfully until it naturally expires; what changes is that `validateSession`
 * (and therefore every protected route) now rejects it. */
export async function logout(
  sessionId: string,
  admin: AuthenticatedAdmin | null,
  context: RequestContext,
): Promise<void> {
  await AdminSession.updateOne({ sessionId, revokedAt: null }, { revokedAt: new Date() });

  await logAdminActivity({
    eventType: 'logout',
    adminUserId: admin?.id ?? null,
    attemptedEmail: admin?.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/** The single source of truth for "is this session currently valid" — signature and expiry
 * (checked by the caller via `verifySessionToken` before this runs), *and* not revoked, *and*
 * the backing record hasn't itself expired. Returns `null` rather than throwing: "not
 * authenticated" is a normal, expected outcome for every caller of this function. */
export async function validateSession(sessionId: string): Promise<AuthenticatedAdmin | null> {
  // `mongoose.trusted(...)`: apps/api/src/lib/db.ts sets `sanitizeFilter: true` globally (an
  // intentional NoSQL-injection defense — user-supplied `$`-prefixed objects can't become query
  // operators). That protection can't distinguish "operator I wrote in code" from "operator an
  // attacker injected", so it also neutralizes a genuine `$gt` unless explicitly marked trusted
  // — this value is entirely code-constructed (a fresh `Date`), never user input.
  const session = await AdminSession.findOne({
    sessionId,
    revokedAt: null,
    expiresAt: mongoose.trusted({ $gt: new Date() }),
  })
    // Runs on EVERY authenticated admin request, and only reads: plain objects with just the fields
    // used below, not full Mongoose documents.
    .select('adminUserId')
    .lean();
  if (!session) return null;

  const user = await AdminUser.findById(session.adminUserId)
    .select('email role status mustChangePassword')
    .lean();
  if (!user) return null;

  // A suspended account is refused on its very next request, whether or not its sessions have been
  // revoked yet: suspension can never lag behind. (`allowPasswordChange` only matters for the
  // password rule, which `requireSession` applies; here only suspension is decided.)
  if (evaluateSessionAccess(user, { allowPasswordChange: true }) === 'suspended') return null;

  // The role is read from the database on every request, never from the token, so a role change
  // applies immediately.
  return toAuthenticatedAdmin(user);
}

/**
 * Always succeeds from the caller's point of view, whether or not the email belongs to a real
 * account — the response and the activity log both avoid confirming account existence. Only
 * creates a token and calls the (currently deferred) email hook when the account is real.
 */
export async function requestPasswordReset(
  input: PasswordResetRequestInput,
  context: RequestContext,
): Promise<void> {
  const email = input.email.toLowerCase();
  const user = await AdminUser.findOne({ email });

  await logAdminActivity({
    eventType: 'password_reset_requested',
    adminUserId: user?._id ?? null,
    attemptedEmail: email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  if (!user) return;

  const rawToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_LIFETIME_MS);
  await PasswordResetToken.create({ adminUserId: user._id, tokenHash: hashToken(rawToken), expiresAt });

  const resetLink = `${env.WEB_APP_URL}/admin/reset-password?token=${rawToken}`;
  sendPasswordResetEmail(user.email, resetLink);
}

const GENERIC_RESET_ERROR = 'This reset link is invalid or has expired. Request a new one.';

/** Consumes a reset token exactly once, sets the new password, and revokes every existing
 * session for that account — a password reset is a reasonable moment to sign out anywhere
 * else the old password might still be in use (e.g. a copied cookie). */
export async function confirmPasswordReset(
  input: PasswordResetConfirmInput,
  context: RequestContext,
): Promise<void> {
  const tokenHash = hashToken(input.token);
  // See validateSession's comment on mongoose.trusted() — same reasoning.
  const resetToken = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: mongoose.trusted({ $gt: new Date() }),
  });

  if (!resetToken) {
    await logAdminActivity({
      eventType: 'password_reset_completed',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { outcome: 'invalid_or_expired_token' },
    });
    throw new UnauthenticatedError(GENERIC_RESET_ERROR);
  }

  const user = await AdminUser.findById(resetToken.adminUserId);
  if (!user) throw new UnauthenticatedError(GENERIC_RESET_ERROR);

  user.passwordHash = await hashPassword(input.newPassword);
  // They just chose this password themselves, so a pending "change your temporary password" is done.
  user.mustChangePassword = false;
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await AdminSession.updateMany({ adminUserId: user._id, revokedAt: null }, { revokedAt: new Date() });

  await logAdminActivity({
    eventType: 'password_reset_completed',
    adminUserId: user._id,
    attemptedEmail: user.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Changes the signed-in admin's own password. Used for the FORCED change (an account still on the
 * temporary password a super_admin gave it) and for a voluntary one; both need the current password, so
 * a session someone walked away from cannot be used to take the account over.
 *
 * Every OTHER session for the account is revoked (a changed password should sign out anywhere the old
 * one may be in use); the session making this request stays signed in. A wrong current password is a 400
 * on that field (not a 401: the session itself is fine, and the web app treats 401 as "expired").
 */
export async function changePassword(
  admin: AuthenticatedAdmin,
  currentSessionId: string,
  input: ChangePasswordInput,
  context: RequestContext,
): Promise<AuthenticatedAdmin> {
  const user = await AdminUser.findById(admin.id).select('+passwordHash');
  if (!user) throw new UnauthenticatedError();

  const currentMatches = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!currentMatches) {
    await logAdminActivity({
      eventType: 'login_failure',
      adminUserId: user._id,
      attemptedEmail: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: 'change_password_wrong_current_password' },
    });
    throw new ValidationError([
      { location: 'body', path: 'currentPassword', message: 'Your current password is incorrect.' },
    ]);
  }

  const wasForced = user.mustChangePassword === true;
  user.passwordHash = await hashPassword(input.newPassword);
  user.mustChangePassword = false;
  await user.save();

  // `trusted`: `sanitizeFilter` would otherwise turn `$ne` into `$eq`; the operand is our own session id.
  await AdminSession.updateMany(
    { adminUserId: user._id, revokedAt: null, sessionId: mongoose.trusted({ $ne: currentSessionId }) },
    { revokedAt: new Date() },
  );

  await logAdminActivity({
    eventType: 'password_changed',
    adminUserId: user._id,
    attemptedEmail: user.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { forced: wasForced },
  });

  return toAuthenticatedAdmin(user);
}
