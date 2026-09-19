import { pipeline } from 'node:stream/promises';

import { quotationNoteSchema, quotationStatusChangeSchema } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { actionContext } from '../lib/actionContext.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate.js';
import {
  attachmentParamsSchema,
  quotationExportQuerySchema,
  quotationListQuerySchema,
} from '../schemas/adminQuotations.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';
import * as quotations from '../services/adminQuotations.service.js';

export async function listQuotations(_req: Request, res: Response): Promise<void> {
  const { page, limit, ...filter } = validatedQuery(res, quotationListQuerySchema);
  sendSuccess(res, await quotations.listQuotations(filter, page, limit), 200);
}

/**
 * A CSV download, not the JSON envelope: the body is the file. Errors (401, 400, 413) still use the
 * normal envelope through the error handler. `no-store` because it contains personal data.
 */
export async function exportQuotations(req: Request, res: Response): Promise<void> {
  const filter = validatedQuery(res, quotationExportQuerySchema);
  const { csv } = await quotations.exportQuotations(filter, actionContext(req));

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="quotations-${date}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(csv);
}

export async function getQuotation(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(res, { quotation: await quotations.getQuotation(id) }, 200);
}

/**
 * The file itself, not the JSON envelope. Refusals (401, 403, 404, 413, 422, 503) are thrown by the
 * service before any byte is written, so they use the normal envelope. `attachment` and `nosniff`
 * make the browser save the file rather than render it; `no-store` because it is client data.
 */
export async function downloadAttachment(req: Request, res: Response): Promise<void> {
  const { id, attachmentId } = validatedParams(res, attachmentParamsSchema);
  const file = await quotations.getAttachmentDownload(id, attachmentId, actionContext(req));

  res.status(200);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', file.contentDisposition);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');

  try {
    await pipeline(file.stream, res);
  } catch (err) {
    // The response has started, so there is no envelope to send; the socket is already torn down by
    // `pipeline`. Record it and stop.
    req.log.warn({ err, quotationId: id, attachmentIndex: attachmentId }, 'Attachment stream aborted');
  }
}

export async function changeStatus(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, quotationStatusChangeSchema);
  sendSuccess(
    res,
    { quotation: await quotations.changeQuotationStatus(id, status, actionContext(req)) },
    200,
  );
}

export async function addNote(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { text } = validatedBody(res, quotationNoteSchema);
  sendSuccess(
    res,
    { quotation: await quotations.addQuotationNote(id, text, actionContext(req)) },
    201,
  );
}

export async function archive(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(
    res,
    { quotation: await quotations.setQuotationArchived(id, true, actionContext(req)) },
    200,
  );
}

export async function unarchive(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(
    res,
    { quotation: await quotations.setQuotationArchived(id, false, actionContext(req)) },
    200,
  );
}
