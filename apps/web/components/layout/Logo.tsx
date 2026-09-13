import Image from 'next/image';
import Link from 'next/link';

import { company } from '@/config/company';
import { cn } from '@/lib/cn';

export interface LogoProps {
  className?: string;
  /** Called when the link starts a client-side navigation (used to close the mobile menu). */
  onNavigate?: () => void;
}

/**
 * Logo lockup for the site header (and later the footer): the raster mark beside a text wordmark.
 *
 * TODO(logo): the wordmark is still lettering standing in for artwork (root CLAUDE.md 22.11). Still
 * missing: an SVG horizontal lockup and an SVG mark. Swapping either in should be a change to this
 * file only.
 */
export function Logo({ className, onNavigate }: LogoProps) {
  return (
    <Link
      href="/"
      onNavigate={onNavigate}
      className={cn('inline-flex min-h-11 shrink-0 items-center gap-2 rounded-field', className)}
    >
      {/*
       * Decorative: the wordmark beside it already names the company, so a non-empty alt would be
       * announced twice. Explicit dimensions reserve the box; `preload` because it is above the fold.
       * 32px is the floor — the isometric detail turns muddy below it.
       */}
      <Image
        src="/brand/nexastack-mark.png"
        alt=""
        width={36}
        height={36}
        preload
        className="size-8 shrink-0 xl:size-9"
      />

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
