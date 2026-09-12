import { ERROR_CODES, type ErrorCode, type ValidationIssue } from '@nexastack/shared';

interface AppErrorOptions {
  details?: ValidationIssue[];
  cause?: unknown;
}

/**
 * An expected, typed application error. Its `message` is safe to show to the client; anything
 * that is not an AppError is treated as internal and replaced with a generic message.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details: ValidationIssue[] | undefined;

  constructor(statusCode: number, code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(details: ValidationIssue[]) {
    super(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Some of the information sent needs attention. Check the details and try again.',
      { details },
    );
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found. Check the URL and try again.') {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(503, ERROR_CODES.SERVICE_UNAVAILABLE, message, options);
  }
}
