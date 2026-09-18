import { Router } from 'express';

import * as dashboardController from '../controllers/adminDashboard.controller.js';
import * as submissionsController from '../controllers/adminSubmissions.controller.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import {
  mongoIdParamSchema,
  recentActivityQuerySchema,
  submissionListQuerySchema,
  updateSubmissionStatusSchema,
} from '../schemas/adminSubmissions.js';

/**
 * Dashboard-supporting endpoints for the admin landing page and its two minimal companion
 * views (enquiries, quotations). Every route requires a valid session *and* one of the two
 * roles the RBAC table in apps/api/CLAUDE.md section 5 scopes enquiries/quotations/media to
 * ('super_admin', 'admin') — not 'content_editor', which is blog/portfolio content only.
 * No rate limiter: these are session-gated admin reads/writes, not public or auth-specific
 * endpoints (apps/api/CLAUDE.md section 8 reserves rate limiting for those).
 */
export const adminRouter = Router();

adminRouter.use(requireSession, requireRole('super_admin', 'admin'));

/**
 * @openapi
 * /api/v1/admin/dashboard/stats:
 *   get:
 *     summary: Real dashboard counts
 *     description: >
 *       Contact and quotation submission counts (total and status=new). Does not include
 *       Services/Solutions/Projects/Technologies/Blog counts — those are static or stubbed
 *       data in apps/web, computed there directly rather than round-tripped through this API.
 *     tags: [Admin]
 *     responses:
 *       200: { description: Real, computed counts. }
 *       401: { description: Not authenticated (UNAUTHENTICATED). }
 *       403: { description: Authenticated but not super_admin/admin (FORBIDDEN). }
 */
adminRouter.get('/dashboard/stats', dashboardController.getStats);

/**
 * @openapi
 * /api/v1/admin/activity/recent:
 *   get:
 *     summary: Compact recent-activity feed for the dashboard
 *     description: The N most recent AdminActivityLog entries (default 5).
 *     tags: [Admin]
 *     responses:
 *       200: { description: Recent activity entries. }
 */
adminRouter.get(
  '/activity/recent',
  validate({ query: recentActivityQuerySchema }),
  dashboardController.getRecentActivity,
);

/**
 * @openapi
 * /api/v1/admin/enquiries:
 *   get:
 *     summary: List Contact submissions
 *     description: >
 *       Optional ?status=new|responded and ?limit= (default 50). Reused by both the
 *       dashboard's "content requiring attention" section and the quick-action links —
 *       no separate endpoint for either.
 *     tags: [Admin]
 *     responses:
 *       200: { description: Enquiry summaries. }
 */
adminRouter.get(
  '/enquiries',
  validate({ query: submissionListQuerySchema }),
  submissionsController.listEnquiries,
);

/**
 * @openapi
 * /api/v1/admin/enquiries/{id}:
 *   get:
 *     summary: Contact submission detail
 *     tags: [Admin]
 *     responses:
 *       200: { description: Full enquiry content. }
 *       404: { description: Not found (NOT_FOUND). }
 *   patch:
 *     summary: Update a Contact submission's status
 *     description: Status only — new to responded (or back). Not a general edit endpoint.
 *     tags: [Admin]
 *     responses:
 *       200: { description: Status updated. }
 *       404: { description: Not found (NOT_FOUND). }
 */
adminRouter.get(
  '/enquiries/:id',
  validate({ params: mongoIdParamSchema }),
  submissionsController.getEnquiry,
);
adminRouter.patch(
  '/enquiries/:id',
  validate({ params: mongoIdParamSchema, body: updateSubmissionStatusSchema }),
  submissionsController.updateEnquiryStatus,
);

/**
 * @openapi
 * /api/v1/admin/quotations:
 *   get:
 *     summary: List Quotation submissions
 *     description: Optional ?status=new|responded and ?limit= (default 50).
 *     tags: [Admin]
 *     responses:
 *       200: { description: Quotation summaries. }
 */
adminRouter.get(
  '/quotations',
  validate({ query: submissionListQuerySchema }),
  submissionsController.listQuotations,
);

/**
 * @openapi
 * /api/v1/admin/quotations/{id}:
 *   get:
 *     summary: Quotation submission detail
 *     tags: [Admin]
 *     responses:
 *       200: { description: Full quotation content. }
 *       404: { description: Not found (NOT_FOUND). }
 *   patch:
 *     summary: Update a Quotation submission's status
 *     description: Status only — new to responded (or back). Not a general edit endpoint.
 *     tags: [Admin]
 *     responses:
 *       200: { description: Status updated. }
 *       404: { description: Not found (NOT_FOUND). }
 */
adminRouter.get(
  '/quotations/:id',
  validate({ params: mongoIdParamSchema }),
  submissionsController.getQuotation,
);
adminRouter.patch(
  '/quotations/:id',
  validate({ params: mongoIdParamSchema, body: updateSubmissionStatusSchema }),
  submissionsController.updateQuotationStatus,
);
