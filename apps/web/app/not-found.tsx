import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="page-container section-y focus:outline-none">
      <h1 className="text-page font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        The page you were looking for does not exist or has moved. Check the address, or return to
        the homepage.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center rounded-btn font-semibold text-primary-blue underline-offset-4 focus-ring hover:underline"
      >
        Go to the homepage
      </Link>
    </main>
  );
}
