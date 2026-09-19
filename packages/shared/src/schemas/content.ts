import { z } from 'zod';

import { contentStatusSchema } from '../constants/contentStatus.js';

/**
 * Schemas shared by every full-CMS content type (blog posts today; testimonials, FAQs and
 * others when they earn the treatment). Per-type schemas extend these rather than repeating
 * them.
 */

/** A form or query control left blank arrives as '' — treat that as "not provided". */
export function emptyToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string({ error: 'Please choose a valid item' })
  .regex(OBJECT_ID_PATTERN, { error: 'Please choose a valid item' });

/** Lowercase words joined by single hyphens. The same rule for every content type's slug. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string({ error: 'Please enter a URL slug' })
  .trim()
  .min(1, { error: 'Please enter a URL slug' })
  .max(100, { error: 'Please use a URL slug of 100 characters or fewer' })
  .regex(SLUG_PATTERN, {
    error: 'Use only lowercase letters, numbers and single hyphens, for example "my-first-post"',
  });

/** `POST /:id/status` — the requested status. Whether the change is allowed from the current
 * status is checked by the service against `CONTENT_STATUS_TRANSITIONS`, not here. */
export const contentStatusTransitionSchema = z.object({
  status: contentStatusSchema,
});

/** `PUT /…/order` — every id, in the new order. */
export const reorderSchema = z.object({
  orderedIds: z
    .array(objectIdSchema, { error: 'Send the full list of ids in the new order' })
    .min(1, { error: 'Send at least one id' })
    .max(200, { error: 'Too many items to reorder at once' })
    .refine((ids) => new Set(ids).size === ids.length, {
      error: 'Each id can appear only once',
    }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ error: 'Page must be a number' })
    .int({ error: 'Page must be a whole number' })
    .min(1, { error: 'Page must be 1 or more' })
    .default(1),
  limit: z.coerce
    .number({ error: 'Limit must be a number' })
    .int({ error: 'Limit must be a whole number' })
    .min(1, { error: 'Limit must be at least 1' })
    .max(100, { error: 'Limit must be 100 or fewer' })
    .default(20),
});

/** Search + status filter + pagination. Type-specific list queries `.extend()` this. */
export const contentListQuerySchema = paginationQuerySchema.extend({
  q: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, { error: 'Search text must be 100 characters or fewer' }).optional(),
  ),
  status: z.preprocess(emptyToUndefined, contentStatusSchema.optional()),
});
