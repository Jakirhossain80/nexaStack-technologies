import { isProduction } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Deferred email hook — same pattern as the Contact/Quotation routes' own TODOs (root
 * CLAUDE.md 22 item 4: no transactional email provider chosen yet). Nothing is actually sent.
 *
 * Development-only exception to "never log a raw secret": Fork 1 of the Admin Authentication
 * task explicitly asks for the reset link to be logged server-side in development, so the
 * self-service reset flow is genuinely testable end-to-end without real email. This is a
 * deliberate, scoped exception — hard-gated behind `!isProduction`, never the production path.
 */
export function sendPasswordResetEmail(email: string, resetLink: string): void {
  // TODO(root CLAUDE.md 22 item 4): send a real email once a transactional provider (Resend /
  // Postmark / Brevo) is chosen. The token is already persisted before this is called — a
  // failed or missing email must never lose the reset request itself.
  if (process.env.RESEND_API_KEY) {
    // Deferred: no provider is configured yet, so nothing is sent even if this var appears.
  }

  logger.info({ event: 'password_reset.requested', email }, 'Password reset requested — no email provider configured yet');

  if (!isProduction) {
    // Development-only: makes the reset link visible without a real inbox. Never do this in
    // production, where the only way to obtain the link should be the (currently unbuilt) email.
    logger.info({ event: 'password_reset.link_dev_only', resetLink }, 'Password reset link (development only — never logged in production)');
  }
}
