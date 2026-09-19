import type { Role } from '@nexastack/shared';

/** How each role is named in the admin. Typed `Record<Role, …>`, so a fourth role fails typecheck here. */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  content_editor: 'Content editor',
};

/**
 * One line on what each role can do, for the create form. The authority is the permission map in
 * `@nexastack/shared` (`ROLE_PERMISSIONS`); this is only the summary next to it, so change both together.
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super_admin: 'Everything, including creating and managing admin accounts.',
  admin:
    'Enquiries, quotations, the media library, and all blog actions including publishing and deleting. Can read the audit log.',
  content_editor:
    'Writes and edits blog drafts and can browse the media library. Cannot publish, change or delete live content.',
};
