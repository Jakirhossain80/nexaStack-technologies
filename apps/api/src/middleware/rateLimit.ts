import { ERROR_CODES } from '@nexastack/shared';
import { rateLimit } from 'express-rate-limit';

import { sendError } from '../lib/respond.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Public contact form: 5 submissions per IP per 15 minutes.
 *
 * Uses the default in-memory store, which is only correct while the API runs as a single
 * instance. Move to a shared store before scaling horizontally.
 */
export const contactRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    req.log.warn({ event: 'rate_limited', limiter: 'contact' }, 'Rate limit exceeded');
    sendError(res, options.statusCode, {
      code: ERROR_CODES.RATE_LIMITED,
      message:
        'Too many messages have been sent from your connection. Please wait 15 minutes and try again.',
    });
  },
});
