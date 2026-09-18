import type { Request, Response } from 'express';

import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate.js';
import {
  mongoIdParamSchema,
  submissionListQuerySchema,
  updateSubmissionStatusSchema,
} from '../schemas/adminSubmissions.js';
import * as submissions from '../services/adminSubmissions.service.js';

export async function listEnquiries(_req: Request, res: Response): Promise<void> {
  const query = validatedQuery(res, submissionListQuerySchema);
  const enquiries = await submissions.listContactSubmissions(query);
  sendSuccess(res, { enquiries }, 200);
}

export async function getEnquiry(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const enquiry = await submissions.getContactSubmissionById(id);
  sendSuccess(res, { enquiry }, 200);
}

export async function updateEnquiryStatus(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, updateSubmissionStatusSchema);
  await submissions.updateContactSubmissionStatus(id, status);
  sendSuccess(res, { updated: true }, 200);
}

export async function listQuotations(_req: Request, res: Response): Promise<void> {
  const query = validatedQuery(res, submissionListQuerySchema);
  const quotations = await submissions.listQuotationSubmissions(query);
  sendSuccess(res, { quotations }, 200);
}

export async function getQuotation(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const quotation = await submissions.getQuotationSubmissionById(id);
  sendSuccess(res, { quotation }, 200);
}

export async function updateQuotationStatus(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { status } = validatedBody(res, updateSubmissionStatusSchema);
  await submissions.updateQuotationSubmissionStatus(id, status);
  sendSuccess(res, { updated: true }, 200);
}
