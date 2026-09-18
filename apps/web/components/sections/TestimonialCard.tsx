import Image from 'next/image';
import Link from 'next/link';

import { StarRating } from '@/components/ui/StarRating';
import type { Testimonial } from '@/config/testimonials';
import { getProjectBySlug } from '@/config/projects';
import { getServiceBySlug } from '@/config/services';
import { cn } from '@/lib/cn';

export interface TestimonialCardProps {
  testimonial: Testimonial;
  /** `featured` is the larger, 1–2-across treatment used at the top of `/testimonials`. */
  size?: 'default' | 'featured';
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
 * Resolves `relatedProjectSlug`/`relatedServiceSlug` against the real, current
 * `config/projects.ts`/`config/services.ts` data — the label is derived here, not hand-typed
 * per entry, so it can't drift from the thing it links to. Returns `null` (renders no link) if
 * the slug doesn't resolve to a real entry, rather than guessing or throwing.
 */
function resolveRelatedLink(testimonial: Testimonial): { href: `/${string}`; label: string } | null {
  if (testimonial.relatedProjectSlug) {
    const project = getProjectBySlug(testimonial.relatedProjectSlug);
    if (project) return { href: project.caseStudyHref, label: 'Read the case study' };
    return null;
  }
  if (testimonial.relatedServiceSlug) {
    const service = getServiceBySlug(testimonial.relatedServiceSlug);
    if (service) return { href: `/services/${service.slug}`, label: 'View this service' };
    return null;
  }
  return null;
}

/**
 * One testimonial card: `<blockquote>`/`<footer>`/`<cite>` is the correct native pattern for an
 * attributed quote, not a generic heading+body card. Flat Design 2.0 shell matching `ProjectCard`
 * (solid surface, 1px border, `shadow-card`, hover elevation).
 *
 * `size="default"` is compact by design: the static grid (`TestimonialGrid`) shows five of these
 * across one row at desktop, so the quote is line-clamped, the avatar is held to the small end
 * of the 40–48px range, and the attribution line is a single condensed row that only wraps if it
 * must. `size="featured"` (used by `/testimonials`' featured section, 1–2 across) drops the
 * line-clamp and sizes everything up a step — same component, no forked markup to keep in sync.
 *
 * Avatar precedence is photo → company logo → initials. A photo or logo gets `alt=""` because
 * `<cite>` already names the person as text right beside it (same reasoning `ProcessStep`'s
 * number badge and `Logo`'s mark use) — an initials avatar is the honest fallback used by
 * GitHub/Slack-style products, not a stand-in stock photo for a real person. A logo-only entry
 * still gets alt text naming the company, since nothing else on the card says who it is.
 */
export function TestimonialCard({ testimonial, size = 'default' }: TestimonialCardProps) {
  const { clientName, clientPosition, clientCompany, photoUrl, companyLogoUrl, quote, rating } =
    testimonial;
  const relatedLink = resolveRelatedLink(testimonial);
  const featured = size === 'featured';
  const avatarSize = featured ? 56 : 44;

  return (
    <div
      className={cn(
        'relative flex h-full flex-col gap-5 overflow-hidden rounded-card border border-default bg-surface shadow-card transition duration-150 ease-out hover:border-default-hover hover:shadow-card-hover',
        featured ? 'p-6 md:p-8' : 'p-5 md:p-6',
      )}
    >
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
        className={cn('absolute top-4 right-4 text-primary-blue/35', featured ? 'size-10' : 'size-8')}
      >
        <path d="M7.17 6C4.88 8.13 3.5 10.7 3.5 13.6c0 3.03 1.94 5.15 4.52 5.15 2.18 0 3.72-1.58 3.72-3.64 0-1.98-1.4-3.48-3.24-3.48-.34 0-.66.05-.86.12.32-1.68 1.86-3.63 3.68-4.7L7.17 6Zm10 0c-2.29 2.13-3.67 4.7-3.67 7.6 0 3.03 1.94 5.15 4.52 5.15 2.18 0 3.72-1.58 3.72-3.64 0-1.98-1.4-3.48-3.24-3.48-.34 0-.66.05-.86.12.32-1.68 1.86-3.63 3.68-4.7L17.17 6Z" />
      </svg>

      <blockquote className="flex flex-1 flex-col gap-5">
        {rating && <StarRating rating={rating} />}

        <p className={cn('flex-1 text-primary', featured ? 'text-body-lg' : 'line-clamp-4 text-body')}>
          {quote}
        </p>

        <footer className="mt-auto flex items-center gap-3">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={avatarSize}
              height={avatarSize}
              className="shrink-0 rounded-full object-cover"
              style={{ width: avatarSize, height: avatarSize }}
            />
          ) : companyLogoUrl ? (
            <Image
              src={companyLogoUrl}
              alt={`${clientCompany} logo`}
              width={avatarSize}
              height={avatarSize}
              className="shrink-0 rounded-full border border-default bg-background-alt object-contain p-1"
              style={{ width: avatarSize, height: avatarSize }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex shrink-0 items-center justify-center rounded-full bg-primary-blue text-label font-semibold text-on-primary"
              style={{ width: avatarSize, height: avatarSize }}
            >
              {getInitials(clientName)}
            </span>
          )}

          <p className="text-label text-secondary">
            <cite className="font-semibold text-primary not-italic">{clientName}</cite> ·{' '}
            {clientPosition} · {clientCompany}
          </p>
        </footer>
      </blockquote>

      {relatedLink && (
        <p className="text-label text-secondary">
          <Link href={relatedLink.href} className={INLINE_LINK_CLASSES}>
            {relatedLink.label}
          </Link>
        </p>
      )}
    </div>
  );
}
