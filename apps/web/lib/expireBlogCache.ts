import { revalidateBlogAction } from '@/lib/blogActions';

/**
 * Tells the public site that blog content changed, so it shows on the next request. Called by the
 * admin's blog editors AFTER the API confirmed the write. Best-effort by design: a failure here must
 * never turn a successful save into an error message, and the public cache expires on its own within
 * `BLOG_CACHE_SECONDS` anyway. See `lib/blogActions.ts`.
 */
export async function expireBlogCache(): Promise<void> {
  try {
    await revalidateBlogAction();
  } catch {
    // Best-effort; the cache's own expiry is the backstop.
  }
}
