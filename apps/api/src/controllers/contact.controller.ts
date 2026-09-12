import { contactSchema } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { sendSuccess } from '../lib/respond.js';
import { validatedBody } from '../middleware/validate.js';
import * as contactService from '../services/contact.service.js';

export async function submitContact(req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, contactSchema);
  const result = await contactService.submitContact(input);

  // Never log the enquiry content: it is personal data.
  req.log.info({ event: 'contact.received' }, 'Contact enquiry received');

  sendSuccess(res, result);
}
