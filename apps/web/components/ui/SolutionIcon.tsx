import type { ReactNode } from 'react';

import type { SolutionIcon as SolutionIconKey } from '@/config/solutions';

export interface SolutionIconProps {
  icon: SolutionIconKey;
  /** Namespaces the gradient id so multiple cards on one page don't collide (e.g. the solution slug). */
  gradientId: string;
  className?: string;
}

const ICON_PATHS: Record<SolutionIconKey, ReactNode> = {
  // ID badge with a candidate silhouette: recruitment and job portals.
  recruitment: (
    <>
      <rect x="5" y="6" width="14" height="15" rx="2" />
      <path d="M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
      <circle cx="12" cy="12.5" r="2.25" />
      <path d="M8.5 18c0-2 1.6-3.25 3.5-3.25s3.5 1.25 3.5 3.25" />
    </>
  ),
  // Open shipping crate: shipping and logistics systems.
  logistics: (
    <>
      <path d="M4 9.5 12 5l8 4.5v8.5l-8 4-8-4V9.5Z" />
      <path d="M4 9.5 12 14l8-4.5" />
      <path d="M12 14v8" />
    </>
  ),
  // Clipboard checklist: internal business-management tools.
  'business-ops': (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M8.5 11h7M8.5 14.5h4.5" />
      <path d="m8.5 17.5 1.5 1.5 3-3.5" />
    </>
  ),
  // Shopping bag: e-commerce platforms.
  ecommerce: (
    <>
      <path d="M6.5 8h11l-1 12.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5L6.5 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  // Rocket: startup MVP development.
  'startup-mvp': (
    <>
      <path d="M12 2.5c2.8 2 4.3 5.3 4.3 8.7 0 2.1-.5 4.1-1.6 5.7l-.9 3-1.8-1.9-1.8 1.9-.9-3C8.2 15.3 7.7 13.3 7.7 11.2c0-3.4 1.5-6.7 4.3-8.7Z" />
      <circle cx="12" cy="10.5" r="1.5" />
      <path d="M8.6 15.8 5.8 18.5M15.4 15.8l2.8 2.7" />
    </>
  ),
};

/**
 * One of five hand-drawn industry glyphs, in the same stroke style as `ServiceIcon` (24x24
 * viewBox, round caps/joins, brand-gradient stroke) — a related but distinct set, since these mark
 * a domain (who it's for) rather than a capability (what we build). Decorative: `aria-hidden`, the
 * card title beside it carries the meaning.
 */
export function SolutionIcon({ icon, gradientId, className }: SolutionIconProps) {
  const id = `solution-icon-gradient-${gradientId}`;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke={`url(#${id})`}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--nx-cyan)" />
          <stop offset="50%" stopColor="var(--nx-primary-blue)" />
          <stop offset="100%" stopColor="var(--nx-violet)" />
        </linearGradient>
      </defs>
      {ICON_PATHS[icon]}
    </svg>
  );
}
