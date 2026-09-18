import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { SESSION_LIFETIME_MS } from './sessionPolicy.js';

/**
 * The JWT carries only a `sessionId` — never the admin's role, email, or any other claim that
 * would let the web side make an authorization decision from the token alone. The token proves
 * "this browser presented a session id we issued"; whether that session is still valid (not
 * expired, not revoked) is always re-checked against `AdminSession` in MongoDB by
 * `middleware/requireSession.ts` — the JWT is a lookup key, not the source of truth.
 */
export interface SessionTokenPayload {
  sessionId: string;
}

export function signSessionToken(sessionId: string): string {
  return jwt.sign({ sessionId } satisfies SessionTokenPayload, env.JWT_SECRET, {
    expiresIn: Math.floor(SESSION_LIFETIME_MS / 1000),
  });
}

/** Returns the payload if the token's signature and expiry are valid, otherwise `null`. Never
 * throws — every caller already has to handle "not authenticated" as a normal outcome. */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && typeof decoded.sessionId === 'string') {
      return { sessionId: decoded.sessionId };
    }
    return null;
  } catch {
    return null;
  }
}
