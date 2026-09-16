import type { ReactNode } from 'react';

import type { CoreValueIcon as CoreValueIconKey } from '@/config/about';

export interface CoreValueIconProps {
  icon: CoreValueIconKey;
  className?: string;
}

const ICON_PATHS: Record<CoreValueIconKey, ReactNode> = {
  // Circle with a check: honesty.
  honesty: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  // A gear: craftsmanship, careful construction.
  craftsmanship: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M4.2 7.8l2.1 1.2M17.7 15l2.1 1.2M4.2 16.2l2.1-1.2M17.7 9l2.1-1.2M3 12h3M18 12h3" />
    </>
  ),
  // A figure in a circle: accessibility.
  accessibility: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="8" r="1.4" />
      <path d="M8 11h8M9 11l-1.5 7M15 11l1.5 7M12 11v3" />
    </>
  ),
  // A direct arrow: directness.
  directness: <path d="M4 12h14M13 6l6 6-6 6" />,
};

/**
 * One of four hand-drawn concept glyphs for Core Values, same shape as `WhyChooseIcon`/
 * `ServiceIcon`/`SolutionIcon`/`TechCategoryIcon` (24x24 viewBox, round caps/joins,
 * `stroke="currentColor"`). A distinct icon set from `WhyChooseIcon` — different concepts, not a
 * reuse of that component's six glyphs. Decorative: `aria-hidden`, the title beside it carries
 * the meaning.
 */
export function CoreValueIcon({ icon, className }: CoreValueIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICON_PATHS[icon]}
    </svg>
  );
}
