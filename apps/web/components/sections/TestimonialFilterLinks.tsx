import Link from 'next/link';

import { cn } from '@/lib/cn';

export interface TestimonialFilterOption {
  value: string;
  label: string;
}

export interface TestimonialFilterLinksProps {
  label: string;
  paramName: 'service' | 'project';
  options: readonly TestimonialFilterOption[];
  activeValue?: string;
  /** Other active search params to preserve when toggling this filter. */
  currentParams: Record<string, string | undefined>;
  basePath: `/${string}`;
}

/**
 * Plain server-rendered toggle links — no client JavaScript needed, since a link changing the
 * URL's query string is the entire mechanism (root CLAUDE.md 12: filters live in URL search
 * params). Same pattern as `components/sections/BlogFilterLinks.tsx`, kept as a separate,
 * testimonials-scoped component rather than generalising that one, so `/blog` stays untouched.
 * Clicking the active option again clears that filter (toggle behaviour).
 */
export function TestimonialFilterLinks({
  label,
  paramName,
  options,
  activeValue,
  currentParams,
  basePath,
}: TestimonialFilterLinksProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label font-medium text-primary">{label}</span>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = activeValue === option.value;
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(currentParams)) {
            if (value && key !== paramName) params.set(key, value);
          }
          if (!isActive) params.set(paramName, option.value);
          const query = params.toString();

          return (
            <li key={option.value}>
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
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
