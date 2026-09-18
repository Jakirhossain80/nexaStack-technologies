import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@nexastack/shared';
import type { Request, Response } from 'express';

import { clearedSessionCookieOptions, SESSION_COOKIE_NAME, sessionCookieOptions } from '../lib/cookies.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody } from '../middleware/validate.js';
import { listRecentAdminActivity } from '../services/adminActivityLog.service.js';
import * as authService from '../services/auth.service.js';

/** Never logged, never returned — just read once per request to build the audit context. */
function requestContext(req: Request): authService.RequestContext {
  return { ipAddress: req.ip ?? 'unknown', userAgent: req.headers['user-agent'] };
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, loginSchema);
  const result = await authService.login(input, requestContext(req));

  res.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions());
  // The token is set as an HTTP-only cookie, never returned in the body — the browser never
  // needs to read it directly, and it must not end up in application-level JS or logs.
  sendSuccess(res, { admin: result.admin }, 200);
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.sessionId) {
    await authService.logout(req.sessionId, req.admin ?? null, requestContext(req));
  }
  res.clearCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions());
  sendSuccess(res, { loggedOut: true }, 200);
}

/** Used by `apps/web`'s protected-route layout (server-to-server, forwarding the browser's
 * cookie explicitly) to check whether the current session is valid, without a local JWT decode
 * on the web side — see the Admin Authentication task's cross-origin architecture notes. */
export function getSession(req: Request, res: Response): void {
  // requireSession has already run; reaching here means req.admin is set.
  sendSuccess(res, { admin: req.admin }, 200);
}

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, passwordResetRequestSchema);
  await authService.requestPasswordReset(input, requestContext(req));
  // Same response whether or not the email belongs to a real account — see auth.service.ts.
  sendSuccess(res, { requested: true }, 200);
}

export async function confirmPasswordReset(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, passwordResetConfirmSchema);
  await authService.confirmPasswordReset(input, requestContext(req));
  sendSuccess(res, { reset: true }, 200);
}

/** Founder-only visibility into login/activity history — `/admin/activity`'s data source. */
export async function listActivity(_req: Request, res: Response): Promise<void> {
  const entries = await listRecentAdminActivity();
  sendSuccess(res, { entries }, 200);
}
