import type { FeaturedServicesContent } from '@/config/content/home';
import { getFeaturedServices } from '@/config/services';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { ServiceCard } from './ServiceCard';

export interface FeaturedServicesProps {
  content: FeaturedServicesContent;
}

/**
 * Homepage services grid. Server Component — see `ScrollReveal` for the one Client Component
 * this section uses, and why. Three columns at desktop (`lg`), two at tablet (`md`), one on
 * mobile; equal card heights come from CSS Grid's default row stretch, no extra code.
 */
export function FeaturedServices({ content }: FeaturedServicesProps) {
  const featuredServices = getFeaturedServices();

  return (
    <section aria-labelledby="featured-services-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="featured-services-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <li key={service.slug}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Button href={content.viewAllCta.href} variant="secondary">
            {content.viewAllCta.label}
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
