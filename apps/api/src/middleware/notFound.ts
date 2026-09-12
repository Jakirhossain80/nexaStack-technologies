import type { RequestHandler } from 'express';

import { NotFoundError } from '../lib/errors.js';

/** Runs after all routes: anything unmatched becomes a 404 in the response envelope. */
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('This endpoint does not exist. Check the method and URL.'));
};
