import type { ReactNode } from 'react';

import type { WhyChooseIcon as WhyChooseIconKey } from '@/config/why-choose';

export interface WhyChooseIconProps {
  icon: WhyChooseIconKey;
  className?: string;
}

const ICON_PATHS: Record<WhyChooseIconKey, ReactNode> = {
  // Adjustable sliders: custom solutions.
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="17" cy="12" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  // Monitor with an overlapping phone: responsive development.
  devices: (
    <>
      <rect x="3" y="4" width="13" height="10" rx="1.5" />
      <path d="M3 14h13" />
      <rect x="16" y="8" width="5" height="9" rx="1" />
      <path d="M18 15h.01" />
    </>
  ),
  // Shield with a check: secure applications. Same concept as TechCategoryIcon's `shield`,
  // redrawn here since it's a different enum.
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Angle brackets: maintainable code. Same concept as ServiceIcon's `api`, redrawn.
  code: <path d="M8 4 3 12l5 8M16 4l5 8-5 8" />,
  // Speech bubble: clear communication.
  chat: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      <path d="M7 9h10M7 12.5h6" />
    </>
  ),
  // Wrench: post-launch support. Same concept as ServiceIcon's `wrench`, redrawn.
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2-2 2.7-2.7Z" />
  ),
};

/**
 * One of six hand-drawn concept glyphs, in the same stroke style as `ServiceIcon`/
 * `SolutionIcon`/`TechCategoryIcon` (24x24 viewBox, round caps/joins) but — deliberately,
 * unlike those three — no gradient: `stroke="currentColor"`, coloured by the parent badge's
 * `text-primary-blue`. This section reserves the gradient for the closing CTA only.
 * Decorative: `aria-hidden`, the item title beside it carries the meaning.
 */
export function WhyChooseIcon({ icon, className }: WhyChooseIconProps) {
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
