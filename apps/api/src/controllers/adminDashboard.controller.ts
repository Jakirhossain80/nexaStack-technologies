import type { Request, Response } from 'express';

import { sendSuccess } from '../lib/respond.js';
import { validatedQuery } from '../middleware/validate.js';
import { recentActivityQuerySchema } from '../schemas/adminSubmissions.js';
import { listRecentAdminActivity } from '../services/adminActivityLog.service.js';
import { getDashboardStats } from '../services/adminDashboard.service.js';

export async function getStats(_req: Request, res: Response): Promise<void> {
  const stats = await getDashboardStats();
  sendSuccess(res, stats, 200);
}

export async function getRecentActivity(_req: Request, res: Response): Promise<void> {
  const { limit } = validatedQuery(res, recentActivityQuerySchema);
  const entries = await listRecentAdminActivity(limit);
  sendSuccess(res, { entries }, 200);
}
