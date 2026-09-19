import type { z } from 'zod';

import type { ContentStatus } from '../constants/contentStatus.js';
import type {
  blogCategoryFormSchema,
  blogPostFormSchema,
  blogPostListQuerySchema,
} from '../schemas/blog.js';

/** What the form holds and submits. `z.input` because the schema transforms (tags de-duplicated). */
export type BlogPostFormValues = z.input<typeof blogPostFormSchema>;
export type BlogPostInput = z.output<typeof blogPostFormSchema>;
export type BlogCategoryFormValues = z.input<typeof blogCategoryFormSchema>;
export type BlogCategoryInput = z.output<typeof blogCategoryFormSchema>;
export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;

/**
 * Response shapes of `/api/v1/admin/blog/*`, as the admin UI receives them (JSON, so every date
 * is an ISO string). Written once here so the API and the web admin cannot drift.
 */

export interface BlogTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface BlogCategoryAdmin {
  id: string;
  name: string;
  slug: string;
  order: number;
  /** Posts in any status that reference this category; deletion is refused while > 0. */
  postCount: number;
}

export interface BlogPostAdminSummary {
  id: string;
  title: string;
  slug: string;
  category: { id: string; name: string; slug: string } | null;
  status: ContentStatus;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogPostAdminDetail extends BlogPostAdminSummary {
  excerpt: string;
  tags: string[];
  coverImage: string | undefined;
  coverImageAlt: string | undefined;
  contentMarkdown: string;
  contentHtml: string;
  tableOfContents: BlogTocItem[];
  createdAt: string;
}
