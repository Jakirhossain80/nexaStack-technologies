/**
 * Proposed defaults, not settled policy — flagged in the Admin Authentication task's own
 * report for adjustment. "Hours, not weeks," per that task's honesty note on rate-limit/expiry
 * numbers, since this guards the entire admin surface.
 */

/** A session (JWT + its backing AdminSession record) is valid for one working day. */
export const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

/** A password-reset link is valid for one hour after it's requested. */
export const PASSWORD_RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;
