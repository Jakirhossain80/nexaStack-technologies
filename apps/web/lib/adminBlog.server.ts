import type {
  ApiResponse,
  BlogCategoryAdmin,
  BlogPostAdminDetail,
  BlogPostAdminSummary,
  ContentStatus,
  Paginated,
} from '@nexastack/shared';
import { headers } from 'next/headers';

import { env } from '@/lib/env';

/**
 * Server-side reads of the blog admin API (`/api/v1/admin/blog/*`) for the admin pages. Same
 * forwarded-cookie pattern as `adminDashboard.server.ts`, but with a richer result: the blog
 * pages must tell a genuine 404 (render `notFound()`) apart from "the API is down" or "your role
 * cannot see this", which `adminDashboard.server.ts`'s null-on-anything helper cannot express.
 */

export type AdminReadResult<T> =
  { ok: true; data: T } | { ok: false; status: number | null; message: string };

const BLOG_API = '/api/v1/admin/blog';

async function forwardedRead<T>(path: string): Promise<AdminReadResult<T>> {
  const incoming = await headers();
  const cookie = incoming.get('cookie');
  if (!cookie) return { ok: false, status: 401, message: 'You are not signed in.' };

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const body = (await response.json()) as ApiResponse<T>;
    if (body.success) return { ok: true, data: body.data };
    return { ok: false, status: response.status, message: body.error.message };
  } catch {
    return {
      ok: false,
      status: null,
      message: 'The admin API could not be reached. Check that it is running and try again.',
    };
  }
}

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
