import type { z } from 'zod';

import type { contactFormSchema, contactSchema } from '../schemas/contact.js';

/** Contact form values as entered (before trimming). */
export type ContactFormValues = z.input<typeof contactSchema>;

/** Contact data after validation. */
export type ContactInput = z.infer<typeof contactSchema>;

/** `/contact` page general-inquiry form values as entered (before trimming). */
export type ContactPageFormValues = z.input<typeof contactFormSchema>;

/** `/contact` page general-inquiry data after validation. */
export type ContactPageInput = z.infer<typeof contactFormSchema>;
