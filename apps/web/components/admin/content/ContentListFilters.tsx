'use client';

import { CONTENT_STATUSES } from '@nexastack/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Select, type SelectOption } from '@/components/ui/Select';

export interface ContentFilter {
  /** The URL search param this filter controls. */
  paramName: string;
  label: string;
  /** The empty option, meaning "no filter", shown first. */
  allLabel: string;
  options: readonly SelectOption[];
}

export interface ContentListFiltersProps {
  searchLabel: string;
  searchPlaceholder: string;
  /** Extra filters beyond status (for blog: category). */
  extraFilters?: readonly ContentFilter[];
}

const DEBOUNCE_MS = 300;

const STATUS_FILTER: ContentFilter = {
  paramName: 'status',
  label: 'Status',
  allLabel: 'All active (hides archived)',
  options: CONTENT_STATUSES.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  })),
};

const LABEL_CLASSES = 'text-label font-medium text-primary';

/**
 * Search box + status filter (+ any extra filters) for an admin content list. The URL is the
 * single source of truth (root CLAUDE.md 12): every control writes its search param and resets
 * `page`, so a filtered list is shareable, bookmarkable and correct under the back button. Shared
 * by every full-CMS content type; a type supplies its own labels and extra filters.
 */
export function ContentListFilters({
  searchLabel,
  searchPlaceholder,
  extraFilters = [],
}: ContentListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function navigate(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete('page');
    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  }

  function onSearchChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate((params) => {
        if (value.trim()) params.set('q', value.trim());
        else params.delete('q');
      });
    }, DEBOUNCE_MS);
  }

  function onFilterChange(paramName: string, value: string) {
    navigate((params) => {
      if (value) params.set(paramName, value);
      else params.delete(paramName);
    });
  }

  const filters = [STATUS_FILTER, ...extraFilters];

  return (
    <form
      role="search"
      aria-label={searchLabel}
      onSubmit={(event) => event.preventDefault()}
      className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="content-search" className={LABEL_CLASSES}>
          {searchLabel}
        </label>
        <input
          id="content-search"
          type="search"
          value={query}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-11 w-full rounded-field border border-strong bg-surface px-4 text-body text-primary focus-ring placeholder:text-secondary"
        />
      </div>

      {filters.map((filter) => {
        const current = searchParams.get(filter.paramName) ?? '';
        const id = `content-filter-${filter.paramName}`;
        return (
          <div key={filter.paramName} className="flex flex-col gap-2">
            <label htmlFor={id} className={LABEL_CLASSES}>
              {filter.label}
            </label>
            {/* Keyed on the URL value: the select is uncontrolled, so a change made elsewhere
                (back button, a cleared filter) remounts it with the right selection. */}
            <Select
              key={current}
              id={id}
              defaultValue={current}
              onChange={(event) => onFilterChange(filter.paramName, event.target.value)}
              options={[{ value: '', label: filter.allLabel }, ...filter.options]}
            />
          </div>
        );
      })}
    </form>
  );
}
