import { hasPermission } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { UnauthenticatedError } from '../lib/errors.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedQuery } from '../middleware/validate.js';
import { recentActivityQuerySchema } from '../schemas/adminSubmissions.js';
import { listRecentAdminActivity } from '../services/adminActivityLog.service.js';
import { getDashboardStats } from '../services/adminDashboard.service.js';

/**
 * The route needs `manage:enquiries` OR `manage:quotations`; each SECTION of the answer is included
 * only if the caller holds that section's own capability. A role that could see one must not get the
 * other's counts just because it passed the route gate.
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  if (!req.admin) throw new UnauthenticatedError();
  const stats = await getDashboardStats({
    contact: hasPermission(req.admin.role, 'manage:enquiries'),
    quotation: hasPermission(req.admin.role, 'manage:quotations'),
  });
  sendSuccess(res, stats, 200);
}

export async function getRecentActivity(_req: Request, res: Response): Promise<void> {
  const { limit } = validatedQuery(res, recentActivityQuerySchema);
  const entries = await listRecentAdminActivity(limit);
  sendSuccess(res, { entries }, 200);
}
