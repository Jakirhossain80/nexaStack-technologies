import type {
  BlogCategoryAdmin,
  BlogPostAdminDetail,
  BlogPostAdminSummary,
  ContentStatus,
  Paginated,
} from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side reads of the blog admin API (`/api/v1/admin/blog/*`) for the admin pages. */

export type { AdminReadResult };

const BLOG_API = '/api/v1/admin/blog';

export interface BlogPostListParams {
  q?: string | undefined;
  status?: ContentStatus | undefined;
  category?: string | undefined;
  page?: number | undefined;
}

export async function getBlogPosts(
  params: BlogPostListParams,
): Promise<AdminReadResult<Paginated<BlogPostAdminSummary>>> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.category) search.set('category', params.category);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const query = search.toString();
  return forwardedRead(`${BLOG_API}/posts${query ? `?${query}` : ''}`);
}

export async function getBlogPost(id: string): Promise<AdminReadResult<BlogPostAdminDetail>> {
  const result = await forwardedRead<{ post: BlogPostAdminDetail }>(`${BLOG_API}/posts/${id}`);
  return result.ok ? { ok: true, data: result.data.post } : result;
}

export async function getBlogCategories(): Promise<AdminReadResult<BlogCategoryAdmin[]>> {
  const result = await forwardedRead<{ categories: BlogCategoryAdmin[] }>(`${BLOG_API}/categories`);
  return result.ok ? { ok: true, data: result.data.categories } : result;
}
