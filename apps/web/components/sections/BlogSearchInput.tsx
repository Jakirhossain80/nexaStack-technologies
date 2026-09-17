'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface BlogSearchInputProps {
  id: string;
}

const DEBOUNCE_MS = 300;

/**
 * The one client leaf on `/blog` — everything else (category/tag filters, pagination) is a
 * plain server-rendered link, since changing the URL is the entire mechanism there and needs
 * no JavaScript. A text input genuinely needs client state: typing has to debounce before it
 * updates the URL, or every keystroke would trigger a navigation. Updates `?q=` and resets
 * `?page=` to 1 (a new search invalidates whatever page you were on), preserving any active
 * `category`/`tag` filters.
 */
export function BlogSearchInput({ id }: BlogSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) {
        params.set('q', next.trim());
      } else {
        params.delete('q');
      }
      params.delete('page');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }, DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label font-medium text-primary">
        Search articles
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search by title or excerpt"
        className="min-h-11 w-full max-w-sm rounded-field border border-strong bg-surface px-4 text-body text-primary placeholder:text-secondary focus-ring"
      />
    </div>
  );
}
