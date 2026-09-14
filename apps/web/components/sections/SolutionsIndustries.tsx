import type { SolutionsContent } from '@/config/content/home';
import { getFeaturedSolutions } from '@/config/solutions';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/cn';

import { SolutionCard } from './SolutionCard';

export interface SolutionsIndustriesProps {
  content: SolutionsContent;
}

/**
 * Desktop column span per card, in config order: the two longer-copy cards (recruitment,
 * shipping) take the wider 7/12 slot in their row, the next pair mirrors the split 5/7, and the
 * last (startup MVP) is the full-width emphasized banner — see `SolutionsIndustries` doc comment.
 */
const DESKTOP_SPAN = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'] as const;

/**
 * Homepage Solutions & Industries section, directly below Featured Services. Server Component —
 * see `ScrollReveal` for the one Client Component this section uses, and why.
 *
 * Deliberately modular rather than a repeat of the Services 3-up grid (root CLAUDE.md 8): a
 * 12-column desktop grid where the two cards with the most specific copy (recruitment, shipping
 * and logistics) take the wider 7/12 slot in their row, the next pair mirrors the split, and the
 * most universally relevant card (startup MVP) closes the section as a full-width emphasized
 * banner. Only `col-span` on an auto-flowing grid is used — no `grid-template-areas` — so DOM
 * order, reading order and visual order all match despite the asymmetry.
 */
export function SolutionsIndustries({ content }: SolutionsIndustriesProps) {
  const featuredSolutions = getFeaturedSolutions();

  return (
    <section aria-labelledby="solutions-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="solutions-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {featuredSolutions.map((solution, index) => {
            const emphasized = index === featuredSolutions.length - 1;
            return (
              <li
                key={solution.slug}
                className={cn(emphasized ? 'md:col-span-2 lg:col-span-12' : DESKTOP_SPAN[index])}
              >
                <SolutionCard solution={solution} emphasized={emphasized} />
              </li>
            );
          })}
        </ul>
      </ScrollReveal>
    </section>
  );
}
