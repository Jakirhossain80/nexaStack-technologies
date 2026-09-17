import Link from 'next/link';

import { cn } from '@/lib/cn';

export interface PaginationProps {
  basePath: `/${string}`;
  currentPage: number;
  totalPages: number;
  /** Other active search params to preserve across page links (search/category/tag). */
  currentParams: Record<string, string | undefined>;
}

/**
 * Generic prev/next + page-number links — a server component, since a link changing the URL's
 * `page` param is the entire mechanism and needs no client JavaScript. Lives in `ui/` rather
 * than `sections/` because pagination isn't blog-specific, even though `/blog` is its first use.
 */
export function Pagination({ basePath, currentPage, totalPages, currentParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefForPage(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentParams)) {
      if (value && key !== 'page') params.set(key, value);
    }
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={hrefForPage(currentPage - 1)}
          className="rounded-field border border-default bg-background-alt px-3 py-1.5 text-body text-secondary focus-ring hover:border-default-hover"
        >
          Previous
        </Link>
      )}

      <ul className="flex flex-wrap gap-2">
        {pages.map((page) => {
          const isActive = page === currentPage;
          return (
            <li key={page}>
              <Link
                href={hrefForPage(page)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-field border text-body focus-ring',
                  isActive
                    ? 'border-primary-blue bg-primary-blue text-on-primary'
                    : 'border-default bg-background-alt text-secondary hover:border-default-hover',
                )}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ul>

      {currentPage < totalPages && (
        <Link
          href={hrefForPage(currentPage + 1)}
          className="rounded-field border border-default bg-background-alt px-3 py-1.5 text-body text-secondary focus-ring hover:border-default-hover"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
