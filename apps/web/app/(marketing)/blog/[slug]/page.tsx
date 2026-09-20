import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleView } from '@/components/sections/ArticleView';
import { company } from '@/config/company';
import { env } from '@/lib/env';
import { getPost, getRelatedPosts } from '@/lib/blog';
import { DEFAULT_SHARE_IMAGE, shareImage } from '@/lib/blogImage';

// Article detail template for `/blog/[slug]`, reading published posts from MongoDB through
// `lib/blog.ts`. The layout itself lives in `ArticleView`, which the admin preview also renders,
// so the two cannot drift.
//
// Rendered on every request, with no `generateStaticParams` and no `dynamicParams = false`: a post
// published or unpublished in the admin must show up or vanish immediately, not after the next
// build. What is cached is the DATABASE READ behind it (`lib/blog.ts`), under the `blog` tag, not the
// rendered page: the admin UI expires that tag whenever a post or category changes
// (`lib/blogActions.ts`), so a change is visible on the very next request, and the tag also expires
// on its own after an hour, so a missed invalidation cannot keep an unpublished post live
// indefinitely. Do NOT add `generateStaticParams` or cache the page itself: a page cached at build
// time is not tied to the tag and would keep an unpublished post live.

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * JSON for a `<script type="application/ld+json">`. `JSON.stringify` does not escape `<`, so a
 * post title containing `</script>` would end the tag early and inject markup. Titles are now
 * author-supplied database content (they were static config before), so `<` is escaped as
 * `<`, which JSON parsers read back as the same character.
 */
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const url = `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
  // A site path or a Media Library image; see `lib/blogImage.ts` for why this is not a plain
  // concatenation. Falls back to the sitewide default rather than sharing with no image at all.
  const share = shareImage(post.coverImage, env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SHARE_IMAGE;
  const images = [share];

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.slug);
  const canonicalUrl = `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
  const articleImage = shareImage(post.coverImage, env.NEXT_PUBLIC_SITE_URL);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    datePublished: post.publishedAt,
    ...(articleImage && { image: articleImage.url }),
    publisher: {
      '@type': 'Organization',
      name: company.legalName,
      url: env.NEXT_PUBLIC_SITE_URL,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${env.NEXT_PUBLIC_SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${env.NEXT_PUBLIC_SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="page-container section-y">
      <ArticleView post={post} relatedPosts={relatedPosts} canonicalUrl={canonicalUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
    </div>
  );
}
