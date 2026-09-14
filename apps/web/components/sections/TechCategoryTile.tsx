import { Badge } from '@/components/ui/Badge';
import { TechCategoryIcon } from '@/components/ui/TechCategoryIcon';
import type { TechCategory } from '@/config/technologies';

export interface TechCategoryTileProps {
  category: TechCategory;
}

/**
 * One technology-stack tile, shared by the homepage bento grid (`TechnologyStack`) and the
 * `/technologies` listing. No link anywhere in it — unlike `ProjectCard`, there's no per-
 * category or per-technology destination page, so there's no whole-card-link problem to solve
 * here. Technology chips reuse `Badge` unchanged — the same component and tokens built for
 * Featured Portfolio's tech tags, not a second copy.
 */
export function TechCategoryTile({ category }: TechCategoryTileProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-card border border-default bg-surface p-6 shadow-card transition duration-150 ease-out hover:border-default-hover hover:shadow-card-hover">
      {/* Faint background pattern: reuses the existing `hero-grid` utility (globals.css, also
          used by Hero.tsx) rather than inventing a new one. Lines are drawn in the solid
          `--nx-border` token, so visibility is controlled here with `opacity-20`. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hero-grid opacity-20" />

      <span className="relative inline-flex size-11 items-center justify-center rounded-field bg-background-alt">
        <TechCategoryIcon icon={category.icon} gradientId={category.id} className="size-6" />
      </span>

      <h3 className="relative mt-4 text-card font-semibold text-primary">{category.label}</h3>
      <p className="relative mt-2 text-body text-secondary">{category.description}</p>

      <ul className="relative mt-4 flex flex-wrap gap-2">
        {category.items.map((item) => (
          <li key={item}>
            <Badge mono>{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
