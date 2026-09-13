import { ERROR_CODES } from '@nexastack/shared';
import { rateLimit } from 'express-rate-limit';

import { sendError } from '../lib/respond.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Public contact form: 10 submissions per IP per 15 minutes.
 *
 * Deliberately not lower: carrier-grade NAT is common in Bangladesh, so one office or mobile
 * network can put many genuine users behind a single IP. Every rejection is logged at warn so
 * we can see whether the limit is ever actually reached.
 *
 * Uses the default in-memory store: per-process and reset on restart. Acceptable for a single
 * Render instance only — move to a shared store before running more than one.
 */
export const CONTACT_RATE_LIMIT = 10;

export const contactRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: CONTACT_RATE_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    req.log.warn(
      {
        event: 'rate_limited',
        limiter: 'contact',
        ip: req.ip,
        endpoint: `${req.method} ${req.originalUrl}`,
        limit: CONTACT_RATE_LIMIT,
        windowMs: FIFTEEN_MINUTES_MS,
      },
      'Rate limit exceeded',
    );
    sendError(res, options.statusCode, {
      code: ERROR_CODES.RATE_LIMITED,
      message:
        'Too many messages have been sent from your connection. Please wait 15 minutes and try again.',
    });
  },
});
