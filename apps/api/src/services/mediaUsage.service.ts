import type { MediaUsageAdmin } from '@nexastack/shared';

import { BlogPost } from '../models/BlogPost.js';

/**
 * REAL references to a Media Library item: content that stores the item's id, not merely its URL.
 * Today that is blog post cover images (`BlogPost.coverMediaId`). Any status counts: a draft or an
 * archived post can be published or restored later, so an image it uses must not be deleted from
 * under it.
 *
 * Content that only contains the URL (config files, page components) is invisible here by design; it
 * is covered by the best-effort check the delete dialog runs, and the delete flow says so.
 */

const MAX_LISTED = 100;

export async function findMediaUsage(mediaId: string): Promise<MediaUsageAdmin> {
  const posts = await BlogPost.find({ coverMediaId: mediaId })
    .select('title status')
    .sort({ updatedAt: -1 })
    .limit(MAX_LISTED)
    .lean();

  return {
    blogPosts: posts.map((post) => ({
      id: String(post._id),
      title: post.title,
      status: post.status,
    })),
  };
}

/**
 * After a library item's file is replaced, points every post that uses it at the new address (a
 * post keeps a snapshot of the URL for the public site to read). Returns how many posts changed.
 * Throws on a database failure so the caller can decide what is safe to do next.
 */
export async function repointPostsToMedia(mediaId: string, url: string): Promise<number> {
  const result = await BlogPost.updateMany({ coverMediaId: mediaId }, { $set: { coverImage: url } });
  return result.modifiedCount;
}

const LISTED_IN_MESSAGE = 5;

/** The message for refusing to delete an image that posts use: says which, and what to do. */
export function describeUsageBlock(usage: MediaUsageAdmin): string {
  const count = usage.blogPosts.length;
  const listed = usage.blogPosts
    .slice(0, LISTED_IN_MESSAGE)
    .map((post) => `“${post.title}” (${post.status})`)
    .join(', ');
  const more = count > LISTED_IN_MESSAGE ? ` and ${count - LISTED_IN_MESSAGE} more` : '';

  return (
    `This image is the cover image of ${count} blog ${count === 1 ? 'post' : 'posts'}: ${listed}${more}. ` +
    `Change or remove ${count === 1 ? 'its' : 'their'} cover first, then delete the image. Nothing was deleted.`
  );
}
