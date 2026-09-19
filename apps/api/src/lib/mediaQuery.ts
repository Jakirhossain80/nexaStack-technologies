import type { MediaType } from '@nexastack/shared';
import mongoose from 'mongoose';

import { escapeRegex } from './listQuery.js';

/** Pure helper for Media Library list queries, kept apart from the service so it can be unit-tested. */
export interface MediaFilter {
  q?: string | undefined;
  mediaType?: MediaType | undefined;
  /**
   * Raster images only (JPG, PNG, WebP): what a blog cover can use, since covers are rendered through
   * `next/image`, which does not serve SVG. Implies `mediaType: image`.
   */
  raster?: boolean | undefined;
}

/**
 * The Mongo filter for the list. The search term is matched as literal, case-insensitive text (never
 * interpreted as a pattern) against the file name, alt text and description, so an image can be found
 * by what it was called or what it was described as.
 */
export function buildMediaFilter(filter: MediaFilter): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {};

  if (filter.mediaType) mongoFilter.mediaType = filter.mediaType;
  if (filter.raster) {
    mongoFilter.mediaType = 'image';
    // `trusted`: `sanitizeFilter` would otherwise turn `$ne` into `$eq`. The operand is a constant.
    mongoFilter.mimeType = mongoose.trusted({ $ne: 'image/svg+xml' });
  }

  if (filter.q) {
    const pattern = new RegExp(escapeRegex(filter.q), 'i');
    mongoFilter.$or = [{ filename: pattern }, { altText: pattern }, { description: pattern }];
  }

  return mongoFilter;
}
