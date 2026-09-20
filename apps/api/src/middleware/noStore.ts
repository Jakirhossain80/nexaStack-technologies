import type { RequestHandler } from 'express';

/**
 * `Cache-Control: no-store` for responses that carry private data (admin lists, enquiries, quotation
 * details, session and account state). Helmet does not set a cache policy, and without one a browser or
 * an intermediary is free to keep such a response and replay it (for example to the next person on a
 * shared machine after logout). Mounted on `/api/v1/auth` and `/api/v1/admin` only; public and health
 * routes are unaffected.
 */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
