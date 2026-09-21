import { ERROR_CODES, type ContactInput } from '@nexastack/shared';

import { AppError } from '../lib/errors.js';

/**
 * Retired scaffold. The public website accepts enquiries through its own /api/contact
 * Route Handler. Never acknowledge a message here: this endpoint does not save it.
 */
export async function submitContact(_input: ContactInput): Promise<never> {
  throw new AppError(
    410,
    ERROR_CODES.ENDPOINT_RETIRED,
    'This contact endpoint has been retired. Your message was not saved. Please submit it using the contact form at /contact on the NexaStack Technologies website.',
  );
}
