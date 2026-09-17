import type { Metadata } from 'next';

import { ArticleGrid } from '@/components/sections/ArticleGrid';
import { BlogFilterLinks } from '@/components/sections/BlogFilterLinks';
import { BlogSearchInput } from '@/components/sections/BlogSearchInput';
import { FeaturedArticle } from '@/components/sections/FeaturedArticle';
import { Pagination } from '@/components/ui/Pagination';
import type { BlogPost } from '@/lib/blog';
import { filterAndPaginatePosts } from '@/lib/blog';

// Dev-only route, not linked from anywhere on the site — same treatment as /dev/tokens and
// /dev/testimonials-preview. Excluded from the sitemap (never added to lib/routes.ts
// PUBLIC_ROUTES) and from indexing (noindex below, and "/dev" is already in lib/routes.ts
// DISALLOWED_PATHS for robots.txt).
//
// The fixtures below are defined in THIS FILE ONLY, never in lib/blog.ts, which must stay
// stubbed until CLAUDE.md section 22 item 3's content-source decision is made. Every title,
// excerpt, category and tag here is deliberately, obviously fictional ("Sample Post…",
// lorem-ipsum copy) so nobody could mistake it for a real article if this route were ever
// stumbled on. Reuses every real listing-page component unchanged — FeaturedArticle,
// BlogSearchInput, BlogFilterLinks, ArticleGrid, Pagination — against this fixture data and
// this page's own real searchParams, so search/filter/pagination can genuinely be exercised
// by navigating with query params (e.g. ?category=Design, ?q=sample, ?page=2).

export const metadata: Metadata = {
  title: 'Blog layout preview (dev only)',
  robots: { index: false, follow: false },
};

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Placeholder excerpt text used only to check card layout, line length and contrast — not a real article.';

const FIXTURES: readonly BlogPost[] = [
  {
    slug: 'sample-post-one',
    title: 'Sample Post One: A Placeholder Headline for Layout Testing',
    excerpt: LOREM,
    category: 'Web Development',
    tags: ['Sample', 'Next.js'],
    coverImage: '/brand/nexastack-mark.png',
    publishedAt: '2026-01-15',
    featured: true,
  },
  {
    slug: 'sample-post-two',
    title: 'Sample Post Two: Checking the Grid Card Without a Cover Image',
    excerpt: LOREM,
    category: 'Design',
    tags: ['Sample', 'UI/UX'],
    publishedAt: '2026-02-03',
  },
  {
    slug: 'sample-post-three',
    title: 'Sample Post Three: A Shorter Placeholder Title',
    excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit — a shorter placeholder excerpt.',
    category: 'Web Development',
    tags: ['Sample', 'Performance'],
    publishedAt: '2026-02-18',
  },
  {
    slug: 'sample-post-four',
    title: 'Sample Post Four: Another Fictional Entry for the Grid',
    excerpt: LOREM,
    category: 'Design',
    tags: ['Sample'],
    publishedAt: '2026-03-01',
  },
  {
    slug: 'sample-post-five',
    title: 'Sample Post Five: The Last Fictional Fixture Entry',
    excerpt: LOREM,
    category: 'Announcements',
    tags: ['Sample', 'UI/UX', 'Performance'],
    publishedAt: '2026-03-10',
  },
] as const;

const PREVIEW_PAGE_SIZE = 2;

interface BlogPreviewPageProps {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
}

export default async function BlogPreviewPage({ searchParams }: BlogPreviewPageProps) {
  const params = await searchParams;
  const nonFeatured = FIXTURES.filter((post) => !post.featured);
  const featuredPost = FIXTURES.find((post) => post.featured) ?? null;
  const categories = Array.from(new Set(FIXTURES.map((post) => post.category))).sort();
  const tags = Array.from(new Set(FIXTURES.flatMap((post) => post.tags))).sort();
  const { posts, currentPage, totalPages } = filterAndPaginatePosts(nonFeatured, params, PREVIEW_PAGE_SIZE);

  return (
    <div className="page-container space-y-10 section-y">
      <header className="space-y-6">
        <div
          role="note"
          className="flex flex-wrap items-center gap-3 rounded-card border border-error bg-surface p-4"
        >
          <span className="rounded-field border border-error px-2 py-0.5 font-mono text-label font-semibold text-error">
            DEV ONLY
          </span>
          <p className="text-body">
            Layout preview for the Blog listing page, using fixture data defined in this file
            only. <code className="font-mono">lib/blog.ts</code> stays stubbed — see{' '}
            <code className="font-mono">apps/web/CLAUDE.md</code>. Try{' '}
            <code className="font-mono">?q=sample</code>, <code className="font-mono">?category=Design</code>,{' '}
            <code className="font-mono">?tag=UI/UX</code> or <code className="font-mono">?page=2</code> in the
            URL to exercise search, filters and pagination.
          </p>
        </div>

        <div className="max-w-prose">
          <h1 className="text-page font-semibold tracking-tight">Blog layout preview</h1>
          <p className="mt-3 text-body-lg text-secondary">
            Five obviously fictional fixture posts exercising the featured article, article
            cards, category/tag filters, search and pagination (page size lowered to{' '}
            {PREVIEW_PAGE_SIZE} here only, so five fixtures genuinely produce multiple pages)
            before any real content exists.
          </p>
        </div>
      </header>

      {featuredPost && <FeaturedArticle post={featuredPost} />}

      <div className="flex flex-col gap-6 border-y border-default py-6 md:flex-row md:items-end md:justify-between">
        <BlogSearchInput id="blog-preview-search" />
        <div className="flex flex-col gap-3">
          <BlogFilterLinks
            label="Category"
            paramName="category"
            options={categories}
            activeValue={params.category}
            currentParams={params}
            basePath="/dev/blog-preview"
          />
          <BlogFilterLinks
            label="Tag"
            paramName="tag"
            options={tags}
            activeValue={params.tag}
            currentParams={params}
            basePath="/dev/blog-preview"
          />
        </div>
      </div>

      <ArticleGrid posts={posts} />

      <Pagination
        basePath="/dev/blog-preview"
        currentPage={currentPage}
        totalPages={totalPages}
        currentParams={params}
      />
    </div>
  );
}
