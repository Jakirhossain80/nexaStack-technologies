import type { z } from 'zod';

import type { AdminEventType } from '../constants/adminEvents.js';
import type { AdminLockReason, AdminStatus } from '../constants/adminStatus.js';
import type { Permission } from '../constants/permissions.js';
import type { Role } from '../constants/roles.js';
import type {
  adminRoleChangeSchema,
  adminStatusChangeSchema,
  changePasswordFormSchema,
  changePasswordSchema,
  createAdminUserSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '../schemas/auth.js';

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangePasswordFormValues = z.input<typeof changePasswordFormSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type AdminRoleChangeInput = z.infer<typeof adminRoleChangeSchema>;
export type AdminStatusChangeInput = z.infer<typeof adminStatusChangeSchema>;

/**
 * The signed-in admin as the API reports it (`/auth/session`, login). `permissions` is computed by the
 * API from the one role-to-capability map; the web app uses it to decide what to show, while the API
 * re-checks on every request regardless. `mustChangePassword` means every route except changing the
 * password (and signing out) is refused until it is done.
 */
export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  permissions: Permission[];
}

/** One row of `/admin/users`. Never carries a password or a hash. */
export interface AdminUserAdmin {
  id: string;
  email: string;
  role: Role;
  status: AdminStatus;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  /** Who created the account; null for the seeded first account or if that account no longer exists. */
  createdByEmail: string | null;
  /** Set when suspending or changing this account's role is refused, and why. */
  lockedReason: AdminLockReason | null;
}

/**
 * Returned ONCE, when an account is created or its password is reset. The temporary password is not
 * stored in readable form anywhere and cannot be shown again: if it is lost, reset it.
 */
export interface AdminUserCreated {
  user: AdminUserAdmin;
  temporaryPassword: string;
}

/** One row of the audit view (`GET /auth/activity`). */
export interface AdminAuditEntry {
  id: string;
  eventType: AdminEventType;
  /** Who did it: the admin account that acted. Null for events with no signed-in actor (a failed sign-in). */
  actorEmail: string | null;
  /** For sign-in events: the address that was typed. Never treated as proof the account exists. */
  attemptedEmail: string | undefined;
  ipAddress: string | undefined;
  /** For account-management events: what happened and to whom. Null for every other event. */
  summary: string | null;
  createdAt: string;
}
