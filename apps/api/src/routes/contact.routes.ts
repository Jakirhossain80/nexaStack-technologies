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
 *     summary: Submit a contact enquiry
 *     description: >
 *       Public. Rate limited to 5 requests per IP per 15 minutes. The body is validated with
 *       contactSchema from @nexastack/shared. Not yet persisted or emailed.
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
 *       200:
 *         description: Enquiry received. Envelope with data { received true }.
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
