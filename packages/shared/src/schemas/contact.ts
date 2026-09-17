import { z } from 'zod';

/**
 * Contact form. Used by the web form (React Hook Form resolver) and by
 * `POST /api/v1/contact` (validate middleware). Messages are user-facing.
 *
 * NOTE: as of the `/contact` page build, this endpoint (`apps/api/src/routes/contact.routes.ts`
 * and friends) is wired but not called by the live site — the public contact page submits to
 * `apps/web/app/api/contact/route.ts` instead, validated by `contactFormSchema` below. Left
 * untouched here rather than reshaped, so this file's own OpenAPI-documented contract doesn't
 * silently change under it.
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

/** Trims a string, turning `''` or all-whitespace into `undefined` so a field stays optional. */
function optionalTrimmedString(max: number, maxMessage: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max, { error: maxMessage }).optional(),
  );
}

/**
 * The `/contact` page's general-inquiry form: fuller than `contactSchema` above (phone,
 * company, preferred contact method, consent) because it replaces it for the live site rather
 * than extending it. Used by `ContactForm` (React Hook Form resolver) and by
 * `apps/web/app/api/contact/route.ts` (the actual security boundary — client validation is
 * convenience only, root CLAUDE.md section 10).
 */
export const contactFormSchema = z
  .object({
    fullName: z
      .string({ error: 'Please enter your full name' })
      .trim()
      .min(2, { error: 'Please enter your full name (at least 2 characters)' })
      .max(120, { error: 'Please shorten your name to 120 characters or fewer' }),
    email: z
      .string({ error: 'Please enter your email address' })
      .trim()
      .max(254, { error: 'Please use an email address of 254 characters or fewer' })
      .pipe(z.email({ error: 'Please enter a valid email address, like name@example.com' })),
    phone: optionalTrimmedString(30, 'Please shorten this to 30 characters or fewer'),
    companyName: optionalTrimmedString(160, 'Please shorten this to 160 characters or fewer'),
    subject: z
      .string({ error: 'Please enter a subject' })
      .trim()
      .min(3, { error: 'Please enter a subject (at least 3 characters)' })
      .max(160, { error: 'Please shorten the subject to 160 characters or fewer' }),
    message: z
      .string({ error: 'Please enter a message' })
      .trim()
      .min(10, { error: 'Please tell us a little more (at least 10 characters)' })
      .max(2000, { error: 'Please shorten your message to 2,000 characters or fewer' }),
    preferredContactMethod: z.enum(['email', 'phone', 'whatsapp'], {
      error: 'Please choose how you would like to be contacted',
    }),
    consent: z.literal(true, {
      error: 'Please confirm you agree before submitting the form',
    }),
  })
  .refine((data) => data.preferredContactMethod === 'email' || Boolean(data.phone), {
    error:
      'Add a phone or WhatsApp number above, or choose Email as your preferred contact method',
    path: ['preferredContactMethod'],
  });
