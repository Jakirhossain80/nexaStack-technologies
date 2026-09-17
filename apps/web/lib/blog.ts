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
  /** Required in practice whenever `coverImage` is set — a content image needs real alt text. */
  coverImageAlt?: string;
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

export interface BlogPostDetail extends BlogPost {
  /** Real founder identity (config/company.ts) — no multi-author scheme this project doesn't need. */
  author: { name: string; role: string };
  /** Pre-rendered, trusted HTML — sanitized/authored at build time by whichever real pipeline
   * gets chosen later (CLAUDE.md section 22 item 3). This template only renders it safely. */
  contentHtml: string;
  tableOfContents: { id: string; text: string; level: 2 | 3 }[];
  /** Computed via `computeReadingTime`, never hand-typed. */
  readingTimeMinutes: number;
}

export function getPost(_slug: string): BlogPostDetail | null {
  return null;
}

/** Once real: getAllPosts() minus this post, filtered by shared category/tag. */
export function getRelatedPosts(_slug: string): BlogPost[] {
  return [];
}

/**
 * Reading time computed from contentHtml's real word count — same "compute, don't hardcode"
 * discipline as the Footer's copyright year. 225 wpm is a commonly cited average adult reading
 * speed.
 */
export function computeReadingTime(contentHtml: string, wordsPerMinute = 225): number {
  const words = contentHtml
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
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
