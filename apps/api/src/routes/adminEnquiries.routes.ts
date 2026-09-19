import { enquiryNoteSchema, enquiryStatusChangeSchema } from '@nexastack/shared';
import { Router } from 'express';

import * as controller from '../controllers/adminEnquiries.controller.js';
import { csrfProtection } from '../middleware/csrf.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { enquiryExportQuerySchema, enquiryListQuerySchema } from '../schemas/adminEnquiries.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';

/**
 * Contact-enquiry management, mounted at `/api/v1/admin/enquiries` BEFORE `adminRouter` (see
 * routes/index.ts). Same access as before: `super_admin` and `admin` only, per the RBAC table in
 * apps/api/CLAUDE.md section 5 (enquiries are not `content_editor` content).
 *
 * Every mutation also passes `csrfProtection` (exact Origin + custom header). Reads do not need
 * it. `/export` is registered BEFORE `/:id` so "export" is never parsed as an id. No rate limiter,
 * consistent with the other session-gated admin routes.
 */
export const adminEnquiriesRouter = Router();

adminEnquiriesRouter.use(requireSession, requireRole('super_admin', 'admin'));

const idParams = { params: mongoIdParamSchema };

/**
 * @openapi
 * /api/v1/admin/enquiries:
 *   get:
 *     summary: Search, filter and paginate Contact enquiries
 *     description: >
 *       Query parameters `q` (name/email/subject/message substring), `status` (one value or a
 *       comma list, e.g. `new,read`), `archived` (`false` = active view, the default; `true` =
 *       archived only), `page`, `limit` (default 20, max 100). Filtering happens in the database.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: "A page of enquiries: { items, page, limit, total, totalPages }." }
 *       400: { description: Invalid query (VALIDATION_ERROR). }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Role not permitted (FORBIDDEN). }
 */
adminEnquiriesRouter.get('/', validate({ query: enquiryListQuerySchema }), controller.listEnquiries);

/**
 * @openapi
 * /api/v1/admin/enquiries/export:
 *   get:
 *     summary: Export the currently filtered enquiries as CSV
 *     description: >
 *       Takes the same `q`, `status` and `archived` parameters as the list and returns exactly the
 *       matching rows (no pagination). RFC 4180 quoting, formula-injection guard, UTF-8 BOM.
 *       Internal notes are not exported. Refused with 413 above 5,000 rows. Audited.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: A text/csv attachment. }
 *       400: { description: Invalid query (VALIDATION_ERROR). }
 *       413: { description: Too many rows to export (PAYLOAD_TOO_LARGE). }
 */
adminEnquiriesRouter.get(
  '/export',
  validate({ query: enquiryExportQuerySchema }),
  controller.exportEnquiries,
);

/**
 * @openapi
 * /api/v1/admin/enquiries/{id}:
 *   get:
 *     summary: One enquiry, including its internal notes
 *     description: >
 *       Opening an enquiry that is `new` marks it `read` (atomically, once) and audits it. This is
 *       the only GET with a side effect, and the only effect is new to read.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: The enquiry. }
 *       404: { description: Not found (NOT_FOUND). }
 */
adminEnquiriesRouter.get('/:id', validate(idParams), controller.getEnquiry);

/**
 * @openapi
 * /api/v1/admin/enquiries/{id}/status:
 *   patch:
 *     summary: Change an enquiry's status (read, contacted, closed)
 *     description: >
 *       Body `{ status }`. Allowed moves come from the shared transition table; `new` is never a
 *       target. Independent of archiving.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: The updated enquiry. }
 *       400: { description: Invalid status value (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Change not allowed from the current status (CONFLICT). }
 */
adminEnquiriesRouter.patch(
  '/:id/status',
  csrfProtection,
  validate({ ...idParams, body: enquiryStatusChangeSchema }),
  controller.changeStatus,
);

/**
 * @openapi
 * /api/v1/admin/enquiries/{id}/notes:
 *   post:
 *     summary: Add an internal note (append-only, attributed to the signed-in admin)
 *     tags: [Admin Enquiries]
 *     responses:
 *       201: { description: The updated enquiry, including the new note. }
 *       400: { description: Invalid note (VALIDATION_ERROR). }
 *       404: { description: Not found (NOT_FOUND). }
 *       409: { description: Note limit reached (CONFLICT). }
 */
adminEnquiriesRouter.post(
  '/:id/notes',
  csrfProtection,
  validate({ ...idParams, body: enquiryNoteSchema }),
  controller.addNote,
);

/**
 * @openapi
 * /api/v1/admin/enquiries/{id}/archive:
 *   patch:
 *     summary: Archive an enquiry (any status). Idempotent.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: The updated enquiry. }
 *       404: { description: Not found (NOT_FOUND). }
 * /api/v1/admin/enquiries/{id}/unarchive:
 *   patch:
 *     summary: Restore an archived enquiry to the active view. Idempotent.
 *     tags: [Admin Enquiries]
 *     responses:
 *       200: { description: The updated enquiry. }
 *       404: { description: Not found (NOT_FOUND). }
 */
adminEnquiriesRouter.patch('/:id/archive', csrfProtection, validate(idParams), controller.archive);
adminEnquiriesRouter.patch(
  '/:id/unarchive',
  csrfProtection,
  validate(idParams),
  controller.unarchive,
);
