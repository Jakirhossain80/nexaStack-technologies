import type { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { ForbiddenError } from '../lib/errors.js';

/**
 * CSRF protection for cookie-authenticated mutations (root CLAUDE.md 11.4 — mandatory, not
 * deferrable, since this task introduces the first real ones: login, logout, password reset).
 *
 * Strategy: require a custom header a cross-site `<form>` submission cannot set, plus an exact
 * `Origin` check against the same allowlist CORS already enforces. `SameSite=Lax` on the
 * session cookie already blocks it from attaching to most cross-site requests in the first
 * place — this is deliberate defense-in-depth on top of that, not the only layer, so a bug or a
 * browser without full SameSite support doesn't leave these endpoints with zero protection.
 * A double-submit-cookie token was considered and not used: it adds a second cookie and a
 * verification step for no real gain once Origin + a custom header are already required.
 */
export const CSRF_HEADER_NAME = 'x-requested-with';
const REQUIRED_HEADER_VALUE = 'nexastack-admin';

export const csrfProtection: RequestHandler = (req, _res, next) => {
  const allowedOrigins = new Set(env.CORS_ORIGINS);
  const origin = req.headers.origin;

  if (!origin || !allowedOrigins.has(origin)) {
    next(new ForbiddenError('Request origin not allowed.'));
    return;
  }

  if (req.headers[CSRF_HEADER_NAME] !== REQUIRED_HEADER_VALUE) {
    next(new ForbiddenError('Missing required request header.'));
    return;
  }

  next();
};
