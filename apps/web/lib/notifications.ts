/**
 * The one place the web app's "tell the firm about a new submission" hook lives. Contact and
 * Quotation used to carry identical, separate copies of an empty
 * `if (process.env.RESEND_API_KEY) {}` block; both now call this module.
 *
 * DEFERRED, on purpose. No transactional email provider has been chosen (root CLAUDE.md 22 item 4:
 * Resend / Postmark / Brevo), so nothing is sent even if the key appears. This module's job today
 * is to be the single seam to fill in later, and to make the hook observable meanwhile: in
 * development it logs one line per submission so the flow can be tested end to end without an
 * inbox. `apps/api/src/lib/mailer.ts` is the equivalent seam for the API (password reset); the two
 * apps share no runtime code, so there is one module per app rather than one for both.
 *
 * Call it only AFTER the submission has been persisted, and never let it throw into the caller: a
 * failed notification must never lose or fail an enquiry.
 *
 * Privacy: logs identifiers and the subject only, never the sender's name, email or message.
 */

const isProduction = process.env.NODE_ENV === 'production';

type NotificationKind = 'contact.received' | 'quotation.received';

function deliver(kind: NotificationKind, fields: Record<string, string>): void {
  try {
    // TODO(CLAUDE.md section 22 item 4): send the notification to the firm, and a confirmation to
    // the sender, once a provider is chosen. Do it here so every caller gets it.
    if (process.env.RESEND_API_KEY) {
      // Deferred: no provider is configured yet, so nothing is sent even if this var appears.
    }

    if (isProduction) {
      console.info(JSON.stringify({ event: kind, ...fields, delivery: 'deferred' }));
    } else {
      console.info(
        `[notifications] ${kind} — no email provider configured, nothing sent (development log)`,
        fields,
      );
    }
  } catch (err) {
    console.error(`[notifications] ${kind} hook failed`, err);
  }
}

export function notifyContactSubmission(submission: { id: string; subject: string }): void {
  // The subject is sender-supplied, so it is shown only outside production.
  deliver(
    'contact.received',
    isProduction ? { id: submission.id } : { id: submission.id, subject: submission.subject },
  );
}

export function notifyQuotationSubmission(submission: { referenceNumber: string }): void {
  deliver('quotation.received', { referenceNumber: submission.referenceNumber });
}
