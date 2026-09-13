import type { Metadata } from 'next';

// PLACEHOLDER: minimal stub so the navigation can be tested. Replace with the real page; it will
// then need a canonical URL, share image and JSON-LD (root CLAUDE.md section 13).

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles on web development and building better websites.',
  robots: { index: false, follow: false },
};

export default function BlogPage() {
  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">Blog</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        This page will list articles on web development and building better websites.
      </p>
    </div>
  );
}
