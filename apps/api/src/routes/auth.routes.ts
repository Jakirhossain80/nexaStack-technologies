import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@nexastack/shared';
import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { loginRateLimiter, passwordResetRequestRateLimiter } from '../middleware/authRateLimit.js';
import { csrfProtection } from '../middleware/csrf.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';

export const authRouter = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Admin login
 *     description: >
 *       Rate limited to 5 requests per IP per 15 minutes. Requires the X-Requested-With CSRF
 *       header and a matching Origin. Always returns the same generic error for a wrong email
 *       or a wrong password — never distinguishes which.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: Session cookie set; admin identity returned (no password hash). }
 *       401: { description: Incorrect email or password (UNAUTHENTICATED). }
 *       403: { description: CSRF check failed (FORBIDDEN). }
 *       429: { description: Rate limit exceeded (RATE_LIMITED). }
 */
authRouter.post(
  '/login',
  loginRateLimiter,
  csrfProtection,
  validate({ body: loginSchema }),
  authController.login,
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Admin logout
 *     description: Revokes the current session (Fork 2 — real revocation, not just cookie clearing).
 *     tags: [Auth]
 *     responses:
 *       200: { description: Session revoked and cookie cleared. }
 */
authRouter.post('/logout', csrfProtection, requireSession, authController.logout);

/**
 * @openapi
 * /api/v1/auth/session:
 *   get:
 *     summary: Check the current session
 *     description: >
 *       Used by apps/web's protected-route layout to verify a session server-to-server,
 *       forwarding the browser's cookie explicitly. A read, not a mutation — no CSRF check.
 *     tags: [Auth]
 *     responses:
 *       200: { description: Session is valid; admin identity returned. }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 */
authRouter.get('/session', requireSession, authController.getSession);

/**
 * @openapi
 * /api/v1/auth/password-reset/request:
 *   post:
 *     summary: Request a password reset link
 *     description: >
 *       Rate limited to 3 requests per IP per hour. Always responds the same way whether or
 *       not the email belongs to a real account, to avoid confirming account existence.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: Request accepted (does not confirm the account exists). }
 *       429: { description: Rate limit exceeded (RATE_LIMITED). }
 */
authRouter.post(
  '/password-reset/request',
  passwordResetRequestRateLimiter,
  csrfProtection,
  validate({ body: passwordResetRequestSchema }),
  authController.requestPasswordReset,
);

/**
 * @openapi
 * /api/v1/auth/password-reset/confirm:
 *   post:
 *     summary: Confirm a password reset
 *     description: Consumes a reset token exactly once and revokes every existing session for that account.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: Password updated. }
 *       401: { description: Invalid or expired token (UNAUTHENTICATED). }
 */
authRouter.post(
  '/password-reset/confirm',
  csrfProtection,
  validate({ body: passwordResetConfirmSchema }),
  authController.confirmPasswordReset,
);

/**
 * @openapi
 * /api/v1/auth/activity:
 *   get:
 *     summary: Recent admin activity log
 *     description: >
 *       The most recent 100 login/logout/password-reset events. `super_admin` only — this is
 *       founder-only visibility, demonstrating the RBAC middleware even with one role seeded.
 *     tags: [Auth]
 *     responses:
 *       200: { description: Recent activity entries. }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Authenticated but not super_admin (FORBIDDEN). }
 */
authRouter.get('/activity', requireSession, requireRole('super_admin'), authController.listActivity);
