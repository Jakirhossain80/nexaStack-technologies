'use client';

import { CONTENT_STATUSES } from '@nexastack/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Select, type SelectOption } from '@/components/ui/Select';
import { cn } from '@/lib/cn';

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
  /** Replaces the default (content-status) status filter, for types with their own statuses. */
  statusFilter?: ContentFilter;
  /** Extra filters beyond status (blog: category; enquiries: active/archived view). */
  extraFilters?: readonly ContentFilter[];
}

const DEBOUNCE_MS = 300;

const DEFAULT_STATUS_FILTER: ContentFilter = {
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
  statusFilter = DEFAULT_STATUS_FILTER,
  extraFilters = [],
}: ContentListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function navigate(mutate: (params: URLSearchParams) => void) {
    // Read the LIVE URL, not the `searchParams` captured when this handler was created. The search
    // box navigates after a debounce; if a filter was changed in that window, the captured params
    // are stale and rebuilding the URL from them would silently undo the newer change.
    const params = new URLSearchParams(window.location.search);
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

  // The selects are CONTROLLED, and never remounted. (They used to be uncontrolled and keyed on the
  // URL value, which remounted the element on every change and dropped keyboard focus: a keyboard
  // user could not even step through the options with the arrow keys.) A pick shows immediately;
  // once the URL has caught up (`paramsString` differs from the URL the pick was made against) the
  // URL is the single source of truth again, so the back button and a cleared filter still work.
  const paramsString = searchParams.toString();
  const [picked, setPicked] = useState<{ base: string; values: Record<string, string> }>({
    base: '',
    values: {},
  });
  const valueOf = (paramName: string): string =>
    picked.base === paramsString && paramName in picked.values
      ? (picked.values[paramName] ?? '')
      : (searchParams.get(paramName) ?? '');

  function onFilterChange(paramName: string, value: string) {
    setPicked({
      base: paramsString,
      values: { ...(picked.base === paramsString ? picked.values : {}), [paramName]: value },
    });
    navigate((params) => {
      if (value) params.set(paramName, value);
      else params.delete(paramName);
    });
  }

  const filters = [statusFilter, ...extraFilters];
  // Two filters (blog, enquiries) sit beside the search box on one row; a third (quotations add a
  // project type) gets its own column instead of wrapping onto a second row.
  const desktopColumns =
    filters.length > 2 ? 'lg:grid-cols-[2fr_1fr_1fr_1fr]' : 'lg:grid-cols-[2fr_1fr_1fr]';

  return (
    <form
      role="search"
      aria-label={searchLabel}
      onSubmit={(event) => event.preventDefault()}
      className={cn('mt-8 grid gap-4 sm:grid-cols-2', desktopColumns)}
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
        const id = `content-filter-${filter.paramName}`;
        return (
          <div key={filter.paramName} className="flex flex-col gap-2">
            <label htmlFor={id} className={LABEL_CLASSES}>
              {filter.label}
            </label>
            <Select
              id={id}
              value={valueOf(filter.paramName)}
              onChange={(event) => onFilterChange(filter.paramName, event.target.value)}
              options={[{ value: '', label: filter.allLabel }, ...filter.options]}
            />
          </div>
        );
      })}
    </form>
  );
}
