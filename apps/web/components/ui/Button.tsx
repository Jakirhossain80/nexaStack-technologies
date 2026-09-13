import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Hover is an explicit colour change to a *-hover token (CLAUDE.md 7.1), never a filter, so
// the label keeps its verified contrast. `enabled:` keeps disabled buttons static.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // on-primary on primary-blue: 4.93:1 light, 5.96:1 dark. On primary-blue-hover: 5.80 / 7.19.
  primary: 'bg-primary-blue px-6 text-on-primary enabled:hover:bg-primary-blue-hover',
  secondary:
    'border border-default bg-surface px-6 text-primary enabled:hover:border-default-hover enabled:hover:bg-surface-hover',
  // primary-blue-hover as text: ≥5.54:1 on background and surface in both themes.
  text: 'px-2 text-primary-blue underline-offset-4 enabled:hover:text-primary-blue-hover enabled:hover:underline',
};

/**
 * The three permitted button variants (CLAUDE.md 8): primary solid blue, secondary bordered,
 * and text with arrow. 48px minimum height, no pill shape, no glow, token focus ring.
 */
export function Button({
  variant = 'primary',
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'group inline-flex min-h-12 items-center justify-center gap-2 rounded-btn text-body font-semibold focus-ring transition duration-150 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
      {variant === 'text' ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 transition-transform duration-150 ease-out group-hover:translate-x-1 group-disabled:translate-x-0"
        >
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      ) : null}
    </button>
  );
}
