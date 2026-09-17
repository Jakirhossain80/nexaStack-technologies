'use client';

import { useState } from 'react';

export interface CopyLinkButtonProps {
  url: string;
}

const RESET_MS = 2000;

/**
 * The one client leaf on the article detail page — the Clipboard API and the "Copied"
 * confirmation genuinely need client state; everything else on this page is a plain link.
 */
export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — silently no-op rather
      // than throw; the real URL is still visible in the address bar to copy manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex size-11 items-center justify-center rounded-field border border-default bg-background-alt text-secondary focus-ring hover:border-default-hover"
      aria-label="Copy article link"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5">
        {copied ? (
          <path d="M5 13l4 4L19 7" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
    </button>
  );
}
