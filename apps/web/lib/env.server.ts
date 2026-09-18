import { z } from 'zod';

/**
 * Server-only environment configuration: secrets that must never end up in a client bundle.
 * Kept out of `lib/env.ts` (which only ever holds `NEXT_PUBLIC_*` values) so the two can't be
 * accidentally imported into the same module graph that reaches the browser. Import this only
 * from Route Handlers and their server-side helpers (`lib/mongodb.ts`, `lib/turnstile.ts`).
 */

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const serverEnvSchema = z.object({
  // REQUIRED for /api/contact to persist submissions.
  MONGODB_URI: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'is required but not set (MongoDB connection string)' })
      .regex(/^mongodb(\+srv)?:\/\//, {
        error: 'must start with mongodb:// or mongodb+srv://',
      }),
  ),
  // Optional: unset in development skips Turnstile verification (see lib/turnstile.ts).
  TURNSTILE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Optional: unset until a real Cloudinary account is configured. When any of the three is
  // missing, /api/quotation/upload returns a clear "not available yet" error instead of a fake
  // success (see lib/cloudinary.ts).
  CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
});

function loadServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  throw new Error(
    ['Invalid server environment configuration:', ...lines, '', 'Check apps/web/.env.local against apps/web/.env.example.'].join(
      '\n',
    ),
  );
}

export const serverEnv = loadServerEnv();
