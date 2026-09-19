import { withTransformation } from '@/lib/cloudinaryImage';

/**
 * The image a post is shared with (Open Graph, Twitter card, JSON-LD). A search engine or social
 * network needs an ABSOLUTE address, and a cover can now be either of two things:
 *
 *  - a site path from `public/` (`/blog/first.png`): needs the site's origin in front;
 *  - a Media Library image: already absolute, and served through Cloudinary, so it is cropped to the
 *    1200 × 630 shape social networks expect (`c_fill,g_auto` keeps the subject) rather than sharing
 *    whatever aspect ratio was uploaded.
 *
 * Anything else returns null and the post is shared without an image: better than emitting a broken or
 * unexpected address into a page's metadata.
 */

export interface ShareImage {
  url: string;
  width?: number;
  height?: number;
}

const SHARE_TRANSFORMATION = 'f_auto,q_auto,c_fill,g_auto,w_1200,h_630';
const CLOUDINARY_PREFIX = 'https://res.cloudinary.com/';

/** Same rule as `next.config.ts`, which registers nothing for a cloud name that fails it. */
const SAFE_CLOUD_NAME = /^[A-Za-z0-9_-]+$/;

/**
 * Whether `next/image` can actually load this cover. It THROWS for a remote host that is not registered
 * in `next.config.ts`, which would turn a misconfigured server (no `CLOUDINARY_CLOUD_NAME`) into an
 * error on every page that shows a library cover. So a cover this app is not set up to load is dropped
 * before it reaches a component, and the post simply renders with its placeholder.
 *
 * A site path always loads. An absolute address loads only if it is under THIS account's Cloudinary
 * folder, which is exactly what `next.config.ts` registers.
 */
export function isLoadableCover(
  coverImage: string,
  cloudName: string | undefined = process.env.CLOUDINARY_CLOUD_NAME?.trim(),
): boolean {
  if (coverImage.startsWith('/') && !coverImage.startsWith('//')) return true;
  if (!cloudName || !SAFE_CLOUD_NAME.test(cloudName)) return false;
  return coverImage.startsWith(`${CLOUDINARY_PREFIX}${cloudName}/image/upload/`);
}

export function shareImage(coverImage: string | undefined, siteUrl: string): ShareImage | null {
  if (!coverImage) return null;

  // A site path: one leading slash. `//host/…` would be protocol-relative (off-site).
  if (coverImage.startsWith('/') && !coverImage.startsWith('//')) {
    return { url: `${siteUrl}${coverImage}` };
  }

  if (!coverImage.startsWith(CLOUDINARY_PREFIX)) return null;

  const cropped = withTransformation(coverImage, SHARE_TRANSFORMATION);
  return cropped ? { url: cropped, width: 1200, height: 630 } : { url: coverImage };
}
