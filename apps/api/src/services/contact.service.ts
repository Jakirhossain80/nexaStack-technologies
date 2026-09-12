import type { ContactInput } from '@nexastack/shared';

export interface ContactSubmissionResult {
  received: true;
}

/**
 * Handle a validated contact enquiry. Business logic only: never touches req, res or next.
 *
 * TODO(contact): implement per apps/api/CLAUDE.md section 8 —
 *   1. verify the Cloudflare Turnstile token server-side (field to be added to contactSchema)
 *   2. persist the enquiry to MongoDB first
 *   3. then send the notification to the firm and the confirmation to the sender
 *      (a failed email must not lose the enquiry)
 */
export async function submitContact(_input: ContactInput): Promise<ContactSubmissionResult> {
  return { received: true };
}
