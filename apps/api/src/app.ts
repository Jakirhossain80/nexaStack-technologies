import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { httpLogger, REQUEST_ID_HEADER } from './lib/httpLogger.js';
import { CSRF_HEADER_NAME } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { router } from './routes/index.js';

const JSON_BODY_LIMIT = '100kb';

const allowedOrigins = new Set(env.CORS_ORIGINS);

const corsOptions: CorsOptions = {
  // Explicit allowlist — never "*" with credentials. Requests without an Origin header
  // (curl, server-to-server, uptime monitors) are not CORS requests and pass through.
  origin: (origin, callback) => callback(null, origin === undefined || allowedOrigins.has(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  // CSRF_HEADER_NAME: the custom header the admin CSRF check (middleware/csrf.ts) requires on
  // every cookie-authenticated mutation — without it here, the browser's preflight rejects the
  // real request before it's ever sent, since a header not in this allowlist can't be set.
  allowedHeaders: ['Content-Type', REQUEST_ID_HEADER, CSRF_HEADER_NAME],
  exposedHeaders: [REQUEST_ID_HEADER, 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
  maxAge: 600,
};

/**
 * Build the Express app. Middleware order is fixed by apps/api/CLAUDE.md section 2 — do not
 * reorder. Kept separate from index.ts so tests can mount the app without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(cookieParser());
  // Before express.json, so body-parser rejections (malformed JSON, too large) have a request id.
  app.use(httpLogger);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  // Rate limiters are attached per route inside the routers.
  app.use(router);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
