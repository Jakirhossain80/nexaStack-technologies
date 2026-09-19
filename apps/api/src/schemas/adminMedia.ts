import {
  MEDIA_PAGE_SIZE,
  emptyToUndefined,
  mediaTypeSchema,
  paginationQuerySchema,
} from '@nexastack/shared';
import { z } from 'zod';

/**
 * Query and body schemas for `/api/v1/admin/media`. Local to apps/api by design
 * (packages/shared/CLAUDE.md section 5): the web admin only builds these URLs.
 */

/** `GET /` — search across file name, alt text and description, optionally one type, paginated. */
export const mediaListQuerySchema = paginationQuerySchema.extend({
  // A grid, so a page is a round number of rows at every column count (2, 3, 4, 6).
  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int({ error: 'Limit must be a whole number' })
    .min(1, { error: 'Limit must be at least 1' })
    .max(100, { error: 'Limit must be 100 or fewer' })
    .default(MEDIA_PAGE_SIZE),
  q: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, { error: 'Search text must be 100 characters or fewer' }).optional(),
  ),
  mediaType: z.preprocess(emptyToUndefined, mediaTypeSchema.optional()),
  // `raster=true`: only JPG, PNG and WebP images (what a blog cover can use). Off by default.
  raster: z
    .preprocess(
      emptyToUndefined,
      z.enum(['true', 'false'], { error: 'raster must be true or false' }).default('false'),
    )
    .transform((value) => value === 'true'),
});

/**
 * `PATCH /:id` — the raw shape only. Which field applies (alt text for an image, description for a
 * document) depends on the record, so the service applies the matching shared schema; this just
 * bounds what can arrive.
 */
export const mediaUpdateBodySchema = z.object({
  altText: z.string().max(1_000).optional(),
  description: z.string().max(1_000).optional(),
});
