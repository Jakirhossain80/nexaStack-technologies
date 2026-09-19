import { enquiryNoteSchema, enquiryStatusChangeSchema } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { actionContext } from '../lib/actionContext.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate.js';
import { enquiryExportQuerySchema, enquiryListQuerySchema } from '../schemas/adminEnquiries.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';
import * as enquiries from '../services/adminEnquiries.service.js';

export async function listEnquiries(_req: Request, res: Response): Promise<void> {
  const { page, limit, ...filter } = validatedQuery(res, enquiryListQuerySchema);
  sendSuccess(res, await enquiries.listEnquiries(filter, page, limit), 200);
}

/**
 * A CSV download, not the JSON envelope: the body is the file. Errors (401, 400, 413) still use the
 * normal envelope through the error handler. `no-store` because it contains personal data.
 */
export async function exportEnquiries(req: Request, res: Response): Promise<void> {
  const filter = validatedQuery(res, enquiryExportQuerySchema);
  const { csv } = await enquiries.exportEnquiries(filter, actionContext(req));

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="enquiries-${date}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(csv);
}

/** Opening an enquiry marks it read (see `openEnquiry`). */
export async function getEnquiry(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(res, { enquiry: await enquiries.openEnquiry(id, actionContext(req)) }, 200);
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, enquiryStatusChangeSchema);
  sendSuccess(
    res,
    { enquiry: await enquiries.changeEnquiryStatus(id, status, actionContext(req)) },
    200,
  );
}

export async function addNote(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { text } = validatedBody(res, enquiryNoteSchema);
  sendSuccess(res, { enquiry: await enquiries.addEnquiryNote(id, text, actionContext(req)) }, 201);
}

export async function archive(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(
    res,
    { enquiry: await enquiries.setEnquiryArchived(id, true, actionContext(req)) },
    200,
  );
}

export async function unarchive(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(
    res,
    { enquiry: await enquiries.setEnquiryArchived(id, false, actionContext(req)) },
    200,
  );
}
