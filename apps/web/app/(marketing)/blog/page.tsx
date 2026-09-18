import type { Metadata } from 'next';

import { ArticleGrid } from '@/components/sections/ArticleGrid';
import { BlogFilterLinks } from '@/components/sections/BlogFilterLinks';
import { BlogSearchInput } from '@/components/sections/BlogSearchInput';
import { FeaturedArticle } from '@/components/sections/FeaturedArticle';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { company } from '@/config/company';
import { navigationActions } from '@/config/navigation';
import { env } from '@/lib/env';
import {
  filterAndPaginatePosts,
  getAllPosts,
  getCategories,
  getFeaturedPost,
  getTags,
} from '@/lib/blog';

// Full `/blog` page, replacing the earlier minimal stub. Ships against `lib/blog.ts`'s
// currently-empty data interface (see that file's comment — the content source is an
// unresolved CLAUDE.md section 22 decision, not a bug here). With zero real posts, this page
// renders only the intro and the honest empty-state message: no featured article, no search
// box, no filter links, no pagination — those all depend on real content existing, and a
// search box over nothing is a hollow control. The full interactive experience is verified
// against fixture data on `/dev/blog-preview`, which reuses every component below unchanged.

interface BlogPageProps {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles on web development and building better websites, from NexaStack Technologies.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const allPosts = getAllPosts();
  const hasAnyPosts = allPosts.length > 0;

  const featuredPost = hasAnyPosts ? getFeaturedPost() : null;
  const categories = hasAnyPosts ? getCategories() : [];
  const tags = hasAnyPosts ? getTags() : [];
  const gridSourcePosts = featuredPost
    ? allPosts.filter((post) => post.slug !== featuredPost.slug)
    : allPosts;
  const { posts, currentPage, totalPages } = hasAnyPosts
    ? filterAndPaginatePosts(gridSourcePosts, params)
    : { posts: [], currentPage: 1, totalPages: 1 };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${env.NEXT_PUBLIC_SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${env.NEXT_PUBLIC_SITE_URL}/blog` },
    ],
  };

  return (
    <div className="page-container section-y">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />

      <ScrollReveal className="mt-8 max-w-prose">
        <h1 className="text-page font-semibold tracking-tight text-primary">Blog</h1>
        <p className="mt-4 text-body-lg text-secondary">
          Articles on web development and building better websites.
        </p>
      </ScrollReveal>

      {hasAnyPosts ? (
        <ScrollReveal className="mt-12">
          {featuredPost && (
            <div className="mb-12">
              <FeaturedArticle post={featuredPost} />
            </div>
          )}

          <div className="flex flex-col gap-6 border-y border-default py-6 md:flex-row md:items-end md:justify-between">
            <BlogSearchInput id="blog-search" />
            <div className="flex flex-col gap-3">
              <BlogFilterLinks
                label="Category"
                paramName="category"
                options={categories}
                activeValue={params.category}
                currentParams={params}
                basePath="/blog"
              />
              <BlogFilterLinks
                label="Tag"
                paramName="tag"
                options={tags}
                activeValue={params.tag}
                currentParams={params}
                basePath="/blog"
              />
            </div>
          </div>

          <ArticleGrid posts={posts} />

          <Pagination
            basePath="/blog"
            currentPage={currentPage}
            totalPages={totalPages}
            currentParams={params}
          />
        </ScrollReveal>
      ) : (
        <ScrollReveal className="mt-12 max-w-prose">
          <p className="text-body-lg text-secondary">No articles published yet — check back soon.</p>
        </ScrollReveal>
      )}

      <ScrollReveal className="mt-12 max-w-prose border-t border-default pt-10">
        <h2 className="text-section font-semibold tracking-tight text-primary">Looking for something else?</h2>
        <p className="mt-4 text-body-lg text-secondary">
          Explore {company.legalName}&rsquo;s services, or tell us what you&rsquo;re building and
          get a project-specific quote.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Button href={navigationActions.quote.href}>{navigationActions.quote.label}</Button>
          <Button href="/services" variant="secondary">
            Explore Services
          </Button>
        </div>
      </ScrollReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
