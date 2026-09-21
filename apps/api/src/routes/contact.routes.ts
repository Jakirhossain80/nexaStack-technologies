import { contactSchema } from '@nexastack/shared';
import { Router } from 'express';

import * as contactController from '../controllers/contact.controller.js';
import { contactRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

export const contactRouter = Router();

/**
 * @openapi
 * /api/v1/contact:
 *   post:
 *     summary: Retired contact endpoint
 *     description: >
 *       Public. Rate limited to 10 requests per IP per 15 minutes. The body is validated with
 *       contactSchema from @nexastack/shared. Valid requests return 410 ENDPOINT_RETIRED;
 *       nothing is persisted or emailed. Use the public website's /contact form instead.
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email, maxLength: 254 }
 *               subject: { type: string, minLength: 3, maxLength: 150 }
 *               message: { type: string, minLength: 20, maxLength: 5000 }
 *     responses:
 *       410:
 *         description: Endpoint retired (ENDPOINT_RETIRED). The message was not saved.
 *       400:
 *         description: Validation failed (VALIDATION_ERROR with field-level details) or invalid JSON (INVALID_JSON).
 *       413:
 *         description: Request body too large (PAYLOAD_TOO_LARGE).
 *       429:
 *         description: Rate limit exceeded (RATE_LIMITED).
 *       500:
 *         description: Internal error (INTERNAL_ERROR).
 */
contactRouter.post(
  '/',
  contactRateLimiter,
  validate({ body: contactSchema }),
  contactController.submitContact,
);
