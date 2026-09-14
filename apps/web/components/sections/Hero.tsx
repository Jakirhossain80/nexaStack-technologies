import type { HeroContent } from '@/config/content/home';
import { Button } from '@/components/ui/Button';

import { HeroStatPanel } from './HeroStatPanel';
import { HeroVisual } from './HeroVisual';

export interface HeroProps {
  content: HeroContent;
}

/**
 * Homepage hero. Server Component — the entrance motion is pure CSS (`animate-hero-in` in
 * globals.css), so nothing here needs a client boundary. Sits directly under the sticky
 * `Navbar`; since that header is `position: sticky` (not fixed) it occupies real space in
 * normal flow, so no extra top offset is needed to avoid clipping the heading.
 */
export function Hero({ content }: HeroProps) {
  return (
    <section className="page-container section-y">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="animate-hero-in">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>

          <h1 className="mt-4 text-hero font-semibold tracking-tight text-primary">
            {content.heading}
          </h1>

          <p className="mt-6 max-w-xl text-body-lg text-secondary">{content.subheading}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
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

          <div className="mt-10 max-w-sm">
            <HeroStatPanel stats={content.stats} />
          </div>
        </div>

        <HeroVisual className="mx-auto max-w-md lg:mx-0 lg:max-w-none" />
      </div>
    </section>
  );
}
