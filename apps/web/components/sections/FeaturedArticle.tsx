import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { BlogPost } from '@/lib/blog';

export interface FeaturedArticleProps {
  post: BlogPost;
}

function formatPublishedDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

/**
 * Larger, two-column treatment for `getFeaturedPost()`'s pick, above the regular grid. Stacks
 * on mobile. Same decorative-frame-vs-`next/image` fallback as `ArticleCard`, just at a bigger
 * aspect ratio for the hero position.
 */
export function FeaturedArticle({ post }: FeaturedArticleProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-default bg-surface shadow-card lg:flex-row">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-background-alt lg:aspect-auto lg:w-1/2">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex flex-col">
            <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-default/70 bg-surface px-3">
              <span className="size-2 rounded-full bg-cyan" />
              <span className="size-2 rounded-full bg-primary-blue" />
              <span className="size-2 rounded-full bg-violet" />
            </div>
            <div className="flex-1 bg-linear-to-br from-cyan via-primary-blue to-violet opacity-15" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 text-label text-secondary">
          <span className="font-mono uppercase tracking-wide text-primary-blue">{post.category}</span>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
        </div>

        <h2 className="text-page font-semibold tracking-tight text-primary">
          <Link href={`/blog/${post.slug}`} className="rounded-field focus-ring hover:text-primary-blue-hover">
            {post.title}
          </Link>
        </h2>

        <p className="text-body-lg text-secondary">{post.excerpt}</p>

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge mono>{tag}</Badge>
              </li>
            ))}
          </ul>
        )}

        <Button href={`/blog/${post.slug}`} variant="secondary" className="mt-2 self-start">
          Read article
        </Button>
      </div>
    </article>
  );
}
