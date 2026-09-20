'use client';

import { themeInitScript } from '@/lib/theme';

import '@/styles/globals.css';

/**
 * The last-resort boundary, for a failure in the root layout itself (which `error.tsx` files cannot
 * catch because they render inside it). It replaces the whole document, so it supplies its own
 * `<html>` and `<body>` and re-applies the stored theme. Fonts are not loaded here (they come from
 * the layout that failed), so the token font stack falls back to the system font. A plain `<a>` rather
 * than `next/link`: after a root failure a full page load is the right way to recover.
 *
 * Never renders `error.message` — only the digest, as a reference for the server log.
 */
export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <title>Something went wrong | NexaStack Technologies</title>
      </head>
      <body>
        <main className="page-container section-y">
          <h1 className="text-page font-semibold tracking-tight text-primary">Something went wrong</h1>
          <p className="mt-4 max-w-prose text-body-lg text-secondary">
            The site could not be loaded. Nothing you entered has been lost or sent. Try again, or
            reload from the homepage.
          </p>
          {error.digest && (
            <p className="mt-4 text-label text-secondary">
              Reference: <span className="font-mono text-primary">{error.digest}</span>
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-btn bg-primary-blue px-6 text-body font-semibold text-on-primary focus-ring transition duration-150 ease-out hover:bg-primary-blue-hover sm:w-auto"
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- see the component comment: a full reload is intended here */}
            <a
              href="/"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-btn border border-default bg-surface px-6 text-body font-semibold text-primary focus-ring transition duration-150 ease-out hover:border-default-hover hover:bg-surface-hover sm:w-auto"
            >
              Go to the homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
