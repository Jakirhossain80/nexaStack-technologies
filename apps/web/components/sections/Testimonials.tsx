import { testimonials } from '@/config/testimonials';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { TestimonialGrid } from './TestimonialGrid';

/**
 * Homepage Testimonials section, directly below Development Process. Renders nothing — no
 * heading, no landmark, no gap — while `config/testimonials.ts` is empty, so the homepage flows
 * straight from Development Process to whatever follows. Fixed eyebrow/heading strings are
 * inlined here rather than added to `config/content/home.ts`: there is no per-item homepage copy
 * to thread through a `content` prop, only these two strings, which no one edits independently of
 * this file.
 *
 * Server Component throughout; `TestimonialGrid` is a static grid, not a carousel — see its own
 * doc comment. `ScrollReveal` is the only Client Component leaf this section uses.
 */
export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            What people are saying
          </h2>
          <p className="mt-4 text-label text-secondary">
            Demo testimonials — fictional names, companies, comments, and AI-generated portraits
            shown for preview purposes.
          </p>
        </div>

        <div className="mt-10">
          <TestimonialGrid testimonials={testimonials} />
        </div>
      </ScrollReveal>
    </section>
  );
}
