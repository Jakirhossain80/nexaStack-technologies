import Link from 'next/link';

import { cn } from '@/lib/cn';

export interface BlogAdminNavProps {
  current: 'posts' | 'categories';
}

const LINKS = [
  { key: 'posts', href: '/admin/blog', label: 'Posts' },
  { key: 'categories', href: '/admin/blog/categories', label: 'Categories' },
] as const;

/** Posts / Categories switcher shown at the top of the blog list and category pages. */
export function BlogAdminNav({ current }: BlogAdminNavProps) {
  return (
    <nav aria-label="Blog sections" className="flex gap-2">
      {LINKS.map((link) => {
        const active = link.key === current;
        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center rounded-field border px-4 text-body focus-ring',
              active
                ? 'border-strong bg-surface font-semibold text-primary'
                : 'border-default text-secondary hover:border-default-hover hover:bg-surface-hover',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
