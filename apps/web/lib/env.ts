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
  // Optional: unset until Cloudflare Turnstile is configured (CLAUDE.md 22, /contact form).
  // When unset, the Turnstile widget does not render and /api/contact skips verification.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
});

// NEXT_PUBLIC_* variables must be referenced literally so Next.js can inline them.
const parsed = webEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  throw new Error(`Invalid web environment configuration:\n${lines.join('\n')}`);
}

export const env = parsed.data;
