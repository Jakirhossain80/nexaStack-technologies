import type { PortfolioContent } from '@/config/content/home';
import { getFeaturedProjects } from '@/config/projects';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { ProjectGrid } from './ProjectGrid';

export interface FeaturedPortfolioProps {
  content: PortfolioContent;
}

/**
 * Homepage Featured Portfolio section, directly below Solutions & Industries. Server
 * Component — see `ScrollReveal` for the one Client Component this section uses, and why.
 * The count-aware single-project/grid decision lives in `ProjectGrid`, not here.
 */
export function FeaturedPortfolio({ content }: FeaturedPortfolioProps) {
  const featuredProjects = getFeaturedProjects();

  return (
    <section aria-labelledby="portfolio-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="portfolio-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <div className="mt-10">
          <ProjectGrid projects={featuredProjects} />
        </div>

        <div className="mt-10 flex justify-center">
          <Button href={content.viewAllCta.href} variant="secondary">
            {content.viewAllCta.label}
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
