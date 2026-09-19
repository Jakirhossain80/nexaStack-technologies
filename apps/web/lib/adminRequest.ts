import type { ApiErrorBody, ApiResponse } from '@nexastack/shared';

import { adminApiFetch } from '@/lib/adminApi';

export type AdminRequestResult<T> =
  { ok: true; data: T } | { ok: false; status: number; error: ApiErrorBody };

/**
 * A mutation (or any client-side call) to the Express admin API, parsed from the response
 * envelope into a result the caller must branch on. Unlike a bare `adminApiFetch`, it never
 * silently ignores a failure: a rejected request, a non-2xx status, a malformed body and a dropped
 * connection all come back as `{ ok: false, error }` with a message safe to show the admin.
 *
 * Generic on purpose — every content type's editor uses it.
 */
export async function adminRequest<T>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<AdminRequestResult<T>> {
  let response: Response;
  try {
    response = await adminApiFetch(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Could not reach the server. Check your connection and try again.',
      },
    };
  }

  let parsed: ApiResponse<T> | null = null;
  try {
    parsed = (await response.json()) as ApiResponse<T>;
  } catch {
    parsed = null;
  }

  if (parsed?.success) return { ok: true, data: parsed.data };
  if (parsed && !parsed.success) return { ok: false, status: response.status, error: parsed.error };

  return {
    ok: false,
    status: response.status,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  };
}
