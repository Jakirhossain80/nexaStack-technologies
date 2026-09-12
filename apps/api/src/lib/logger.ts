import { pino } from 'pino';

import { env } from '../config/env.js';

/**
 * Base structured logger. Request-scoped logging uses `req.log` (pino-http), which carries the
 * request id on every line. Never log passwords, tokens, cookies, API keys or auth bodies.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'nexastack-api', env: env.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
