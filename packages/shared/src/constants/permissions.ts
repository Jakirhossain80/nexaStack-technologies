import type { Role } from './roles.js';

/**
 * WHAT each admin role may do, defined ONCE. Every access decision in the API is a check for one of
 * these named capabilities (`requirePermission('media:delete')`), never a comparison against a role
 * name, and the admin UI uses the SAME map to decide which buttons and links to show. Hiding a button
 * is not authorisation (root CLAUDE.md 11.3): the API check on the endpoint is the boundary, and the
 * UI only mirrors it so a user is not shown things that will be refused.
 *
 * To read who can do what, read the map below; to add a fourth role, add it to `ROLES` and TypeScript
 * will refuse to compile until it has an entry here.
 */

export const PERMISSIONS = [
  /** Create accounts, change roles, suspend and reactivate, reset temporary passwords. */
  'manage:admins',
  /** Site-wide settings. Defined ahead of need: no settings feature exists yet. */
  'settings:manage',
  'manage:enquiries',
  'manage:quotations',
  /** Upload, edit alt text / description, replace. Not delete (that is `media:delete`). */
  'manage:media',
  /** Browse the Media Library and pick an image (for example a blog cover). Read-only. */
  'media:read',
  'media:delete',
  'content:create',
  /** Edit content. A role without `content:publish` may edit DRAFTS only (see `content:publish`). */
  'content:edit',
  /**
   * Change a post's status, and edit one that is not a draft. The two are the same power: editing a
   * live post changes the public site at once, exactly as publishing does.
   */
  'content:publish',
  'content:delete',
  'audit:view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Explicit lists, not derived ones, so the matrix can be audited at a glance and a NEW capability is
 * never silently granted to anyone (a test asserts this map against the agreed matrix).
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  super_admin: [
    'manage:admins',
    'settings:manage',
    'manage:enquiries',
    'manage:quotations',
    'manage:media',
    'media:read',
    'media:delete',
    'content:create',
    'content:edit',
    'content:publish',
    'content:delete',
    'audit:view',
  ],
  admin: [
    'manage:enquiries',
    'manage:quotations',
    'manage:media',
    'media:read',
    'media:delete',
    'content:create',
    'content:edit',
    'content:publish',
    'content:delete',
    'audit:view',
  ],
  content_editor: ['media:read', 'content:create', 'content:edit'],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** True if the role has at least one of the listed capabilities. */
export function hasAnyPermission(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
