'use server';

import { updateTag } from 'next/cache';

import { can, getAdminSession } from '@/lib/adminSession.server';
import { BLOG_CACHE_TAG } from '@/lib/blogCache';

export type RevalidateBlogResult = { ok: true } | { ok: false };

/**
 * Server Action the admin UI calls after a blog change (a post saved, published, unpublished,
 * archived or deleted, a category created, renamed or reordered, or a Media Library file replaced or
 * edited) so the public blog shows it on the very next request instead of waiting out the cache.
 *
 * The public blog's database reads are cached under `BLOG_CACHE_TAG` (`lib/blog.ts`); this expires
 * that tag. `updateTag` (Server Actions only) expires it immediately, so the next request misses the
 * cache and reads fresh data, rather than being served the old page while a refresh runs.
 *
 * A Server Action is a public POST endpoint in its own right and does not pass through the admin
 * layout's guard, so the session is verified here. The capability check is deliberately broad, any
 * blog-writing or media-writing role, because the action only DROPS a cache: it changes no data and
 * reveals none, and the worst a caller with such a role can do is cost one cache refill. Every real
 * write was already authorised by the API before this is called.
 *
 * The call is made from the admin's browser after the API write succeeded, so it is a best-effort
 * step: if it never arrives (tab closed, network drop) the entry still expires by itself after
 * `BLOG_CACHE_SECONDS`. Callers must not fail the admin's save because this failed.
 */
export async function revalidateBlogAction(): Promise<RevalidateBlogResult> {
  const admin = await getAdminSession();
  const allowed =
    can(admin, 'content:create') ||
    can(admin, 'content:edit') ||
    can(admin, 'content:publish') ||
    can(admin, 'content:delete') ||
    can(admin, 'manage:media');
  if (!allowed) return { ok: false };

  updateTag(BLOG_CACHE_TAG);
  return { ok: true };
}
