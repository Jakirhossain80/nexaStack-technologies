import { ERROR_CODES } from '@nexastack/shared';
import { rateLimit } from 'express-rate-limit';

import { sendError } from '../lib/respond.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Stricter than the public Contact/Quotation limiters (10/15min) — this guards account
 * takeover, not just spam, so a lower threshold is appropriate. Proposed default, not a
 * settled figure — see the Admin Authentication task's own report for the reasoning.
 *
 * Same in-memory-store caveat as `middleware/rateLimit.ts`: per-process, reset on restart,
 * correct only for a single Render instance.
 */
export const LOGIN_RATE_LIMIT = 5;
export const PASSWORD_RESET_REQUEST_RATE_LIMIT = 3;

function makeLimiter(limiterName: string, limit: number, windowMs: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      req.log.warn(
        {
          event: 'rate_limited',
          limiter: limiterName,
          ip: req.ip,
          endpoint: `${req.method} ${req.originalUrl}`,
          limit,
          windowMs,
        },
        'Rate limit exceeded',
      );
      sendError(res, options.statusCode, { code: ERROR_CODES.RATE_LIMITED, message });
    },
  });
}

export const loginRateLimiter = makeLimiter(
  'login',
  LOGIN_RATE_LIMIT,
  FIFTEEN_MINUTES_MS,
  'Too many login attempts from your connection. Please wait 15 minutes and try again.',
);

/**
 * Changing a password requires the CURRENT one, so this endpoint is a password-guessing surface for
 * anyone holding a signed-in session (a walked-away-from browser). Same threshold as sign-in.
 */
export const CHANGE_PASSWORD_RATE_LIMIT = 5;

export const changePasswordRateLimiter = makeLimiter(
  'change-password',
  CHANGE_PASSWORD_RATE_LIMIT,
  FIFTEEN_MINUTES_MS,
  'Too many password change attempts from your connection. Please wait 15 minutes and try again.',
);

export const passwordResetRequestRateLimiter = makeLimiter(
  'password-reset-request',
  PASSWORD_RESET_REQUEST_RATE_LIMIT,
  ONE_HOUR_MS,
  'Too many password reset requests from your connection. Please wait an hour and try again.',
);
