import { ERROR_CODES } from '@nexastack/shared';
import type { RequestHandler } from 'express';

import { SESSION_COOKIE_NAME } from '../lib/cookies.js';
import { AppError, UnauthenticatedError } from '../lib/errors.js';
import { verifySessionToken } from '../lib/jwt.js';
import { evaluateSessionAccess } from '../lib/sessionAccess.js';
import { validateSession } from '../services/auth.service.js';

/**
 * Verifies the session cookie and, per Fork 2, re-checks the backing `AdminSession` record on
 * every request — a valid JWT signature alone is not enough; the session must also not be
 * revoked or expired in MongoDB. Attaches `req.admin`/`req.sessionId` on success.
 *
 * `validateSession` also refuses a SUSPENDED account, so suspension takes effect on that account's very
 * next request even before its sessions have been revoked. The role is read from the database here, on
 * every request, never from the token, so a role change applies immediately too.
 *
 * An account still on its temporary password (`mustChangePassword`) is refused with 403
 * `PASSWORD_CHANGE_REQUIRED` on every route that uses `requireSession`. Only the routes that let it
 * change that password or sign out use `requireSessionAllowingPasswordChange`. This is enforced here, by
 * the API, not left to the UI to redirect.
 */
function sessionGuard(options: { allowPasswordChange: boolean }): RequestHandler {
  return async (req, _res, next) => {
    try {
      const token: unknown = req.cookies?.[SESSION_COOKIE_NAME];
      if (typeof token !== 'string' || token.length === 0) {
        throw new UnauthenticatedError();
      }

      const payload = verifySessionToken(token);
      if (!payload) throw new UnauthenticatedError();

      const admin = await validateSession(payload.sessionId);
      if (!admin) throw new UnauthenticatedError();

      const access = evaluateSessionAccess(
        { status: 'active', mustChangePassword: admin.mustChangePassword },
        options,
      );
      if (access === 'password_change_required') {
        throw new AppError(
          403,
          ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
          'You must change your temporary password before doing anything else.',
        );
      }

      req.admin = admin;
      req.sessionId = payload.sessionId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** The default for every admin route: a valid session AND no pending password change. */
export const requireSession: RequestHandler = sessionGuard({ allowPasswordChange: false });

/** Only for reading who you are, signing out, and changing the password. Nothing else. */
export const requireSessionAllowingPasswordChange: RequestHandler = sessionGuard({
  allowPasswordChange: true,
});
