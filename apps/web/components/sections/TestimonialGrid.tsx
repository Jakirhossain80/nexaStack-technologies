import type { Testimonial } from '@/config/testimonials';

import { TestimonialCard } from './TestimonialCard';

export interface TestimonialGridProps {
  testimonials: readonly Testimonial[];
}

/**
 * Responsive card grid, shared by the homepage `Testimonials` section and the
 * `/dev/testimonials-preview` fixture page — same split as `ProjectGrid`/`ProjectCard`, so the
 * preview page never has to duplicate grid markup. A carousel is deliberately not used here:
 * autoplay accessibility and manual controls aren't justified for a list that may hold only a
 * handful of entries for a long time — see root CLAUDE.md section 8 on avoiding unjustified
 * motion/complexity.
 */
export function TestimonialGrid({ testimonials }: TestimonialGridProps) {
  if (testimonials.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <li key={testimonial.id} className="flex">
          <TestimonialCard testimonial={testimonial} />
        </li>
      ))}
    </ul>
  );
}
