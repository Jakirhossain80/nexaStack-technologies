import type { Permission } from '@nexastack/shared';

/**
 * The admin navigation, and which links a given set of permissions may see. Pure, so it can be tested
 * without rendering. Showing only the links a person can use is a courtesy: every page and every API
 * endpoint enforces access itself (root CLAUDE.md 11.3), so a link that is hidden here is still refused
 * if someone types its address.
 *
 * `permission` is the capability that shows the link; a link with none is for everyone signed in.
 * Where a whole area has no single capability (the blog), the one a viewer of that area always holds
 * is used.
 */

export interface AdminNavLink {
  href: string;
  label: string;
  permission?: Permission;
}

export const ADMIN_NAV_LINKS: readonly AdminNavLink[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries', permission: 'manage:enquiries' },
  { href: '/admin/quotations', label: 'Quotations', permission: 'manage:quotations' },
  { href: '/admin/blog', label: 'Blog', permission: 'content:edit' },
  { href: '/admin/media', label: 'Media', permission: 'media:read' },
  { href: '/admin/users', label: 'Users', permission: 'manage:admins' },
  { href: '/admin/activity', label: 'Activity', permission: 'audit:view' },
];

export function visibleNavLinks(permissions: readonly Permission[]): AdminNavLink[] {
  return ADMIN_NAV_LINKS.filter((link) => !link.permission || permissions.includes(link.permission));
}
