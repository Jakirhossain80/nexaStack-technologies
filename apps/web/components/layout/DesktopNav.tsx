import { primaryNavigation } from '@/config/navigation';

import { NavLink } from './NavLink';

export interface DesktopNavProps {
  className?: string;
}

/** Horizontal primary navigation. Server-rendered; only each link reads the pathname. */
export function DesktopNav({ className }: DesktopNavProps) {
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-1">
        {primaryNavigation.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} label={item.label} layout="bar" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
