import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { Button } from '@/components/ui/Button';
import type { FaqContent } from '@/config/content/home';
import { faqItems } from '@/config/faq';
import { renderFaqAnswer } from '@/lib/faq';

export interface FAQProps {
  content: FaqContent;
}

/**
 * Homepage FAQ section, directly below Testimonials — a single-column disclosure list, not
 * another card grid. Server Component; `Accordion` (components/ui/Accordion.tsx) is the only
 * Client Component here, for the Radix open/close state. Shows only the curated
 * `showOnHomepage` subset — everything (13 items across 5 categories, with search and category
 * filtering) lives at `/faq`. `FAQPage` JSON-LD is built from that same subset, so it cannot
 * drift from what's actually visible here.
 */
export function FAQ({ content }: FAQProps) {
  const homepageFaqItems = faqItems.filter((item) => item.showOnHomepage);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homepageFaqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">{content.eyebrow}</p>
          <h2 id="faq-heading" className="mt-4 text-section font-semibold tracking-tight text-primary">
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <Accordion type="multiple" className="mt-10 max-w-2xl border-t border-default">
          {homepageFaqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p>{renderFaqAnswer(item)}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 flex max-w-2xl flex-col items-start gap-4 border-t border-default pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-secondary">Still have questions?</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="text" href="/contact">
              Contact us
            </Button>
            <WhatsAppLink />
          </div>
        </div>
      </ScrollReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
