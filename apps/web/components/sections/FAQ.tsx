import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { WhatsAppLink } from '@/components/layout/WhatsAppLink';
import { Button } from '@/components/ui/Button';
import type { FaqContent } from '@/config/content/home';
import { faqItems, type FaqItem } from '@/config/faq';

export interface FAQProps {
  content: FaqContent;
}

const INLINE_LINK_CLASSES =
  'rounded-field text-primary-blue underline-offset-4 focus-ring hover:text-primary-blue-hover hover:underline';

/** Renders `item.answer`, swapping any `inlineLinks` substrings for real links. Same text either way. */
function renderAnswer(item: FaqItem) {
  const links = item.inlineLinks;
  if (!links || links.length === 0) return item.answer;

  const pattern = new RegExp(`(${links.map((link) => escapeRegExp(link.text)).join('|')})`, 'g');
  return item.answer.split(pattern).map((part, index) => {
    const link = links.find((candidate) => candidate.text === part);
    return link ? (
      <Link key={index} href={link.href} className={INLINE_LINK_CLASSES}>
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    );
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Homepage FAQ section, directly below Testimonials — a single-column disclosure list, not
 * another card grid. Server Component; `Accordion` (components/ui/Accordion.tsx) is the only
 * Client Component here, for the Radix open/close state. `FAQPage` JSON-LD is built straight
 * from `faqItems` below, so it cannot drift from the visible content.
 */
export function FAQ({ content }: FAQProps) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
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
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p>{renderAnswer(item)}</p>
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
