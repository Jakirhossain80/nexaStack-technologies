import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleBody } from '@/components/sections/ArticleBody';
import { ArticleGrid } from '@/components/sections/ArticleGrid';
import { ArticleHeader } from '@/components/sections/ArticleHeader';
import { ArticleTableOfContents } from '@/components/sections/ArticleTableOfContents';
import { ShareLinks } from '@/components/sections/ShareLinks';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { company } from '@/config/company';
import { env } from '@/lib/env';
import { getAllPosts, getPost, getRelatedPosts } from '@/lib/blog';

// Article detail template for `/blog/[slug]`. Ships against `lib/blog.ts`'s currently-empty
// data interface (see that file's comment — deferred per CLAUDE.md section 22 item 3, not
// broken). `generateStaticParams` reads from `getAllPosts()`, which is empty today, so this
// route currently produces zero real pages; every slug 404s via `notFound()`. Fully verified
// against fixture data on `/dev/blog-post-preview`, which reuses every component below.

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;
  const images = post.coverImage ? [{ url: `${env.NEXT_PUBLIC_SITE_URL}${post.coverImage}` }] : undefined;

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
  const post = getPost(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post.slug);
  const canonicalUrl = `${env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;

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
    ...(post.coverImage && { image: `${env.NEXT_PUBLIC_SITE_URL}${post.coverImage}` }),
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
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      />

      <ScrollReveal className="mt-8">
        <ArticleHeader post={post} />

        <div className="mt-6">
          <ShareLinks url={canonicalUrl} title={post.title} />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_16rem]">
          <div className="order-2 max-w-prose lg:order-1">
            <ArticleBody contentHtml={post.contentHtml} />

            <div className="mt-10 max-w-prose border-t border-default pt-6">
              <ShareLinks url={canonicalUrl} title={post.title} />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <ArticleTableOfContents items={post.tableOfContents} />
          </div>
        </div>
      </ScrollReveal>

      {relatedPosts.length > 0 && (
        <ScrollReveal className="mt-12 max-w-4xl border-t border-default pt-10">
          <h2 className="text-section font-semibold tracking-tight text-primary">Related articles</h2>
          <ArticleGrid posts={relatedPosts} />
        </ScrollReveal>
      )}

      <ScrollReveal className="mt-12 max-w-prose border-t border-default pt-10">
        <h2 className="text-section font-semibold tracking-tight text-primary">
          Building something for your business?
        </h2>
        <p className="mt-4 text-body-lg text-secondary">
          Tell {company.legalName} what you&rsquo;re building and get a project-specific quote.
        </p>
        <Button href="/quotation" className="mt-6">
          Request a Quote
        </Button>
      </ScrollReveal>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  );
}
