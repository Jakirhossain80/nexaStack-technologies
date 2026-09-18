import type { Role } from '@nexastack/shared';
import type { RequestHandler } from 'express';

import { ForbiddenError, UnauthenticatedError } from '../lib/errors.js';

/**
 * Role check, enforced server-side on the route (root CLAUDE.md 11.3 — hiding a button in the
 * UI is never authorization). Must run after `requireSession`. Genuinely supports all three
 * roles even though only `super_admin` is seeded today — this is forward-compatible
 * infrastructure for admin features that don't exist yet, not a single-role shortcut.
 */
export function requireRole(...roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.admin) {
      next(new UnauthenticatedError());
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
