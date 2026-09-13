import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonBaseProps {
  variant?: ButtonVariant;
}

type ButtonAsButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLinkProps = ButtonBaseProps &
  Omit<ComponentProps<typeof Link>, 'href'> & {
    href: string;
  };

/** Pass `href` to render a link that looks like a button; omit it for a `<button>`. */
export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const BASE_CLASSES =
  'group inline-flex min-h-12 items-center justify-center gap-2 rounded-btn text-body font-semibold focus-ring transition duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50';

// Hover is an explicit colour change to a *-hover token (CLAUDE.md 7.1), never a filter, so
// the label keeps its verified contrast. `not-disabled:` keeps disabled buttons static and, unlike
// `enabled:`, also matches links (an <a> is never :enabled).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // on-primary on primary-blue: 4.93:1 light, 5.96:1 dark. On primary-blue-hover: 5.80 / 7.19.
  primary: 'bg-primary-blue px-6 text-on-primary not-disabled:hover:bg-primary-blue-hover',
  secondary:
    'border border-default bg-surface px-6 text-primary not-disabled:hover:border-default-hover not-disabled:hover:bg-surface-hover',
  // primary-blue-hover as text: ≥5.54:1 on background and surface in both themes.
  text: 'px-2 text-primary-blue underline-offset-4 not-disabled:hover:text-primary-blue-hover not-disabled:hover:underline',
};

const textArrow = (
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
);

/**
 * The three permitted button variants (CLAUDE.md 8): primary solid blue, secondary bordered,
 * and text with arrow. 48px minimum height, no pill shape, no glow, token focus ring.
 */
export function Button(props: ButtonProps) {
  const classes = cn(BASE_CLASSES, VARIANT_CLASSES[props.variant ?? 'primary'], props.className);
  const arrow = props.variant === 'text' ? textArrow : null;

  if (props.href !== undefined) {
    const { variant: _variant, className: _className, children, ...linkProps } = props;
    return (
      <Link className={classes} {...linkProps}>
        {children}
        {arrow}
      </Link>
    );
  }

  const {
    variant: _variant,
    className: _className,
    type = 'button',
    children,
    ...buttonProps
  } = props;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
      {arrow}
    </button>
  );
}
