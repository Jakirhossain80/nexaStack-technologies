import { createHash, randomBytes } from 'node:crypto';

/** A high-entropy, URL-safe random string — used for both session ids and password-reset
 * tokens. 32 bytes (256 bits) is comfortably beyond brute-force range for either use. */
export function generateRandomToken(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256, not bcrypt: a reset token is already a 256-bit random value, not a user-chosen
 * low-entropy password — bcrypt's deliberate slowness defends against guessing a *weak*
 * secret, which doesn't apply here. A fast cryptographic hash is the correct, standard choice
 * for verifying a high-entropy token without storing it in plain text. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
