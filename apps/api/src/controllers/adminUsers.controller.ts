import {
  adminRoleChangeSchema,
  adminStatusChangeSchema,
  createAdminUserSchema,
} from '@nexastack/shared';
import type { Request, Response } from 'express';

import { actionContext } from '../lib/actionContext.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams } from '../middleware/validate.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';
import * as users from '../services/adminUsers.service.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  sendSuccess(res, { users: await users.listAdminUsers(actionContext(req).adminId) }, 200);
}

/**
 * Both this and the reset return a temporary password, once. `no-store` so no browser or proxy keeps a
 * copy of the response body.
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, createAdminUserSchema);
  const created = await users.createAdminUser(input, actionContext(req));
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, created, 201);
}

export async function changeRole(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { role } = validatedBody(res, adminRoleChangeSchema);
  sendSuccess(res, { user: await users.changeAdminRole(id, role, actionContext(req)) }, 200);
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, adminStatusChangeSchema);
  sendSuccess(res, { user: await users.changeAdminStatus(id, status, actionContext(req)) }, 200);
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const reset = await users.resetAdminPassword(id, actionContext(req));
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, reset, 200);
}
