import { z } from 'zod';

/** Admin roles. Enforced by `requireRole` middleware in apps/api, never by the UI alone. */
export const ROLES = ['super_admin', 'admin', 'content_editor'] as const;

export const roleSchema = z.enum(ROLES, {
  error: 'Please choose a valid role: super_admin, admin or content_editor',
});

export type Role = (typeof ROLES)[number];
