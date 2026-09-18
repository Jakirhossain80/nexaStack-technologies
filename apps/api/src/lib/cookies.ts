import type { CookieOptions } from 'express';

import { isProduction } from '../config/env.js';
import { SESSION_LIFETIME_MS } from './sessionPolicy.js';

export const SESSION_COOKIE_NAME = 'nexastack_admin_session';

/**
 * Dev-safe defaults (root CLAUDE.md 11.3's cookie/domain note, and this task's honesty note
 * 5): `secure` is conditional on `NODE_ENV` because a `Secure` cookie is silently dropped by
 * the browser over plain `http://localhost` — this is a real necessity for local testing, not
 * a shortcut, and becomes unconditionally `true` in production. `sameSite: 'lax'` works today
 * because web (:3000) and api (:4000) share the `localhost` hostname; once a real domain
 * exists (root CLAUDE.md 22.1), this needs revisiting per that same cookie/domain note if web
 * and api end up on unrelated domains rather than a shared registrable one.
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_LIFETIME_MS,
  };
}

/** Options for clearing the cookie must match the options it was set with (aside from maxAge),
 * or some browsers won't recognise it as the same cookie to remove. */
export function clearedSessionCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...rest } = sessionCookieOptions();
  return rest;
}
