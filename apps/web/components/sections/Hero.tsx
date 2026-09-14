import type { HeroContent } from '@/config/content/home';
import { Button } from '@/components/ui/Button';

import { HeroVisual } from './HeroVisual';

export interface HeroProps {
  content: HeroContent;
}

/**
 * Homepage hero. Server Component — the entrance motion is pure CSS (`animate-hero-in` in
 * globals.css), so nothing here needs a client boundary. Sits directly under the sticky
 * `Navbar`; since that header is `position: sticky` (not fixed) it occupies real space in
 * normal flow, so no extra top offset is needed to avoid clipping the heading.
 *
 * `overflow-hidden` contains the decorative grid backdrop; the floating panels in `HeroVisual`
 * sit well inside the section's vertical padding, so they are never clipped.
 */
export function Hero({ content }: HeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 hero-grid opacity-70" />

      <div className="page-container section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="animate-hero-in lg:col-span-6">
            <p className="inline-flex items-center gap-2 rounded-btn border border-default bg-surface px-3 py-1 shadow-card">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-linear-to-r from-cyan via-primary-blue to-violet"
              />
              <span className="font-mono text-label tracking-wide text-secondary">
                {content.eyebrow}
              </span>
            </p>

            <h1
              id="hero-heading"
              className="mt-6 text-hero font-semibold tracking-tight text-balance text-primary"
            >
              {content.heading.lead}{' '}
              <span className="gradient-underline">{content.heading.highlight}</span>
            </h1>

            <p className="mt-6 max-w-xl text-body-lg text-secondary">{content.subheading}</p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button href={content.primaryCta.href} className="w-full sm:w-auto">
                {content.primaryCta.label}
              </Button>
              <Button
                href={content.secondaryCta.href}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {content.secondaryCta.label}
              </Button>
            </div>
          </div>

          <HeroVisual
            stats={content.stats}
            technologies={content.technologies}
            className="mx-auto w-full max-w-xl animate-hero-in lg:col-span-6 lg:mx-0 lg:max-w-none"
          />
        </div>
      </div>
    </section>
  );
}
