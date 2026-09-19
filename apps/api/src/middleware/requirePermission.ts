import { hasAnyPermission, hasPermission, type Permission } from '@nexastack/shared';
import type { RequestHandler } from 'express';

import { ForbiddenError, UnauthenticatedError } from '../lib/errors.js';

/**
 * Authorisation by NAMED CAPABILITY, enforced server-side on the route (root CLAUDE.md 11.3: hiding a
 * button in the UI is never authorisation). Which role has which capability is decided in ONE place,
 * `ROLE_PERMISSIONS` in `@nexastack/shared`; nothing here (or anywhere in the API) compares a role name.
 *
 * Must run after `requireSession`, which sets `req.admin`. Every admin route carries one of these
 * explicitly; `middleware/permissionGates.test.ts` walks every admin router and fails if any route
 * lacks a gate or has the wrong one.
 *
 * The handler is tagged with what it requires, only so that test (and a reader) can see it.
 */

export interface PermissionGate extends RequestHandler {
  readonly requiredPermissions: readonly Permission[];
  /** `all`: every listed capability is needed. `any`: one is enough. */
  readonly mode: 'all' | 'any';
}

function gate(mode: 'all' | 'any', permissions: readonly Permission[]): PermissionGate {
  const handler: RequestHandler = (req, _res, next) => {
    if (!req.admin) {
      next(new UnauthenticatedError());
      return;
    }
    const role = req.admin.role;
    const allowed =
      mode === 'all'
        ? permissions.every((permission) => hasPermission(role, permission))
        : hasAnyPermission(role, permissions);
    if (!allowed) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
  return Object.assign(handler, { requiredPermissions: permissions, mode });
}

/** The signed-in admin's role must grant EVERY listed capability. */
export function requirePermission(...permissions: [Permission, ...Permission[]]): PermissionGate {
  return gate('all', permissions);
}

/** The signed-in admin's role must grant AT LEAST ONE of the listed capabilities. */
export function requireAnyPermission(...permissions: [Permission, ...Permission[]]): PermissionGate {
  return gate('any', permissions);
}
