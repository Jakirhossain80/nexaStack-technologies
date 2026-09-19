'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/enquiries', label: 'Enquiries' },
  { href: '/admin/blog', label: 'Blog' },
] as const;

/**
 * Primary navigation for the admin shell. Deliberately small: a link per admin area that has a
 * page of its own, so there is a way between them and back to the dashboard. The current area is
 * marked with `aria-current` (and underlined, so it is not colour alone).
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
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
