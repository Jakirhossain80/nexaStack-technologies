'use client';

import type { Permission } from '@nexastack/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';
import { visibleNavLinks } from '@/lib/adminNav';

export interface AdminNavProps {
  /** What the signed-in admin may do (from the API). Decides which links are shown. */
  permissions: readonly Permission[];
}

/**
 * Primary navigation for the admin shell. Deliberately small: a link per admin area that has a page of
 * its own, so there is a way between them and back to the dashboard, and ONLY the areas this admin can
 * use (see `lib/adminNav.ts`). That is a courtesy, not security: the API and each page enforce access
 * regardless. The current area is marked with `aria-current` (and underlined, so it is not colour alone).
 */
export function AdminNav({ permissions }: AdminNavProps) {
  const pathname = usePathname();
  const links = visibleNavLinks(permissions);

  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
      {links.map((link) => {
        // The dashboard is exact; every other area owns its sub-paths.
        const active =
          link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-field px-3 text-body focus-ring',
              active
                ? 'font-semibold text-primary underline underline-offset-8'
                : 'text-secondary hover:bg-surface-hover hover:text-primary',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
