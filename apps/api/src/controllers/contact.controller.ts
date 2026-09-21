import { contactSchema } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { validatedBody } from '../middleware/validate.js';
import * as contactService from '../services/contact.service.js';

export async function submitContact(_req: Request, res: Response): Promise<void> {
  const input = validatedBody(res, contactSchema);
  await contactService.submitContact(input);
}
