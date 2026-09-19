import { Router } from 'express';

import * as dashboardController from '../controllers/adminDashboard.controller.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { recentActivityQuerySchema } from '../schemas/adminSubmissions.js';

/**
 * Dashboard-supporting endpoints for the admin landing page (Contact enquiries and quotation
 * requests have their own routers: adminEnquiries.routes.ts, adminQuotations.routes.ts). Every route requires a valid session *and* one of the two
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

// Contact enquiries and quotation requests moved to their own routers:
// routes/adminEnquiries.routes.ts and routes/adminQuotations.routes.ts.
