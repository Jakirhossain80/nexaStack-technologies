import type { RequestHandler } from 'express';

import { SESSION_COOKIE_NAME } from '../lib/cookies.js';
import { UnauthenticatedError } from '../lib/errors.js';
import { verifySessionToken } from '../lib/jwt.js';
import { validateSession } from '../services/auth.service.js';

/**
 * Verifies the session cookie and, per Fork 2, re-checks the backing `AdminSession` record on
 * every request — a valid JWT signature alone is not enough; the session must also not be
 * revoked or expired in MongoDB. Attaches `req.admin`/`req.sessionId` on success.
 */
export const requireSession: RequestHandler = async (req, _res, next) => {
  try {
    const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthenticatedError();
    }

    const payload = verifySessionToken(token);
    if (!payload) throw new UnauthenticatedError();

    const admin = await validateSession(payload.sessionId);
    if (!admin) throw new UnauthenticatedError();

    req.admin = admin;
    req.sessionId = payload.sessionId;
    next();
  } catch (err) {
    next(err);
  }
};
