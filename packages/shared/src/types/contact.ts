import type { z } from 'zod';

import type { contactSchema } from '../schemas/contact.js';

/** Contact form values as entered (before trimming). */
export type ContactFormValues = z.input<typeof contactSchema>;

/** Contact data after validation. */
export type ContactInput = z.infer<typeof contactSchema>;
