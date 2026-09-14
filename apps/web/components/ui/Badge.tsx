import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface BadgeProps {
  children: ReactNode;
  /** Geist Mono, for technical labels (CLAUDE.md 7.3) — e.g. a technology tag. */
  mono?: boolean;
  className?: string;
}

/**
 * Small neutral pill: a fact label, never a status/error/warning colour. `rounded-full` is a
 * plain Tailwind utility, not part of the project's custom radius scale — the "no pill shapes"
 * rule (CLAUDE.md 8) is scoped to buttons, not tags or badges.
 */
export function Badge({ children, mono = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-default bg-background-alt px-3 py-1 text-label text-secondary',
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </span>
  );
}
