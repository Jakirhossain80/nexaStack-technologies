import type { LoginInput, PasswordResetConfirmInput, PasswordResetRequestInput, Role } from '@nexastack/shared';
import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { UnauthenticatedError } from '../lib/errors.js';
import { signSessionToken } from '../lib/jwt.js';
import { sendPasswordResetEmail } from '../lib/mailer.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { generateRandomToken, hashToken } from '../lib/randomToken.js';
import { PASSWORD_RESET_TOKEN_LIFETIME_MS, SESSION_LIFETIME_MS } from '../lib/sessionPolicy.js';
import { AdminSession } from '../models/AdminSession.js';
import { AdminUser } from '../models/AdminUser.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { logAdminActivity } from './adminActivityLog.service.js';

export interface RequestContext {
  ipAddress: string;
  userAgent: string | undefined;
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResult {
  token: string;
  admin: AuthenticatedAdmin;
}

const GENERIC_LOGIN_ERROR = 'Incorrect email or password.';

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
    admin: { id: user._id.toString(), email: user.email, role: user.role as Role },
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
  });
  if (!session) return null;

  const user = await AdminUser.findById(session.adminUserId);
  if (!user) return null;

  return { id: user._id.toString(), email: user.email, role: user.role as Role };
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
