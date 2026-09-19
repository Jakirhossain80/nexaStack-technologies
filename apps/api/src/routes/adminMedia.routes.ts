import { mediaDeleteSchema } from '@nexastack/shared';
import { Router } from 'express';

import * as controller from '../controllers/adminMedia.controller.js';
import { csrfProtection } from '../middleware/csrf.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { mediaListQuerySchema, mediaUpdateBodySchema } from '../schemas/adminMedia.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';

/**
 * Media Library, mounted at `/api/v1/admin/media` BEFORE `adminRouter` (see routes/index.ts).
 *
 * PERMISSIONS (see `ROLE_PERMISSIONS` in `@nexastack/shared`). Reading the library (list, one item,
 * where it is used) needs `media:read`, which every role has, so a content editor writing a blog post
 * can pick a cover image. Upload, edit and replace need `manage:media`; delete needs `media:delete`.
 * Today the last two are `super_admin` and `admin` only.
 *
 * Every mutation also passes `csrfProtection` (exact Origin + custom header). The two upload routes
 * take `multipart/form-data`, which `express.json` does not parse, so they carry no `validate({ body })`:
 * the controller reads the body with `readMultipart` (size-capped while streaming) and the service
 * validates the real bytes and the descriptive field. No rate limiter, consistent with the other
 * session-gated admin routes.
 */
export const adminMediaRouter = Router();

adminMediaRouter.use(requireSession);

const canRead = requirePermission('media:read');
const canManage = requirePermission('manage:media');
const canDelete = requirePermission('media:delete');

const idParams = { params: mongoIdParamSchema };

/**
 * @openapi
 * /api/v1/admin/media:
 *   get:
 *     summary: Search and paginate the Media Library
 *     description: >
 *       Query parameters `q` (file name, alt text or description, matched literally), `mediaType`
 *       (`image` or `document`), `raster=true` (JPG, PNG and WebP only: what a blog cover can use), `page`,
 *       `limit` (default 24, max 100). Filtering happens in the database.
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: "A page of items: { items, page, limit, total, totalPages }." }
 *       400: { description: Invalid query (VALIDATION_ERROR). }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Role not permitted (FORBIDDEN). }
 *   post:
 *     summary: Upload an image or document
 *     description: >
 *       `multipart/form-data` with `file` and either `altText` (REQUIRED for an image) or `description`
 *       (optional, for a document). The type is decided from the file's bytes, never from its name or
 *       declared type. Images: JPG, PNG, WebP (10 MB) or SVG (1 MB, plain drawings only); documents: PDF
 *       (10 MB). Raster images are capped at 2400px; delivery is public with automatic format/quality.
 *     tags: [Admin Media]
 *     responses:
 *       201: { description: The new item. }
 *       400: { description: Missing alt text, unsupported or unsafe file (VALIDATION_ERROR). }
 *       413: { description: File over the limit for its type (PAYLOAD_TOO_LARGE). }
 *       503: { description: File storage is not configured or unavailable (SERVICE_UNAVAILABLE). }
 */
adminMediaRouter.get('/', canRead, validate({ query: mediaListQuerySchema }), controller.listMedia);
adminMediaRouter.post('/', canManage, csrfProtection, controller.uploadMedia);

/**
 * @openapi
 * /api/v1/admin/media/{id}:
 *   get:
 *     summary: One Media Library item
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: The item. }
 *       404: { description: Not found (NOT_FOUND). }
 *   patch:
 *     summary: Edit an item's alt text (image) or description (document)
 *     description: An image's alt text is required and cannot be blanked.
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: The updated item. }
 *       400: { description: Invalid or wrong-type field (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *   delete:
 *     summary: Permanently delete an item and its Cloudinary file
 *     description: >
 *       Body `{ confirmFilename, referencesReported?, referencesAcknowledged? }`. Refused unless
 *       `confirmFilename` equals the file name exactly, and ALWAYS refused (409) while any blog post uses
 *       the item as its cover image. The Cloudinary asset is deleted (with CDN
 *       invalidation) before the record; if that fails nothing is removed. The reference fields are
 *       what the admin saw in the best-effort usage scan and are recorded in the audit log, not enforced.
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: "{ deleted: true, cloudinary: 'deleted' | 'not-found' }." }
 *       400: { description: File name does not match (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       503: { description: Storage unavailable; nothing was removed (SERVICE_UNAVAILABLE). }
 */
adminMediaRouter.get('/:id', canRead, validate(idParams), controller.getMedia);

/**
 * @openapi
 * /api/v1/admin/media/{id}/usage:
 *   get:
 *     summary: Where an item is used, as real references
 *     description: >
 *       The blog posts (any status) that use the item as their cover image, because they store its id.
 *       Content that only contains the URL (config files, page components) is not tracked here.
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: "{ usage: { blogPosts: [{ id, title, status }] } }." }
 *       404: { description: Not found (NOT_FOUND). }
 */
adminMediaRouter.get('/:id/usage', canRead, validate(idParams), controller.getMediaUsage);

adminMediaRouter.patch(
  '/:id',
  canManage,
  csrfProtection,
  validate({ ...idParams, body: mediaUpdateBodySchema }),
  controller.updateMedia,
);
adminMediaRouter.delete(
  '/:id',
  canDelete,
  csrfProtection,
  validate({ ...idParams, body: mediaDeleteSchema }),
  controller.deleteMedia,
);

/**
 * @openapi
 * /api/v1/admin/media/{id}/replace:
 *   post:
 *     summary: Replace an item's file, keeping its id and alt text / description
 *     description: >
 *       `multipart/form-data` with `file` (same kind as the original: an image replaces an image) and
 *       optional `deleteOld=true`. By default the previous Cloudinary file is KEPT, so a URL hardcoded
 *       elsewhere keeps working; the old public id is always audited. Content that hardcodes a URL is
 *       not updated: only records that reference the library by id follow the new file.
 *     tags: [Admin Media]
 *     responses:
 *       200: { description: "{ media, oldFile: 'kept' | 'deleted' | 'delete-failed', postsUpdated: number | null }." }
 *       400: { description: Unsupported, unsafe or wrong-kind file (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Changed by someone else meanwhile (CONFLICT). }
 *       413: { description: File over the limit for its type (PAYLOAD_TOO_LARGE). }
 */
adminMediaRouter.post(
  '/:id/replace',
  canManage,
  csrfProtection,
  validate(idParams),
  controller.replaceMedia,
);
