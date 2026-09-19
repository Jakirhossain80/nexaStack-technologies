'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';

export interface MediaUrlRowProps {
  /** What this URL is, for the visible label: "Public URL", "Social sharing, 1200 × 630". */
  label: string;
  url: string;
}

const RESET_MS = 4000;

/**
 * A URL the admin can copy. The URL is shown in a read-only field (so it can also be selected by
 * hand), and copying is confirmed in visible text AND announced to assistive technology. A failure
 * is reported too, and the URL is selected so it can be copied with the keyboard: unlike a silent
 * clipboard write, the admin always knows whether it worked.
 */
export function MediaUrlRow({ label, url }: MediaUrlRowProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), RESET_MS);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      // Clipboard access can be refused (permissions, an insecure context). Select the text so the
      // admin can copy it with Ctrl+C / ⌘C, and say so.
      inputRef.current?.focus();
      inputRef.current?.select();
      setState('failed');
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-label font-medium text-primary">
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="min-h-11 w-full min-w-0 flex-1 rounded-field border border-strong bg-surface px-3.5 font-mono text-label text-primary focus-ring"
        />
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => void copy()}
          aria-label={`Copy URL: ${label}`}
        >
          {state === 'copied' ? 'Copied' : 'Copy URL'}
        </Button>
      </div>

      {/* Always mounted so assistive technology announces the result when it appears. */}
      <p
        role={state === 'failed' ? 'alert' : 'status'}
        className={
          state === 'failed'
            ? 'mt-2 text-label text-error'
            : state === 'copied'
              ? 'mt-2 text-label text-primary'
              : 'sr-only'
        }
      >
        {state === 'copied'
          ? 'Copied to the clipboard.'
          : state === 'failed'
            ? 'Could not copy automatically. The URL is selected: press Ctrl+C (or ⌘C) to copy it.'
            : ''}
      </p>
    </div>
  );
}
