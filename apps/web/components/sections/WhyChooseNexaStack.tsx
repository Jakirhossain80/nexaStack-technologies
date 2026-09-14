import type { WhyChooseContent } from '@/config/content/home';
import { whyChooseItems } from '@/config/why-choose';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { WhyChooseItem } from './WhyChooseItem';

export interface WhyChooseNexaStackProps {
  content: WhyChooseContent;
}

const CLOSING_HIGHLIGHT = 'your project';

/**
 * Homepage "Why Choose NexaStack" section, directly below Technology Stack. Server Component —
 * see `ScrollReveal` for the one Client Component this section uses, and why.
 *
 * Deliberately not another bordered/shadowed card grid (root CLAUDE.md 8): the six items are
 * plain icon-and-text blocks with generous spacing and no card chrome, a intentional change of
 * rhythm after four consecutive card treatments (Services, Solutions, Portfolio, Technologies).
 * None of the six items links anywhere — no stretched-link pattern here, since none has an
 * individual destination.
 */
export function WhyChooseNexaStack({ content }: WhyChooseNexaStackProps) {
  return (
    <section aria-labelledby="why-choose-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="why-choose-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-x-12 lg:grid-cols-3 lg:gap-y-14">
          {whyChooseItems.map((item) => (
            <WhyChooseItem key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-center sm:mt-20">
          <p className="text-card font-semibold text-primary">
            {content.closingCta.heading.includes(CLOSING_HIGHLIGHT)
              ? content.closingCta.heading.split(CLOSING_HIGHLIGHT).map((part, index, parts) => (
                  <span key={index}>
                    {part}
                    {index < parts.length - 1 && (
                      <span className="gradient-underline">{CLOSING_HIGHLIGHT}</span>
                    )}
                  </span>
                ))
              : content.closingCta.heading}
          </p>
          <Button href={content.closingCta.cta.href}>{content.closingCta.cta.label}</Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
