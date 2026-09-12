import { z } from 'zod';

/**
 * Contact form. Used by the web form (React Hook Form resolver) and by
 * `POST /api/v1/contact` (validate middleware). Messages are user-facing.
 */
export const contactSchema = z.object({
  name: z
    .string({ error: 'Please enter your name' })
    .trim()
    .min(2, { error: 'Please enter your name (at least 2 characters)' })
    .max(100, { error: 'Please shorten your name to 100 characters or fewer' }),
  email: z
    .string({ error: 'Please enter your email address' })
    .trim()
    .max(254, { error: 'Please use an email address of 254 characters or fewer' })
    .pipe(z.email({ error: 'Please enter a valid email address, like name@example.com' })),
  subject: z
    .string({ error: 'Please enter a subject' })
    .trim()
    .min(3, { error: 'Please enter a subject (at least 3 characters)' })
    .max(150, { error: 'Please shorten the subject to 150 characters or fewer' }),
  message: z
    .string({ error: 'Please enter a message' })
    .trim()
    .min(20, { error: 'Please tell us a little more (at least 20 characters)' })
    .max(5000, { error: 'Please shorten your message to 5,000 characters or fewer' }),
});
