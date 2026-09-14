import type { Metadata } from 'next';

import { TechCategoryTile } from '@/components/sections/TechCategoryTile';
import { technologyCategories } from '@/config/technologies';

// STUB: category content is real (from config/technologies.ts) but this page's layout is not
// designed yet — a categorized build (more detail per technology, version notes, etc.) is
// separate work. This reuses the homepage's plain tile in a simple grid rather than the bento
// asymmetry, which is a deliberate homepage-only composition, not carried over here.

export const metadata: Metadata = {
  title: 'Technologies',
  description: 'The technologies NexaStack Technologies builds with.',
  robots: { index: false, follow: false },
};

export default function TechnologiesPage() {
  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">Technologies</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        The tools and technologies NexaStack Technologies builds with.
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {technologyCategories.map((category) => (
          <li key={category.id}>
            <TechCategoryTile category={category} />
          </li>
        ))}
      </ul>
    </div>
  );
}
