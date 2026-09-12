import type { ErrorCode } from '../constants/errorCodes.js';

/** A single field-level validation problem. */
export interface ValidationIssue {
  location: 'body' | 'params' | 'query';
  /** Dot-separated path to the field, e.g. `email` or `items.0.name`. Empty for the root. */
  path: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: ValidationIssue[];
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

/** The response envelope returned by every API endpoint. */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
