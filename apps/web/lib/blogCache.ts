/**
 * The cache tag on every cached public blog read (`lib/blog.ts`). A tiny module of its own so the
 * Server Action that expires the cache (`lib/blogActions.ts`) does not have to import the data layer
 * (and Mongoose with it) just to name the tag.
 */
export const BLOG_CACHE_TAG = 'blog';

/**
 * Safety net, in seconds. The admin UI expires the tag the moment a post changes, but that call is
 * made from the admin's browser after the API write succeeds; if it never arrives (a closed tab, a
 * write made some other way), the public site self-heals within this window instead of showing a
 * stale or unpublished post indefinitely.
 */
export const BLOG_CACHE_SECONDS = 60 * 60;
