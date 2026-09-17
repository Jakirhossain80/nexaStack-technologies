import type { BlogPost } from '@/lib/blog';

import { ArticleCard } from './ArticleCard';

export interface ArticleGridProps {
  posts: readonly BlogPost[];
}

/**
 * 3/2/1 responsive grid, same rhythm as `ProjectGrid`. Only reachable once `getAllPosts()`
 * returns real posts — the page-level "nothing published yet" state (see `app/(marketing)/
 * blog/page.tsx`) is handled one level up, before this component is ever rendered. The message
 * here covers the *other* empty case: real posts exist, but the current search/filter query
 * matches none of them — deliberately different wording so the two are never confused.
 */
export function ArticleGrid({ posts }: ArticleGridProps) {
  if (posts.length === 0) {
    return (
      <p className="mt-10 text-center text-body-lg text-secondary">
        No articles match your search or filters.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <ArticleCard post={post} />
        </li>
      ))}
    </ul>
  );
}
