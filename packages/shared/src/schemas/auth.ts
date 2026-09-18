import { z } from 'zod';

/**
 * Admin authentication. Used by the admin login/forgot-password/reset-password forms
 * (React Hook Form resolver) and by `apps/api`'s `/api/v1/auth/*` routes (the actual security
 * boundary — client validation is convenience only, root CLAUDE.md section 10).
 *
 * No registration schema here on purpose: there is no public sign-up flow. The one admin
 * account is created by `apps/api/scripts/seed-admin.ts`, not through any form.
 */

const PASSWORD_MIN_LENGTH = 8;

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
