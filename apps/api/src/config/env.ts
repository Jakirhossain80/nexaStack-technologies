import { z } from 'zod';

/**
 * Environment configuration, validated once at startup. Import `env` instead of reading
 * `process.env` anywhere else. If validation fails the process exits with a message naming
 * every invalid variable.
 */

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

/** Treat an empty string the same as an unset variable. */
const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const requiredString = (hint: string) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `is required but not set (${hint})` : hint),
  });

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),

  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).default(4000)),

  CORS_ORIGINS: z.preprocess(
    emptyToUndefined,
    requiredString('comma-separated list of allowed origins, e.g. http://localhost:3000')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .pipe(
        z
          .array(
            z
              .url({
                protocol: /^https?$/,
                error: 'each origin must be an absolute http(s) URL; "*" is not allowed',
              })
              .transform((url) => new URL(url).origin),
          )
          .min(1, { error: 'must list at least one origin' }),
      ),
  ),

  MONGODB_URI: z.preprocess(
    emptyToUndefined,
    requiredString('MongoDB connection string').regex(/^mongodb(\+srv)?:\/\//, {
      error: 'must start with mongodb:// or mongodb+srv://',
    }),
  ),

  LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum(LOG_LEVELS).default('info')),

  // Number of reverse-proxy hops in front of the API (Render: 1). Needed so rate limiting
  // sees the real client IP. 0 = trust none (local development).
  TRUST_PROXY: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).default(0)),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  console.error(
    [
      'Invalid environment configuration:',
      ...lines,
      '',
      'Copy apps/api/.env.example to apps/api/.env and set the variables above.',
    ].join('\n'),
  );
  process.exit(1);
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
