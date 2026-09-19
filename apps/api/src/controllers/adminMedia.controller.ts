import { MEDIA_MAX_UPLOAD_BYTES, mediaDeleteSchema } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { actionContext } from '../lib/actionContext.js';
import { ValidationError } from '../lib/errors.js';
import { readMultipart } from '../lib/multipart.js';
import { sendSuccess } from '../lib/respond.js';
import { validatedBody, validatedParams, validatedQuery } from '../middleware/validate.js';
import { mediaListQuerySchema, mediaUpdateBodySchema } from '../schemas/adminMedia.js';
import { mongoIdParamSchema } from '../schemas/adminSubmissions.js';
import * as media from '../services/adminMedia.service.js';

export async function listMedia(_req: Request, res: Response): Promise<void> {
  const { page, limit, ...filter } = validatedQuery(res, mediaListQuerySchema);
  sendSuccess(res, await media.listMedia(filter, page, limit), 200);
}

export async function getMedia(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(res, { media: await media.getMedia(id) }, 200);
}

export async function getMediaUsage(_req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  sendSuccess(res, { usage: await media.getMediaUsage(id) }, 200);
}

/** Reads the multipart body and its single file, or throws the 400/413 the admin can act on. */
async function readUpload(req: Request) {
  const { fields, file } = await readMultipart(req, MEDIA_MAX_UPLOAD_BYTES);
  if (!file) {
    throw new ValidationError([
      { location: 'body', path: 'file', message: 'Please choose a file to upload.' },
    ]);
  }
  return { fields, bytes: new Uint8Array(await file.arrayBuffer()), originalName: file.name };
}

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  const { fields, bytes, originalName } = await readUpload(req);
  const created = await media.uploadMedia({ bytes, originalName, fields }, actionContext(req));
  sendSuccess(res, { media: created }, 201);
}

export async function updateMedia(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const body = validatedBody(res, mediaUpdateBodySchema);
  sendSuccess(res, { media: await media.updateMedia(id, body, actionContext(req)) }, 200);
}

export async function replaceMedia(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const { fields, bytes, originalName } = await readUpload(req);
  const result = await media.replaceMedia(
    id,
    { bytes, originalName, deleteOld: fields.deleteOld === 'true' },
    actionContext(req),
  );
  sendSuccess(res, result, 200);
}

export async function deleteMedia(req: Request, res: Response): Promise<void> {
  const { id } = validatedParams(res, mongoIdParamSchema);
  const body = validatedBody(res, mediaDeleteSchema);
  sendSuccess(res, await media.deleteMedia(id, body, actionContext(req)), 200);
}
