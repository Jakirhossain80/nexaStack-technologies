import Link from 'next/link';

import { cn } from '@/lib/cn';

export interface BlogFilterLinksProps {
  label: string;
  paramName: 'category' | 'tag';
  options: readonly string[];
  activeValue?: string;
  /** Other active search params to preserve when toggling this filter. */
  currentParams: Record<string, string | undefined>;
  /** The page these links point back to — `/blog` on the real page, `/dev/blog-preview` there. */
  basePath: `/${string}`;
}

/**
 * Plain server-rendered toggle links — no client JavaScript needed, since a link changing the
 * URL's query string is the entire mechanism. Clicking the active option again clears that
 * filter (toggle behaviour). Changing a filter resets `page`, same reasoning as the search box.
 */
export function BlogFilterLinks({
  label,
  paramName,
  options,
  activeValue,
  currentParams,
  basePath,
}: BlogFilterLinksProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label font-medium text-primary">{label}</span>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = activeValue === option;
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(currentParams)) {
            if (value && key !== paramName && key !== 'page') params.set(key, value);
          }
          if (!isActive) params.set(paramName, option);
          const query = params.toString();

          return (
            <li key={option}>
              <Link
                href={query ? `${basePath}?${query}` : basePath}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1 text-label focus-ring',
                  isActive
                    ? 'border-primary-blue bg-primary-blue text-on-primary'
                    : 'border-default bg-background-alt text-secondary hover:border-default-hover',
                )}
              >
                {option}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
