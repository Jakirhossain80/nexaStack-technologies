import type { ApiErrorBody, ApiFailure, ApiSuccess } from '@nexastack/shared';
import type { Response } from 'express';

/** Send the success envelope: `{ success: true, data }`. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

/** Send the error envelope: `{ success: false, error: { code, message, details? } }`. */
export function sendError(res: Response, statusCode: number, error: ApiErrorBody): void {
  const body: ApiFailure = { success: false, error };
  res.status(statusCode).json(body);
}
