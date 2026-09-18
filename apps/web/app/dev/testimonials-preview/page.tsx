import type { Metadata } from 'next';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { TestimonialCard } from '@/components/sections/TestimonialCard';
import { TestimonialGrid } from '@/components/sections/TestimonialGrid';
import type { Testimonial } from '@/config/testimonials';
import { cn } from '@/lib/cn';

// Dev-only route, not linked from anywhere on the site — same treatment as /dev/tokens.
// Excluded from the sitemap (never added to lib/routes.ts PUBLIC_ROUTES) and from indexing
// (noindex below, and "/dev" is already in lib/routes.ts DISALLOWED_PATHS for robots.txt).
//
// The fixtures below are defined in THIS FILE ONLY, never added to config/testimonials.ts.
// That file currently holds only the 5 owner-requested, homepage-disclosed demo entries — no
// new fabricated entry (real-looking or demo-labeled) belongs there; every new example needed to
// build/verify this UI belongs only here. Every name/company/quote below is deliberately,
// obviously fictional ("Preview Client…", lorem-ipsum copy) so nobody could mistake it for a
// real testimonial if this route were ever stumbled on.

export const metadata: Metadata = {
  title: 'Testimonials layout preview (dev only)',
  robots: { index: false, follow: false },
};

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder quote text used only to check card layout, line length and contrast — not a real testimonial.';

// Fixtures so this page exercises the real desktop layout: five-plus cards, wrapping past one
// row at ≥1280px (`TestimonialGrid`'s `xl:grid-cols-5`). Deliberately fictional names/companies
// and lorem-ipsum quotes — none of this could be mistaken for a real client if this route were
// ever found, per the "no fabricated endorsement" rule in `config/testimonials.ts`. Every
// `relatedProjectSlug`/`relatedServiceSlug` below resolves to a real entry in
// `config/projects.ts`/`config/services.ts` — the whole point of these two fields is that they
// can't silently drift from what they link to, so the fixtures prove that resolution works.
const FIXTURES: readonly Testimonial[] = [
  {
    id: 'fixture-one',
    clientName: 'Preview Client One',
    clientPosition: 'Founder',
    clientCompany: 'Preview Company Ltd.',
    quote: LOREM,
    relatedServiceSlug: 'business-websites',
    approved: true,
    // No photo/logo — exercises the initials-avatar fallback.
  },
  {
    id: 'fixture-two',
    clientName: 'Preview Client Two',
    clientPosition: 'CTO',
    clientCompany: 'Placeholder Startup',
    // Reuses the existing NexaStack mark asset purely to prove the `companyLogoUrl` image
    // path renders at size — not presented as a real client's logo.
    companyLogoUrl: '/brand/nexastack-mark.png',
    quote: LOREM,
    relatedServiceSlug: 'mern-nextjs-applications',
    approved: true,
  },
  {
    id: 'fixture-three',
    clientName: 'Preview Client Three',
    clientPosition: 'Operations Lead',
    clientCompany: 'Sample Company Inc.',
    quote: LOREM,
    approved: true,
    // No related link and no photo/logo — exercises the minimal card.
  },
  {
    id: 'fixture-four',
    clientName: 'Preview Client Four',
    clientPosition: 'Product Manager',
    clientCompany: 'Test Organization',
    quote: LOREM,
    relatedServiceSlug: 'admin-dashboards',
    approved: true,
  },
  {
    id: 'fixture-five',
    clientName: 'Preview Client Five',
    clientPosition: 'Operations Manager',
    clientCompany: 'Example Freight Co.',
    quote: LOREM,
    approved: true,
    // No related link and no photo/logo — second minimal-card instance, fills the five-up row.
  },
  // New fixtures below, covering the fields this task added.
  {
    id: 'fixture-six-rating',
    clientName: 'Preview Client Six',
    clientPosition: 'Marketing Director',
    clientCompany: 'Fixture Retail Group',
    quote: LOREM,
    rating: 5,
    relatedServiceSlug: 'performance-seo-audits',
    approved: true,
    // Exercises `rating` — a filled 5-star row with the "Rated 5 out of 5" accessible label.
  },
  {
    id: 'fixture-seven-project',
    clientName: 'Preview Client Seven',
    clientPosition: 'Head of Product',
    clientCompany: 'Fixture Hiring Platform',
    quote: LOREM,
    rating: 4,
    // The one real project currently in config/projects.ts — exercises relatedProjectSlug
    // resolving to a real case-study link ("Read the case study"), not a service link.
    relatedProjectSlug: 'careerbridge',
    approved: true,
  },
  {
    id: 'fixture-eight-featured',
    clientName: 'Preview Client Eight',
    clientPosition: 'CEO',
    clientCompany: 'Fixture Logistics Co.',
    quote: LOREM,
    rating: 5,
    relatedServiceSlug: 'backend-and-apis',
    featured: true,
    approved: true,
    // Exercises `featured` — this is the one shown in the featured/large-card section on
    // /testimonials when fixture data is swapped in for layout checks.
  },
] as const;

interface ThemePanelProps {
  mode: 'light' | 'dark';
}

const featuredFixture = FIXTURES.find((testimonial) => testimonial.featured);

/** Forces a token scope, same technique as TokenProofSheet's ThemePanel. */
function ThemePanel({ mode }: ThemePanelProps) {
  return (
    <div className={cn(mode, 'rounded-card border border-default bg-background p-5 md:p-6')}>
      <p className="mb-4 font-mono text-label text-secondary">
        {mode === 'light' ? 'Light theme' : 'Dark theme'}
      </p>

      {featuredFixture && (
        <div className="mb-8">
          <p className="mb-3 font-mono text-label text-secondary">
            Featured treatment (size=&quot;featured&quot;) — used at the top of /testimonials
          </p>
          <div className="max-w-xl">
            <TestimonialCard testimonial={featuredFixture} size="featured" />
          </div>
        </div>
      )}

      <p className="mb-3 font-mono text-label text-secondary">Standard grid (size=&quot;default&quot;)</p>
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
            only. New fixture data for layout checks belongs only here, never in{' '}
            <code className="font-mono">config/testimonials.ts</code> — see{' '}
            <code className="font-mono">apps/web/CLAUDE.md</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-prose">
            <h1 className="text-page font-semibold tracking-tight">Testimonials layout preview</h1>
            <p className="mt-3 text-body-lg text-secondary">
              Eight obviously fictional fixture entries, rendered in both themes, to check the
              featured card treatment, the five-column desktop row, tablet/mobile wrapping, star
              ratings, related-project/service links, and contrast — before any real testimonial
              with these fields exists.
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
