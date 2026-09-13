import Link from 'next/link';

import { company } from '@/config/company';
import { cn } from '@/lib/cn';

export interface LogoProps {
  className?: string;
  /** Called when the link starts a client-side navigation (used to close the mobile menu). */
  onNavigate?: () => void;
}

/**
 * Temporary text lockup for the site header (and later the footer).
 *
 * TODO(logo): replace with real artwork once it exists (root CLAUDE.md 22.11). Missing: an SVG
 * horizontal lockup, a mark-only version, and a reversed dark-mode variant. The only existing asset
 * is a square raster PNG on an opaque white background, which must not be used here.
 */
export function Logo({ className, onNavigate }: LogoProps) {
  return (
    <Link
      href="/"
      onNavigate={onNavigate}
      className={cn('inline-flex min-h-11 shrink-0 items-center gap-2 rounded-field', className)}
    >
      {/*
       * MARK SLOT — when the SVG mark exists, render it here, e.g.
       *   <LogoMark aria-hidden="true" className="size-8" />
       * Swapping the lettering below for the lockup SVG should be a change to this file only.
       */}

      {/* Lettering is artwork standing in for the logo; the accessible name comes from config. */}
      <span aria-hidden="true" className="flex flex-col">
        <span className="text-card leading-none font-bold tracking-tight">
          <span className="text-primary">Nexa</span>
          <span className="text-primary-blue">Stack</span>
        </span>
        <span className="mt-1 text-label leading-none font-medium tracking-wider text-secondary uppercase">
          Technologies
        </span>
      </span>
      <span className="sr-only">{company.legalName}, home</span>
    </Link>
  );
}
