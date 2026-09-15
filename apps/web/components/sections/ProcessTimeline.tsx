import type { ProcessContent } from '@/config/content/home';
import { processSteps } from '@/config/process';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { ProcessStep } from './ProcessStep';

export interface ProcessTimelineProps {
  content: ProcessContent;
}

/**
 * Homepage "Development Process" section, directly below Why Choose NexaStack — the last
 * section on the page. Server Component; `ScrollReveal` is the one Client Component this
 * section uses, same as every section above it, and animates once on entry with no per-step
 * stagger (root CLAUDE.md 7.6 permits scroll animation for a section's introduction, not a
 * per-item cascade).
 *
 * Built as a single ordered list rather than a card grid (root CLAUDE.md's "numbered timeline"
 * guidance for this section specifically) — the eight steps alternate sides of a centred
 * connecting line on desktop and collapse to one left-aligned column on tablet and mobile.
 * See `ProcessStep` for how alternation is done without touching DOM order. No "view all" link
 * and no closing CTA here: this section is the process in full, and Why Choose NexaStack's own
 * closing CTA immediately above already ends the page's CTA messaging.
 */
export function ProcessTimeline({ content }: ProcessTimelineProps) {
  return (
    <section aria-labelledby="process-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="process-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute top-5 bottom-5 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-cyan via-primary-blue to-violet lg:left-1/2"
          />

          <ol className="flex flex-col gap-10 lg:gap-16">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={step.id}
                step={step}
                position={index + 1}
                side={index % 2 === 0 ? 'right' : 'left'}
              />
            ))}
          </ol>
        </div>
      </ScrollReveal>
    </section>
  );
}
