import type { z } from 'zod';

import type { MediaType } from '../constants/media.js';
import type { mediaDeleteSchema } from '../schemas/media.js';

export type MediaDeleteInput = z.input<typeof mediaDeleteSchema>;

/**
 * Where a Media Library item is used, as REAL references: content that stores the item's id. Today
 * that is blog post cover images only. Content that merely contains the item's URL (config files,
 * page components) is not in here; it can only be found by the best-effort check.
 */
export interface MediaUsageAdmin {
  blogPosts: { id: string; title: string; status: string }[];
}

/**
 * A Media Library item as the admin UI receives it (JSON, so dates are ISO strings). Written once
 * here so the API and the web admin cannot drift.
 *
 * `altText` belongs to images and `description` to documents; the API only ever sets the one that
 * matches `mediaType`.
 */
export interface MediaAdmin {
  id: string;
  filename: string;
  mediaType: MediaType;
  /** The public delivery URL: safe to publish, and what "Copy URL" copies. */
  url: string;
  /** Includes the folder. For a PDF it includes the `.pdf`. Used to look for references to the file. */
  cloudinaryPublicId: string;
  mimeType: string;
  sizeBytes: number;
  /** Pixel size of an image after upload (null for documents and SVG). */
  width: number | null;
  height: number | null;
  altText: string | undefined;
  description: string | undefined;
  /** The admin who uploaded it; null if that account no longer exists. */
  uploadedByEmail: string | null;
  createdAt: string;
  /** Set when the underlying file has been replaced; null otherwise. */
  replacedAt: string | null;
}
