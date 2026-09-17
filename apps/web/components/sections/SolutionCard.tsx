import Link from 'next/link';

import { SolutionIcon } from '@/components/ui/SolutionIcon';
import type { Solution } from '@/config/solutions';
import { cn } from '@/lib/cn';

export interface SolutionCardProps {
  solution: Solution;
  /** The one full-width, larger-emphasis card in the modular layout (startup-mvp-development). */
  emphasized?: boolean;
  /** Visible text on the stretched-link affordance row — same idea as `ServiceCard`'s prop. */
  ctaLabel?: string;
}

/**
 * Flat Design 2.0 card, same anatomy and stretched-link pattern as `ServiceCard` (see that file
 * for the accessibility rationale — the real `<Link>` wraps only the title, so its accessible
 * name is the title alone, and a `::before` overlay on that link covers the whole card as the
 * click target and the focus-ring surface).
 *
 * `emphasized` only changes scale (padding, icon size) and adds the brand-gradient top accent —
 * a permitted "decorative line" use of the gradient (root CLAUDE.md 7.2), applied to exactly this
 * one card. Heading size is intentionally unchanged: `text-card` is the token for every card
 * title, emphasized or not.
 */
export function SolutionCard({ solution, emphasized = false, ctaLabel = 'Explore' }: SolutionCardProps) {
  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-card border border-default bg-surface shadow-card transition duration-150 ease-out hover:border-default-hover hover:shadow-card-hover',
        emphasized ? 'p-8' : 'p-6',
      )}
    >
      {emphasized && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 rounded-t-card bg-linear-to-r from-cyan via-primary-blue to-violet"
        />
      )}

      <span
        className={cn(
          'inline-flex items-center justify-center rounded-field bg-background-alt',
          emphasized ? 'size-14' : 'size-11',
        )}
      >
        <SolutionIcon
          icon={solution.icon}
          gradientId={solution.slug}
          className={emphasized ? 'size-7' : 'size-6'}
        />
      </span>

      <h3 className="mt-4 text-card font-semibold text-primary">
        <Link
          href={`/solutions/${solution.slug}`}
          className="outline-none before:absolute before:inset-0 focus-visible:before:rounded-card focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-primary-blue"
        >
          {solution.title}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-body text-secondary">{solution.summary}</p>

      <span
        aria-hidden="true"
        className="mt-4 inline-flex items-center gap-1 text-body font-semibold text-primary-blue"
      >
        {ctaLabel}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-1"
        >
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
    </div>
  );
}
