import { z } from 'zod';

import { enquiryStatusSchema } from '../constants/enquiryStatus.js';

/**
 * Contact-enquiry management (admin). Used by the note form and the status control in `apps/web`
 * and by `apps/api`'s `/api/v1/admin/enquiries/*` routes, which are the security boundary. The
 * list/export query schema is API-only and lives in `apps/api` (packages/shared/CLAUDE.md).
 */

export const ENQUIRY_NOTE_MAX = 2000;
/** Notes are append-only; this stops one enquiry's document growing without bound. */
export const ENQUIRY_NOTES_MAX = 200;

export const enquiryNoteSchema = z.object({
  text: z
    .string({ error: 'Please write a note' })
    .trim()
    .min(1, { error: 'Please write a note before adding it' })
    .max(ENQUIRY_NOTE_MAX, {
      error: `Please keep the note to ${ENQUIRY_NOTE_MAX.toLocaleString('en-US')} characters or fewer`,
    }),
});

/** `PATCH /:id/status`: the requested status. Whether the change is allowed from the current
 * status is checked by the service against `ENQUIRY_STATUS_TRANSITIONS`, not here. */
export const enquiryStatusChangeSchema = z.object({
  status: enquiryStatusSchema,
});
