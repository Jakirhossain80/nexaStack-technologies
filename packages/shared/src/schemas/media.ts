import { z } from 'zod';

import {
  MEDIA_ALT_TEXT_MAX,
  MEDIA_ALT_TEXT_MIN,
  MEDIA_DESCRIPTION_MAX,
} from '../constants/media.js';

import { emptyToUndefined } from './content.js';

/**
 * Media Library (admin). Used by the upload/edit forms in `apps/web` and by `apps/api`'s
 * `/api/v1/admin/media/*` routes, which are the security boundary. The list query schema is API-only
 * and lives in `apps/api` (packages/shared/CLAUDE.md).
 *
 * Images and documents are described differently on purpose. An image needs ALT TEXT (root
 * CLAUDE.md 15): it stands in for the picture for anyone who cannot see it, so an image is not
 * usable without one. A document has no `alt`; a link to it is described by its visible link text,
 * so it gets an optional DESCRIPTION instead.
 */

export const mediaAltTextSchema = z
  .string({ error: 'Please describe the image: alt text is required so it can be used accessibly' })
  .trim()
  .min(MEDIA_ALT_TEXT_MIN, {
    error: `Please describe what the image shows (at least ${MEDIA_ALT_TEXT_MIN} characters). Alt text is required.`,
  })
  .max(MEDIA_ALT_TEXT_MAX, {
    error: `Please keep the alt text to ${MEDIA_ALT_TEXT_MAX} characters or fewer`,
  });

export const mediaDescriptionSchema = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(MEDIA_DESCRIPTION_MAX, {
      error: `Please keep the description to ${MEDIA_DESCRIPTION_MAX} characters or fewer`,
    })
    .optional(),
);

/** The descriptive field an IMAGE requires. */
export const mediaImageMetadataSchema = z.object({ altText: mediaAltTextSchema });

/** The descriptive field a DOCUMENT may have. */
export const mediaDocumentMetadataSchema = z.object({ description: mediaDescriptionSchema });

/**
 * `DELETE /:id` body. `confirmFilename` is the deliberate confirmation: the API refuses unless it
 * equals the record's file name exactly. The other two record what the admin saw in the best-effort
 * reference scan (which runs in `apps/web`, the only place that can see the site's config): they are
 * written to the audit log, and are not a security check.
 */
export const mediaDeleteSchema = z.object({
  confirmFilename: z
    .string({ error: 'Type the file name to confirm the deletion' })
    .min(1, { error: 'Type the file name to confirm the deletion' })
    .max(500, { error: 'That is longer than any file name here' }),
  referencesReported: z.number().int().min(0).max(1000).default(0),
  referencesAcknowledged: z.boolean().default(false),
});
