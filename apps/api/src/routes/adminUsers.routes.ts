import {
  adminRoleChangeSchema,
  adminStatusChangeSchema,
  createAdminUserSchema,
} from '@nexastack/shared';
import { Router } from 'express';

import * as controller from '../controllers/adminUsers.controller.js';
import { csrfProtection } from '../middleware/csrf.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';

/**
 * Admin-account management, mounted at `/api/v1/admin/users` BEFORE `adminRouter` (see routes/index.ts).
 * Every route needs the `manage:admins` capability (only `super_admin` has it): creating accounts,
 * changing roles, suspending, resetting passwords. Every mutation also passes `csrfProtection`. No
 * public registration exists anywhere: this is the only way an account is created after the first.
 */
export const adminUsersRouter = Router();

adminUsersRouter.use(requireSession, requirePermission('manage:admins'));

const idParams = { params: mongoIdParamSchema };

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     summary: List admin accounts
 *     description: Role, status, last sign-in and, per row, why suspending or changing the role is refused (`lockedReason`).
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: "{ users: [...] }." }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Missing manage:admins (FORBIDDEN). }
 *   post:
 *     summary: Create an admin account
 *     description: >
 *       Body `{ email, role }`. The server generates a temporary password and returns it ONCE in the
 *       response (`Cache-Control: no-store`); it is not stored in readable form or logged. The account is
 *       marked `mustChangePassword`: until it changes that password the API refuses every route except
 *       changing it and signing out.
 *     tags: [Admin Users]
 *     responses:
 *       201: { description: "{ user, temporaryPassword }." }
 *       400: { description: Invalid email or role (VALIDATION_ERROR). }
 *       409: { description: That email already has an account (CONFLICT). }
 */
adminUsersRouter.get('/', controller.listUsers);
adminUsersRouter.post(
  '/',
  csrfProtection,
  validate({ body: createAdminUserSchema }),
  controller.createUser,
);

/**
 * @openapi
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     summary: Change an account's role
 *     description: >
 *       Refused (409) for your own account and for the last active super admin, so the admin area can
 *       never be left without anyone able to manage accounts. Takes effect on the account's next request.
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: "{ user }." }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Refused by a safeguard, or no change (CONFLICT). }
 */
adminUsersRouter.patch(
  '/:id/role',
  csrfProtection,
  validate({ ...idParams, body: adminRoleChangeSchema }),
  controller.changeRole,
);

/**
 * @openapi
 * /api/v1/admin/users/{id}/status:
 *   patch:
 *     summary: Suspend or reactivate an account
 *     description: >
 *       Body `{ status: 'active' | 'suspended' }`. Suspending revokes every active session of the account
 *       immediately (and the session check refuses it on its next request regardless). Refused (409) for
 *       your own account and for the last active super admin.
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: "{ user }." }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Refused by a safeguard, or no change (CONFLICT). }
 */
adminUsersRouter.patch(
  '/:id/status',
  csrfProtection,
  validate({ ...idParams, body: adminStatusChangeSchema }),
  controller.changeStatus,
);

/**
 * @openapi
 * /api/v1/admin/users/{id}/reset-password:
 *   post:
 *     summary: Give an account a new temporary password
 *     description: >
 *       Returns the new temporary password ONCE, puts the account back on the forced password change and
 *       revokes all its sessions. For a lost temporary password (there is no email reset). Not for your
 *       own account.
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: "{ user, temporaryPassword }." }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Own account (CONFLICT). }
 */
adminUsersRouter.post(
  '/:id/reset-password',
  csrfProtection,
  validate(idParams),
  controller.resetPassword,
);
