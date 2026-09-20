'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface RouteErrorProps {
  /** The error Next.js hands to an `error.tsx`. Only `digest` is ever shown; see below. */
  error: Error & { digest?: string };
  /** Re-renders the failed segment. Provided by Next.js. */
  reset: () => void;
  /** Where the secondary link goes: `/` for the public site, `/admin` inside the admin. */
  homeHref: string;
  homeLabel: string;
  /** Extra sentence after the generic message, e.g. for the admin, where the API may be waking up. */
  hint?: string;
  /** True when rendered inside a layout that already provides the page container (the admin shell). */
  embedded?: boolean;
}

/**
 * The on-brand error boundary body shared by every `error.tsx`. It deliberately never renders
 * `error.message` or the stack: in production Next.js replaces a server error's message with a
 * generic one and a `digest`, and the real detail stays in the server log (root CLAUDE.md 11.2 —
 * nothing internal reaches the visitor). The digest is shown only as a reference someone can quote
 * back to find the log line.
 *
 * Focus moves to the heading on mount, so a keyboard or screen-reader user is told something went
 * wrong instead of being left on whatever they had activated.
 */
export function RouteError({ error, reset, homeHref, homeLabel, hint, embedded = false }: RouteErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={cn(!embedded && 'page-container section-y')}>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-page font-semibold tracking-tight text-primary focus:outline-none"
      >
        Something went wrong
      </h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        This page could not be loaded. Nothing you entered has been lost or sent. Try again, or head
        back to the start.
        {hint ? ` ${hint}` : ''}
      </p>
      {error.digest && (
        <p className="mt-4 text-label text-secondary">
          Reference: <span className="font-mono text-primary">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={reset} className="w-full sm:w-auto">
          Try again
        </Button>
        <Button href={homeHref} variant="secondary" className="w-full sm:w-auto">
          {homeLabel}
        </Button>
      </div>
    </div>
  );
}
