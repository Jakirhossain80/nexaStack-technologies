import { API_URL, WEB_URL } from './env';

/**
 * Server-to-server calls to the Express API, used by global setup and by tests that need to seed or look up
 * state (for example, "the confirmation number the form showed is a real document"). Node's `fetch` can set
 * `X-Forwarded-For`, so every call takes its own client IP and the API's per-IP limiters (login: 5 per 15
 * minutes) are never exhausted by test plumbing. The browser cannot do this, which is why signed-in browser
 * state is created once in global setup and reused.
 */

export const SESSION_COOKIE = 'nexastack_admin_session';

let counter = 0;
export function uniqueIp(): string {
  counter += 1;
  return `198.18.${Math.floor(counter / 250) % 250}.${(counter % 250) + 1}`;
}

export interface ApiReply {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper: payloads differ per endpoint
  body: any;
  setCookie: string | null;
}

export async function api(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<ApiReply> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { 'x-forwarded-for': uniqueIp() };
  if (method !== 'GET') {
    headers['origin'] = WEB_URL;
    headers['x-requested-with'] = 'nexastack-admin';
  }
  if (options.cookie) headers['cookie'] = options.cookie;
  if (options.body !== undefined) headers['content-type'] = 'application/json';

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return {
    status: response.status,
    body,
    setCookie:
      response.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`)) ?? null,
  };
}

/** Signs in and returns the `name=value` cookie. */
export async function login(email: string, password: string): Promise<string> {
  const reply = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (reply.status !== 200 || !reply.setCookie) {
    throw new Error(`Login for ${email} failed: ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.setCookie.split(';')[0]!;
}
