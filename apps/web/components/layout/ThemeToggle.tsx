'use client';

import { useId } from 'react';

import { cn } from '@/lib/cn';
import { THEMES, type Theme } from '@/lib/theme';

import { useTheme } from './ThemeProvider';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export interface ThemeToggleProps {
  className?: string;
}

/** Light / dark / system selector. A native radio group: arrow keys move between options. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const name = useId();

  return (
    <fieldset className={cn('inline-flex flex-col gap-2', className)}>
      <legend className="mb-2 text-label font-medium text-secondary">Colour theme</legend>
      <div className="inline-flex gap-1 rounded-btn border border-default bg-background-alt p-1">
        {THEMES.map((option) => (
          <label
            key={option}
            className={cn(
              'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-field border border-transparent px-4 text-label font-medium text-secondary transition-colors duration-150',
              'hover:text-primary',
              // Selected state must stand out clearly (≥3:1), not just a surface tint.
              'has-checked:bg-primary-blue has-checked:font-semibold has-checked:text-on-primary has-checked:hover:text-on-primary',
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
            {LABELS[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
