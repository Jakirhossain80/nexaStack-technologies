'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { THEMES, type Theme } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'size-5',
} as const;

const ICONS: Record<Theme, ReactNode> = {
  light: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  dark: (
    <svg {...ICON_PROPS}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  system: (
    <svg {...ICON_PROPS}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
};

export type ThemeToggleVariant = 'labelled' | 'compact';

export interface ThemeToggleProps {
  /**
   * `labelled` (default): visible legend and text options.
   * `compact`: icon-only options for the site header; the legend and option names stay available
   * to assistive technology.
   */
  variant?: ThemeToggleVariant;
  className?: string;
}

/** Light / dark / system selector. A native radio group: arrow keys move between options. */
export function ThemeToggle({ variant = 'labelled', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const name = useId();
  const compact = variant === 'compact';

  return (
    <fieldset className={cn(compact ? 'inline-flex' : 'inline-flex flex-col gap-2', className)}>
      <legend className={compact ? 'sr-only' : 'mb-2 text-label font-medium text-secondary'}>
        Colour theme
      </legend>
      <div
        className={cn(
          'inline-flex rounded-btn border border-default bg-background-alt p-1',
          // Compact segments sit flush so the control fits a 360px-wide header.
          compact ? 'gap-0' : 'gap-1',
        )}
      >
        {THEMES.map((option) => (
          <label
            key={option}
            className={cn(
              'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-field border border-transparent text-secondary transition-colors duration-150',
              !compact && 'px-4 text-label font-medium',
              'hover:text-primary',
              // Selected state must stand out clearly (≥3:1), not just a surface tint.
              'has-checked:bg-primary-blue has-checked:text-on-primary has-checked:hover:text-on-primary',
              !compact && 'has-checked:font-semibold',
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-blue',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={theme === option}
              onChange={() => setTheme(option)}
              className="sr-only"
            />
            {compact ? (
              <>
                {ICONS[option]}
                <span className="sr-only">{LABELS[option]}</span>
              </>
            ) : (
              LABELS[option]
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
