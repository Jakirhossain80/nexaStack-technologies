import { ERROR_CODES, type ApiErrorBody } from '@nexastack/shared';
import type { ErrorRequestHandler } from 'express';

import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { sendError } from '../lib/respond.js';

interface ErrorResponse {
  statusCode: number;
  body: ApiErrorBody;
}

/** Errors raised by body-parser (express.json) carry a `type` and an HTTP `status`. */
interface BodyParserError extends Error {
  type: string;
  status: number;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return (
    err instanceof Error &&
    typeof (err as Partial<BodyParserError>).type === 'string' &&
    typeof (err as Partial<BodyParserError>).status === 'number'
  );
}

const INTERNAL_ERROR: ErrorResponse = {
  statusCode: 500,
  body: {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Something went wrong on our side. Please try again later.',
  },
};

/** Map any thrown value to a client-safe response. Unknown errors never leak their message. */
function toErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      body: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
  }

  if (isBodyParserError(err)) {
    if (err.type === 'entity.parse.failed') {
      return {
        statusCode: 400,
        body: {
          code: ERROR_CODES.INVALID_JSON,
          message: 'The request body is not valid JSON. Check the syntax and try again.',
        },
      };
    }
    if (err.type === 'entity.too.large') {
      return {
        statusCode: 413,
        body: {
          code: ERROR_CODES.PAYLOAD_TOO_LARGE,
          message: 'The request body is too large. Shorten it and try again.',
        },
      };
    }
    if (err.status >= 400 && err.status < 500) {
      return {
        statusCode: 400,
        body: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'The request could not be read. Send it as UTF-8 encoded JSON and try again.',
        },
      };
    }
  }

  return INTERNAL_ERROR;
}

/**
 * Central error handler — must be registered last, with four arguments.
 * Logs full detail server-side (with the request id when available); returns only the
 * safe envelope to the client.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // pino-http runs after express.json, so body-parser errors arrive before req.log exists.
  const log = req.log ?? logger;

  if (res.headersSent) {
    log.error({ err }, 'Error raised after the response started');
    next(err);
    return;
  }

  const { statusCode, body } = toErrorResponse(err);

  if (statusCode === 500) {
    // Unexpected: log everything, including the stack.
    log.error({ err }, 'Request failed with an internal error');
  } else {
    // Expected, handled problems (validation, not found, not ready…): no stack noise.
    log.warn({ code: body.code, statusCode }, body.message);
  }

  sendError(res, statusCode, body);
};
