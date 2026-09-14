import type { TechnologyContent } from '@/config/content/home';
import { technologyCategories } from '@/config/technologies';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import { TechCategoryTile } from './TechCategoryTile';

export interface TechnologyStackProps {
  content: TechnologyContent;
}

/**
 * Desktop column span per category, in config order: Frontend and Backend anchor the section as
 * full-width-pair "large" tiles (every build has both layers); the remaining four are equal
 * "standard" tiles in one row. Two size tiers only, per root CLAUDE.md 4's "restrained" bento
 * instruction — this is the one section on the site where bento is sanctioned.
 */
const DESKTOP_SPAN = [
  'lg:col-span-6',
  'lg:col-span-6',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
  'lg:col-span-3',
] as const;

/**
 * Homepage Technology Stack section, directly below Featured Portfolio. Server Component — see
 * `ScrollReveal` for the one Client Component this section uses, and why. Only `col-span` on an
 * auto-flowing grid is used — no `grid-template-areas` — so DOM order, reading order and visual
 * order all match despite the asymmetry (same discipline as `SolutionsIndustries`).
 */
export function TechnologyStack({ content }: TechnologyStackProps) {
  return (
    <section aria-labelledby="technology-heading" className="page-container section-y">
      <ScrollReveal>
        <div className="max-w-2xl">
          <p className="font-mono text-label tracking-wide text-primary-blue uppercase">
            {content.eyebrow}
          </p>
          <h2
            id="technology-heading"
            className="mt-4 text-section font-semibold tracking-tight text-primary"
          >
            {content.heading}
          </h2>
          <p className="mt-4 text-body-lg text-secondary">{content.subheading}</p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {technologyCategories.map((category, index) => (
            <li key={category.id} className={DESKTOP_SPAN[index]}>
              <TechCategoryTile category={category} />
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
