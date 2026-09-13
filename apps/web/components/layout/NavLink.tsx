'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';
import { isActivePath } from '@/lib/isActivePath';

export type NavLinkLayout = 'bar' | 'drawer';

export interface NavLinkProps {
  href: string;
  label: string;
  /** `bar`: horizontal desktop nav. `drawer`: full-width row in the mobile menu. */
  layout: NavLinkLayout;
  /** Called when the link starts a client-side navigation (used to close the mobile menu). */
  onNavigate?: () => void;
}

/**
 * A primary-navigation link that marks itself as the current page. The only client-side part of
 * the nav: it needs the pathname. The active state is conveyed by `aria-current`, a text colour
 * change and a position indicator bar, so it never relies on colour alone.
 */
export function NavLink({ href, label, layout, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onNavigate={onNavigate}
      className={cn(
        'relative flex items-center rounded-field transition-colors duration-150',
        // Indicator bar: primary-blue is ≥3:1 against the background in both themes.
        'after:absolute after:bg-primary-blue after:opacity-0 after:transition-opacity after:duration-150',
        layout === 'bar' &&
          'min-h-11 px-3 text-label font-medium after:inset-x-3 after:bottom-1 after:h-0.5',
        layout === 'drawer' &&
          'min-h-12 px-4 text-body-lg font-medium after:inset-y-2 after:left-0 after:w-0.5',
        active
          ? cn('text-primary after:opacity-100', layout === 'drawer' && 'bg-background-alt')
          : 'text-secondary hover:text-primary',
      )}
    >
      {label}
    </Link>
  );
}
