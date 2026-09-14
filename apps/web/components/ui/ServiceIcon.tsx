import type { ReactNode } from 'react';

import type { ServiceIcon as ServiceIconKey } from '@/config/services';

export interface ServiceIconProps {
  icon: ServiceIconKey;
  /** Namespaces the gradient id so multiple cards on one page don't collide (e.g. the service slug). */
  gradientId: string;
  className?: string;
}

const ICON_PATHS: Record<ServiceIconKey, ReactNode> = {
  // Browser window: business websites.
  globe: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
    </>
  ),
  // Stacked layers: full-stack MERN/Next.js applications.
  stack: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  // 2x2 tile grid: admin dashboards.
  dashboard: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  // Code brackets: backend and API development.
  api: <path d="M8 4 3 12l5 8M16 4l5 8-5 8" />,
  // Wrench: maintenance and bug fixing.
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2-2 2.7-2.7Z" />
  ),
  // Gauge: performance, SEO and accessibility audits.
  gauge: (
    <>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l3.5-4.5" />
      <path d="M12 15h.01" />
    </>
  ),
};

/**
 * One of six hand-drawn service glyphs, in the same stroke style as the header icons
 * (ThemeMenu, MobileMenu — 24x24 viewBox, round caps/joins). Decorative: `aria-hidden`, the
 * card title beside it carries the meaning. The stroke is the brand gradient — a sparing accent
 * on the icon only, never the card surface (root CLAUDE.md 7.2, 8).
 */
export function ServiceIcon({ icon, gradientId, className }: ServiceIconProps) {
  const id = `service-icon-gradient-${gradientId}`;
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
