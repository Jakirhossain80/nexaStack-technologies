import bcrypt from 'bcrypt';

/** Root CLAUDE.md 11.3's own stated minimum. Adjustable — flagged as a proposed default. */
export const BCRYPT_COST_FACTOR = 12;

export function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, BCRYPT_COST_FACTOR);
}

export function verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
