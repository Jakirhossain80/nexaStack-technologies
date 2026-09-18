import { getApprovedTestimonials } from '@/config/testimonials';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { TestimonialGrid } from './TestimonialGrid';

/** How many cards the grid's own `xl:grid-cols-5` is built for — see `TestimonialGrid`. */
const HOMEPAGE_TESTIMONIAL_COUNT = 5;

/**
 * Homepage Testimonials section, directly below Development Process. Renders nothing — no
 * heading, no landmark, no gap — while there are no approved testimonials, so the homepage flows
 * straight from Development Process to whatever follows. Fixed eyebrow/heading strings are
 * inlined here rather than added to `config/content/home.ts`: there is no per-item homepage copy
 * to thread through a `content` prop, only these two strings, which no one edits independently of
 * this file.
 *
 * Server Component throughout; `TestimonialGrid` is a static grid, not a carousel — see its own
 * doc comment. `ScrollReveal` is the only Client Component leaf this section uses.
 */
export function Testimonials() {
  const approved = getApprovedTestimonials();
  if (approved.length === 0) return null;

  // Featured entries first (if any exist), then the rest, capped to what the grid actually
  // displays — so a future testimonial marked `featured` is preferred over letting insertion
  // order alone decide which 5 show up here.
  const featured = approved.filter((testimonial) => testimonial.featured);
  const rest = approved.filter((testimonial) => !testimonial.featured);
  const shown = [...featured, ...rest].slice(0, HOMEPAGE_TESTIMONIAL_COUNT);

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
          <TestimonialGrid testimonials={shown} />
        </div>

        <div className="mt-8">
          <Button variant="text" href="/testimonials">
            View all testimonials
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
