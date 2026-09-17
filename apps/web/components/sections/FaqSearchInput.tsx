'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface FaqSearchInputProps {
  id: string;
}

const DEBOUNCE_MS = 300;

/**
 * The one client leaf on `/faq` — category filters and everything else are plain links, since
 * changing the URL is the whole mechanism. A text input genuinely needs client state so typing
 * can debounce before updating the URL. Same pattern as `BlogSearchInput`. Updates `?q=`,
 * preserving any active `?category=`.
 */
export function FaqSearchInput({ id }: FaqSearchInputProps) {
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
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }, DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label font-medium text-primary">
        Search questions
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search by keyword"
        className="min-h-11 w-full max-w-sm rounded-field border border-strong bg-surface px-4 text-body text-primary placeholder:text-secondary focus-ring"
      />
    </div>
  );
}
