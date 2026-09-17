/**
 * Blog data interface — deliberately stubbed. `CLAUDE.md` root section 22 item 3 leaves the
 * content source unresolved (MDX files, a headless CMS, or an admin dashboard with a rich-text
 * editor), and item 2 phases the blog after the marketing site and a working contact form.
 * Neither has been decided. Every function below returns empty/null on purpose — not broken,
 * not a TODO, a deliberate placeholder pending that decision. The listing page and its
 * components are built in full against this interface so that once a real implementation lands
 * here, nothing else needs to change.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
  featured?: boolean;
}

export function getAllPosts(): BlogPost[] {
  return [];
}

export function getFeaturedPost(): BlogPost | null {
  return null;
}

/** Derived from real posts, never hardcoded ahead of real content. */
export function getCategories(): string[] {
  return Array.from(new Set(getAllPosts().map((post) => post.category))).sort();
}

/** Derived from real posts, never hardcoded ahead of real content. */
export function getTags(): string[] {
  return Array.from(new Set(getAllPosts().flatMap((post) => post.tags))).sort();
}

export interface BlogQueryParams {
  q?: string;
  category?: string;
  tag?: string;
  page?: string;
}

export interface BlogQueryResult {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
}

export const BLOG_PAGE_SIZE = 9;

/**
 * Presentation-layer search/filter/pagination — pure list processing, unrelated to the
 * deferred content-source decision above. Operates on whatever `BlogPost[]` it's given, so the
 * real `/blog` page and the fixture-driven `/dev/blog-preview` page share this one
 * implementation rather than duplicating the filtering logic.
 */
export function filterAndPaginatePosts(
  posts: readonly BlogPost[],
  { q, category, tag, page }: BlogQueryParams,
  /** Override for `/dev/blog-preview`, which uses a handful of fixtures and a small size to
   * genuinely exercise multi-page pagination without inflating the fixture count. The real
   * page never passes this, so it always uses `BLOG_PAGE_SIZE`. */
  pageSize: number = BLOG_PAGE_SIZE,
): BlogQueryResult {
  const query = q?.trim().toLowerCase();

  const filtered = posts.filter((post) => {
    if (category && post.category !== category) return false;
    if (tag && !post.tags.includes(tag)) return false;
    if (query) {
      const haystack = `${post.title} ${post.excerpt}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Number(page);
  const currentPage = Number.isInteger(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const start = (currentPage - 1) * pageSize;

  return {
    posts: filtered.slice(start, start + pageSize),
    currentPage,
    totalPages,
  };
}
