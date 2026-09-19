import { z } from 'zod';

import { adminStatusSchema } from '../constants/adminStatus.js';
import { roleSchema } from '../constants/roles.js';

/**
 * Admin authentication. Used by the admin login/forgot-password/reset-password forms
 * (React Hook Form resolver) and by `apps/api`'s `/api/v1/auth/*` routes (the actual security
 * boundary — client validation is convenience only, root CLAUDE.md section 10).
 *
 * No PUBLIC registration schema on purpose: there is no sign-up flow. The first admin account is
 * created by `apps/api/scripts/seed-admin.ts`; every later one is created by a `super_admin`
 * (`createAdminUserSchema`), which is authenticated, permission-checked and audited.
 */

export const PASSWORD_MIN_LENGTH = 8;

export const loginSchema = z.object({
  email: z
    .string({ error: 'Please enter your email address' })
    .trim()
    .max(254, { error: 'Please use an email address of 254 characters or fewer' })
    .pipe(z.email({ error: 'Please enter a valid email address' })),
  password: z
    .string({ error: 'Please enter your password' })
    .min(PASSWORD_MIN_LENGTH, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }),
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string({ error: 'Please enter your email address' })
    .trim()
    .max(254, { error: 'Please use an email address of 254 characters or fewer' })
    .pipe(z.email({ error: 'Please enter a valid email address' })),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string({ error: 'Missing or invalid reset link' }).min(1, { error: 'Missing or invalid reset link' }),
  newPassword: z
    .string({ error: 'Please enter a new password' })
    .min(PASSWORD_MIN_LENGTH, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }),
});

/**
 * bcrypt reads only the first 72 BYTES of a password and ignores the rest, so a longer password would
 * be silently truncated. Refusing it is honest; letting it through would hide that.
 */
export const PASSWORD_MAX_LENGTH = 72;

const newPasswordField = z
  .string({ error: 'Please enter a new password' })
  .min(PASSWORD_MIN_LENGTH, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  .max(PASSWORD_MAX_LENGTH, {
    error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`,
  });

const currentPasswordField = z
  .string({ error: 'Please enter your current password' })
  .min(1, { error: 'Please enter your current password' });

const DIFFERENT_PASSWORD: { error: string; path: string[] } = {
  error: 'Please choose a password that is different from your current one',
  path: ['newPassword'],
};

/**
 * `POST /api/v1/auth/change-password`: used for the forced first-login change AND for a voluntary
 * one. Requires the current password even when forced (the temporary one), so a walked-away-from
 * session cannot be used to lock the owner out.
 */
export const changePasswordSchema = z
  .object({ currentPassword: currentPasswordField, newPassword: newPasswordField })
  .refine((value) => value.newPassword !== value.currentPassword, DIFFERENT_PASSWORD);

/** The form adds a confirmation field. The API never sees it: it is a typing check, not a security one. */
export const changePasswordFormSchema = z
  .object({
    currentPassword: currentPasswordField,
    newPassword: newPasswordField,
    confirmNewPassword: z
      .string({ error: 'Please type the new password again' })
      .min(1, { error: 'Please type the new password again' }),
  })
  .refine((value) => value.newPassword !== value.currentPassword, DIFFERENT_PASSWORD)
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    error: 'The two new passwords do not match',
    path: ['confirmNewPassword'],
  });

/**
 * Admin accounts are created only by a `super_admin` (`POST /api/v1/admin/users`), never through a
 * public form. There is no password field: the server generates a temporary one.
 */
export const createAdminUserSchema = z.object({
  email: z
    .string({ error: 'Please enter an email address' })
    .trim()
    .max(254, { error: 'Please use an email address of 254 characters or fewer' })
    .pipe(z.email({ error: 'Please enter a valid email address' })),
  role: roleSchema,
});

export const adminRoleChangeSchema = z.object({ role: roleSchema });

export const adminStatusChangeSchema = z.object({ status: adminStatusSchema });
