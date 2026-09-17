import Image from 'next/image';

import type { BlogPostDetail } from '@/lib/blog';

export interface ArticleHeaderProps {
  post: BlogPostDetail;
}

function formatPublishedDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

/** Title, byline, computed reading time and the featured image — everything above the fold. */
export function ArticleHeader({ post }: ArticleHeaderProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-label text-secondary">
        <span className="font-mono uppercase tracking-wide text-primary-blue">{post.category}</span>
      </div>

      <h1 className="mt-4 text-page font-semibold tracking-tight text-primary">{post.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-secondary">
        <span className="font-medium text-primary">{post.author.name}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{post.author.role}</span>
        <span aria-hidden="true">&middot;</span>
        <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
        <span aria-hidden="true">&middot;</span>
        <span>{post.readingTimeMinutes} min read</span>
      </div>

      <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-media bg-background-alt">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt ?? ''}
            fill
            sizes="(min-width: 1024px) 70ch, 100vw"
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
    </div>
  );
}
