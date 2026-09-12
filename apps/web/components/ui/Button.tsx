import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // on-primary is white in light mode (4.93:1) and dark navy in dark mode (5.96:1).
  primary: 'bg-primary-blue text-on-primary px-6 hover:brightness-95',
  secondary: 'border-default bg-surface text-primary hover:bg-background-alt border px-6',
  text: 'text-primary-blue px-2 underline-offset-4 hover:underline',
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
