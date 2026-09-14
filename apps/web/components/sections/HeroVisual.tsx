import { cn } from '@/lib/cn';

export interface HeroVisualProps {
  className?: string;
}

/**
 * PLACEHOLDER: an abstract geometric composition standing in for a real project screenshot or
 * browser mockup, which don't exist yet (no portfolio built — root CLAUDE.md 22.10). Replace
 * this whole component once real project imagery is available.
 *
 * Inline SVG, static (no animation), purely decorative — `aria-hidden` on the root. Gradient
 * stops reference the CSS custom properties directly so the fill re-resolves under the `.dark`
 * scope automatically, using the design system's own calibrated dark-mode values (already
 * brighter to read against navy) rather than a separate "dark" gradient. No glow/blur filters,
 * keeping dark mode's glow minimal by construction (root CLAUDE.md 8).
 */
export function HeroVisual({ className }: HeroVisualProps) {
  return (
    <div aria-hidden="true" className={cn('aspect-square w-full', className)}>
      <svg viewBox="0 0 480 480" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="hero-visual-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--nx-cyan)" />
            <stop offset="50%" stopColor="var(--nx-primary-blue)" />
            <stop offset="100%" stopColor="var(--nx-violet)" />
          </linearGradient>
          <pattern id="hero-visual-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="var(--nx-border)" />
          </pattern>
        </defs>

        {/* Sparse node/dot grid filling the field, subtle at rest. */}
        <rect x="0" y="0" width="480" height="480" fill="url(#hero-visual-grid)" />

        {/* Three offset isometric planes, echoing the logo's angular mark. */}
        <rect
          x="96"
          y="184"
          width="230"
          height="150"
          rx="18"
          transform="skewY(-10) translate(20 46)"
          fill="url(#hero-visual-gradient)"
          opacity="0.12"
        />
        <rect
          x="86"
          y="120"
          width="230"
          height="150"
          rx="18"
          transform="skewY(-10)"
          fill="url(#hero-visual-gradient)"
          opacity="0.32"
          stroke="var(--nx-border)"
        />
        <rect
          x="146"
          y="70"
          width="196"
          height="128"
          rx="16"
          transform="skewY(-10) translate(28 -18)"
          fill="var(--nx-surface)"
          stroke="url(#hero-visual-gradient)"
          strokeWidth="2"
        />

        {/* A few connected nodes, top right — restrained, no more than a hint of a network. */}
        <g stroke="var(--nx-border)" fill="none">
          <path d="M338 96 L392 68 M392 68 L436 92 M338 96 L436 92" />
        </g>
        <circle cx="338" cy="96" r="5" fill="var(--nx-cyan)" />
        <circle cx="392" cy="68" r="5" fill="var(--nx-primary-blue)" />
        <circle cx="436" cy="92" r="5" fill="var(--nx-violet)" />
      </svg>
    </div>
  );
}
