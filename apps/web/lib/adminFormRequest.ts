import type { ApiResponse } from '@nexastack/shared';

import { adminApiFormFetch } from '@/lib/adminApi';
import type { AdminRequestResult } from '@/lib/adminRequest';

/**
 * A file upload to the Express admin API, parsed from the response envelope into a result the caller
 * must branch on, exactly like `adminRequest` does for JSON: a rejected request, a non-2xx status, a
 * malformed body and a dropped connection all come back as `{ ok: false, error }` with a message safe
 * to show the admin. Field-level problems (for example a missing alt text) arrive in
 * `error.details` with the field's `path`.
 */
export async function adminFormRequest<T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: FormData,
): Promise<AdminRequestResult<T>> {
  let response: Response;
  try {
    response = await adminApiFormFetch(path, method, body);
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
