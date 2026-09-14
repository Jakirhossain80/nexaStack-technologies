import type { ReactNode } from 'react';

import type { TechCategoryIcon as TechCategoryIconKey } from '@/config/technologies';

export interface TechCategoryIconProps {
  icon: TechCategoryIconKey;
  /** Namespaces the gradient id so multiple tiles on one page don't collide (e.g. the category id). */
  gradientId: string;
  className?: string;
}

const ICON_PATHS: Record<TechCategoryIconKey, ReactNode> = {
  // Browser chrome: frontend. Same concept as ServiceIcon's `globe`, redrawn here since the two
  // icon sets are keyed by different enums.
  browser: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </>
  ),
  // Rack unit: backend server.
  server: (
    <>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  // Cylinder: database.
  database: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </>
  ),
  // Shield with a check: authentication.
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Paint palette: UI and styling. Stroke-only, like every other glyph — no filled dots.
  palette: (
    <>
      <path d="M12 4a8 8 0 1 0 0 16c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h1.5A3.5 3.5 0 0 0 20.5 9c0-2.8-3.8-5-8.5-5Z" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="12" cy="16" r="1" />
    </>
  ),
  // Terminal window with a prompt: development tools.
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3M12 15h5" />
    </>
  ),
};

/**
 * One of six hand-drawn category glyphs, in the same stroke style as `ServiceIcon`/
 * `SolutionIcon` (24x24 viewBox, round caps/joins, brand-gradient stroke) — generic concept
 * icons for the technology stack, not tied to a service or industry. Decorative: `aria-hidden`,
 * the category name beside it carries the meaning.
 */
export function TechCategoryIcon({ icon, gradientId, className }: TechCategoryIconProps) {
  const id = `tech-icon-gradient-${gradientId}`;
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
