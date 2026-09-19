import type { Request } from 'express';

import { UnauthenticatedError } from './errors.js';
import type { AdminActionContext } from '../services/adminActivityLog.service.js';

/**
 * Who is acting and from where, for the audit log. `requireSession` has already run on every
 * admin route, so `req.admin` is set; the guard is for the type checker and as a backstop if a
 * route is ever mounted without it. Services take the result as a plain value and never touch
 * `req` (apps/api/CLAUDE.md section 1).
 *
 * `role` is carried so a service can make a capability decision that depends on the DATA (for example
 * "may this actor edit a post that is not a draft?") with `hasPermission(context.role, …)`, without
 * reaching for the request.
 */
export function actionContext(req: Request): AdminActionContext {
  if (!req.admin) throw new UnauthenticatedError();
  return {
    adminId: req.admin.id,
    role: req.admin.role,
    ipAddress: req.ip ?? 'unknown',
    userAgent: req.headers['user-agent'],
  };
}
