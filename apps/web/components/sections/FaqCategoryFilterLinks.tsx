import Link from 'next/link';

import type { FaqCategory, FaqCategoryId } from '@/config/faq';
import { cn } from '@/lib/cn';

export interface FaqCategoryFilterLinksProps {
  categories: readonly FaqCategory[];
  activeCategory?: FaqCategoryId;
  /** Other active search params to preserve when toggling a category (search). */
  currentParams: Record<string, string | undefined>;
}

/**
 * Plain server-rendered toggle links for `?category=` — no client JavaScript needed, since a
 * link changing the URL is the entire mechanism. Only categories with at least one real
 * question are ever passed in (see the page), so an empty category never renders as a filter
 * option. Clicking the active category again clears the filter.
 */
export function FaqCategoryFilterLinks({ categories, activeCategory, currentParams }: FaqCategoryFilterLinksProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label font-medium text-primary">Category</span>
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(currentParams)) {
            if (value && key !== 'category') params.set(key, value);
          }
          if (!isActive) params.set('category', category.id);
          const query = params.toString();

          return (
            <li key={category.id}>
              <Link
                href={query ? `/faq?${query}` : '/faq'}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-label focus-ring',
                  isActive
                    ? 'border-primary-blue bg-primary-blue text-on-primary'
                    : 'border-default bg-background-alt text-secondary hover:border-default-hover',
                )}
              >
                {category.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
