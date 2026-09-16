import type { Metadata } from 'next';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { TestimonialGrid } from '@/components/sections/TestimonialGrid';
import type { Testimonial } from '@/config/testimonials';
import { cn } from '@/lib/cn';

// Dev-only route, not linked from anywhere on the site — same treatment as /dev/tokens.
// Excluded from the sitemap (never added to lib/routes.ts PUBLIC_ROUTES) and from indexing
// (noindex below, and "/dev" is already in lib/routes.ts DISALLOWED_PATHS for robots.txt).
//
// The fixtures below are defined in THIS FILE ONLY, never in config/testimonials.ts, which must
// stay empty until a real client gives permission to be quoted. Every name/company/quote here is
// deliberately, obviously fictional ("Preview Client…", lorem-ipsum copy) so nobody could mistake
// it for a real testimonial if this route were ever stumbled on.

export const metadata: Metadata = {
  title: 'Testimonials layout preview (dev only)',
  robots: { index: false, follow: false },
};

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder quote text used only to check card layout, line length and contrast — not a real testimonial.';

// Five fixtures so this page exercises the real desktop layout: five cards in one row at
// ≥1280px (`TestimonialGrid`'s `xl:grid-cols-5`). Deliberately fictional names/companies and
// lorem-ipsum quotes — none of this could be mistaken for a real client if this route were
// ever found, per the "no fabricated endorsement" rule in `config/testimonials.ts`.
const FIXTURES: readonly Testimonial[] = [
  {
    id: 'fixture-one',
    name: 'Preview Client One',
    role: 'Founder',
    company: 'Preview Company Ltd.',
    quote: LOREM,
    relatedLabel: 'Business websites service',
    relatedHref: '/services/business-websites',
    // No photo/logo — exercises the initials-avatar fallback.
  },
  {
    id: 'fixture-two',
    name: 'Preview Client Two',
    role: 'CTO',
    company: 'Placeholder Startup',
    // Reuses the existing NexaStack mark asset purely to prove the `logo` image path
    // renders at size — not presented as a real client's logo.
    logo: '/brand/nexastack-mark.png',
    quote: LOREM,
    relatedLabel: 'MERN and Next.js application development',
    relatedHref: '/services/mern-nextjs-applications',
  },
  {
    id: 'fixture-three',
    name: 'Preview Client Three',
    role: 'Operations Lead',
    company: 'Sample Company Inc.',
    quote: LOREM,
    // No related link and no photo/logo — exercises the minimal card.
  },
  {
    id: 'fixture-four',
    name: 'Preview Client Four',
    role: 'Product Manager',
    company: 'Test Organization',
    quote: LOREM,
    relatedLabel: 'Full portfolio',
    relatedHref: '/portfolio',
  },
  {
    id: 'fixture-five',
    name: 'Preview Client Five',
    role: 'Operations Manager',
    company: 'Example Freight Co.',
    quote: LOREM,
    // No related link and no photo/logo — second minimal-card instance, fills the five-up row.
  },
] as const;

interface ThemePanelProps {
  mode: 'light' | 'dark';
}

/** Forces a token scope, same technique as TokenProofSheet's ThemePanel. */
function ThemePanel({ mode }: ThemePanelProps) {
  return (
    <div className={cn(mode, 'rounded-card border border-default bg-background p-5 md:p-6')}>
      <p className="mb-4 font-mono text-label text-secondary">
        {mode === 'light' ? 'Light theme' : 'Dark theme'}
      </p>
      <TestimonialGrid testimonials={FIXTURES} />
    </div>
  );
}

export default function TestimonialsPreviewPage() {
  return (
    <div className="page-container space-y-10 section-y">
      <header className="space-y-6">
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-card border border-error bg-surface p-4"
        >
          <span className="rounded-field border border-error px-2 py-0.5 font-mono text-label font-semibold text-error">
            DEV ONLY
          </span>
          <p className="text-body">
            Layout preview for the Testimonials card grid, using fixture data defined in this file
            only. <code className="font-mono">config/testimonials.ts</code> stays empty — see{' '}
            <code className="font-mono">apps/web/CLAUDE.md</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-prose">
            <h1 className="text-page font-semibold tracking-tight">Testimonials layout preview</h1>
            <p className="mt-3 text-body-lg text-secondary">
              Five obviously fictional fixture entries, rendered in both themes, to check the
              five-column desktop row, tablet/mobile wrapping, the quote-mark glyph and contrast
              before any real testimonial exists.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/*
       * Stacked, not side-by-side: each panel needs the full page-container width to actually
       * reach the `xl:grid-cols-5` breakpoint and show a genuine five-across row at 1280px. A
       * lg:grid-cols-2 layout here would halve that width and never trigger it.
       */}
      <div className="space-y-10">
        <ThemePanel mode="light" />
        <ThemePanel mode="dark" />
      </div>
    </div>
  );
}
