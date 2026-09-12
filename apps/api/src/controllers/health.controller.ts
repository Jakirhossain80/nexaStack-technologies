import type { Request, Response } from 'express';

import { sendSuccess } from '../lib/respond.js';
import * as healthService from '../services/health.service.js';

export function getHealth(_req: Request, res: Response): void {
  sendSuccess(res, healthService.getLiveness());
}

export async function getReady(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await healthService.getReadiness());
}
