import { randomUUID } from 'node:crypto';

import { pinoHttp } from 'pino-http';

import { logger } from './logger.js';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Accept a caller-supplied id only if it is a sane token; otherwise generate one. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

export const httpLogger = pinoHttp({
  logger,

  genReqId(req, res) {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  },

  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Health checks are polled by uptime monitors; keep them out of the request log.
  autoLogging: {
    ignore: (req) => req.url?.startsWith('/health') ?? false,
  },

  // Log only what is needed to trace a request. No headers, no bodies.
  serializers: {
    req: (req: { id: unknown; method: string; url: string; remoteAddress?: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
