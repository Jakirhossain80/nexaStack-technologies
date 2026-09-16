import Image from 'next/image';
import Link from 'next/link';

import type { Testimonial } from '@/config/testimonials';
import { cn } from '@/lib/cn';

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

const INLINE_LINK_CLASSES =
  'rounded-field text-primary-blue underline-offset-4 focus-ring hover:text-primary-blue-hover hover:underline';

/** First letter of the first and last words of a name, e.g. "Jane Doe" → "JD". */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * One testimonial card: `<blockquote>`/`<footer>`/`<cite>` is the correct native pattern for an
 * attributed quote, not a generic heading+body card. Flat Design 2.0 shell matching `ProjectCard`
 * (solid surface, 1px border, `shadow-card`, hover elevation).
 *
 * Compact by design: the static grid (`TestimonialGrid`) shows five of these across one row at
 * desktop, so the quote is line-clamped, the avatar is held to the small end of the 40–48px
 * range, and the attribution line is a single condensed row that only wraps if it must.
 *
 * Avatar precedence is photo → company logo → initials. A photo or logo gets `alt=""` because
 * `<cite>` already names the person as text right beside it (same reasoning `ProcessStep`'s
 * number badge and `Logo`'s mark use) — an initials avatar is the honest fallback used by
 * GitHub/Slack-style products, not a stand-in stock photo for a real person.
 */
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { name, role, company, photo, logo, quote, relatedLabel, relatedHref } = testimonial;

  return (
    <div className="relative flex h-full flex-col gap-5 overflow-hidden rounded-card border border-default bg-surface p-5 shadow-card transition duration-150 ease-out hover:border-default-hover hover:shadow-card-hover md:p-6">
      {/*
       * Decorative quote mark. `/35` opacity is a deliberate sub-AA value, same precedent as the
       * cyan accent (2.23:1, CLAUDE.md 7.1): purely decorative and `aria-hidden`, so WCAG 1.4.11
       * (non-text contrast) doesn't apply — it isn't required to understand the content. It only
       * needs to be genuinely perceptible, which the previous `/10` (~1.1:1 in both themes,
       * indistinguishable from the card surface) was not. At `/35` it reads as a visible watermark
       * (~1.7–1.9:1 against the surface) without competing with the quote text below it.
       */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="absolute top-4 right-4 size-8 text-primary-blue/35"
      >
        <path d="M7.17 6C4.88 8.13 3.5 10.7 3.5 13.6c0 3.03 1.94 5.15 4.52 5.15 2.18 0 3.72-1.58 3.72-3.64 0-1.98-1.4-3.48-3.24-3.48-.34 0-.66.05-.86.12.32-1.68 1.86-3.63 3.68-4.7L7.17 6Zm10 0c-2.29 2.13-3.67 4.7-3.67 7.6 0 3.03 1.94 5.15 4.52 5.15 2.18 0 3.72-1.58 3.72-3.64 0-1.98-1.4-3.48-3.24-3.48-.34 0-.66.05-.86.12.32-1.68 1.86-3.63 3.68-4.7L17.17 6Z" />
      </svg>

      <blockquote className="flex flex-1 flex-col gap-5">
        <p className="line-clamp-4 text-body text-primary">{quote}</p>

        <footer className="mt-auto flex items-center gap-3">
          {photo ? (
            <Image
              src={photo}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full object-cover"
            />
          ) : logo ? (
            <Image
              src={logo}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full border border-default bg-background-alt object-contain p-1"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-blue text-label font-semibold text-on-primary"
            >
              {getInitials(name)}
            </span>
          )}

          <p className="text-label text-secondary">
            <cite className="font-semibold text-primary not-italic">{name}</cite> · {role} ·{' '}
            {company}
          </p>
        </footer>
      </blockquote>

      {relatedHref && relatedLabel && (
        <p className="text-label text-secondary">
          <Link href={relatedHref} className={cn(INLINE_LINK_CLASSES)}>
            {relatedLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
