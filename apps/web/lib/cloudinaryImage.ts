/**
 * Pure helpers for Media Library image URLs. A stored URL looks like
 * `https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto/v123/nexastack/media/<id>`; Cloudinary
 * makes any other size on demand by changing the transformation segment. No image library is involved.
 *
 * SVG, PDFs and anything that is not a recognisable Cloudinary image URL are returned unchanged:
 * they cannot (or must not) be resized this way.
 */

const DELIVERY_URL = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?:[^/]+\/)?(v\d+\/.+)$/;

/** The URL with its transformation segment replaced, or null if it is not a resizable image URL. */
export function withTransformation(url: string, transformation: string): string | null {
  if (url.toLowerCase().endsWith('.svg')) return null;
  const match = DELIVERY_URL.exec(url);
  if (!match) return null;
  return `${match[1]}${transformation}/${match[2]}`;
}

/**
 * A `next/image` custom loader: requests the image at the width Next asks for, still with automatic
 * format and quality, never enlarged (`c_limit`). Because the resizing happens in Cloudinary, no
 * `remotePatterns` entry or extra optimisation on our own server is needed.
 */
export function cloudinaryImageLoader({ src, width }: { src: string; width: number }): string {
  return withTransformation(src, `f_auto,q_auto,c_limit,w_${width}`) ?? src;
}

/** Ready-made sizes offered next to the main URL. CLAUDE.md 15: responsive and social-sharing variants. */
export const MEDIA_VARIANTS = [
  { label: 'Responsive, 800px wide', transformation: 'f_auto,q_auto,c_limit,w_800' },
  { label: 'Social sharing, 1200 × 630', transformation: 'f_auto,q_auto,c_fill,g_auto,w_1200,h_630' },
] as const;
