import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

/** Treat an empty string the same as an unset variable. */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const siteUrl = z
  .url({
    protocol: /^https?$/,
    error: (issue) =>
      issue.input === undefined
        ? 'is required for production builds but not set'
        : 'must be an absolute http(s) URL',
  })
  .transform((url) => url.replace(/\/+$/, ''));

const webEnvSchema = z.object({
  // Required in production builds; defaults to localhost in development.
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    isProduction ? siteUrl : siteUrl.default('http://localhost:3000'),
  ),
});

// NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline them.
const parsed = webEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  throw new Error(`Invalid web environment configuration:\n${lines.join('\n')}`);
}

export const env = parsed.data;
