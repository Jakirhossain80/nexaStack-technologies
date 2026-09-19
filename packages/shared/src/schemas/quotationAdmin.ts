import { z } from 'zod';

import { quotationStatusSchema } from '../constants/quotationStatus.js';

import { ENQUIRY_NOTE_MAX, ENQUIRY_NOTES_MAX, enquiryNoteSchema } from './enquiry.js';

/**
 * Quotation-request management (admin). Used by the note form and status control in `apps/web` and
 * by `apps/api`'s `/api/v1/admin/quotations/*` routes, which are the security boundary. The
 * list/export query schema is API-only and lives in `apps/api` (packages/shared/CLAUDE.md).
 *
 * The internal-note rules are identical to the enquiry ones, so they are aliased rather than written
 * a second time (root CLAUDE.md 2.4: never duplicate a schema).
 */

export const QUOTATION_NOTE_MAX = ENQUIRY_NOTE_MAX;
export const QUOTATION_NOTES_MAX = ENQUIRY_NOTES_MAX;
export const quotationNoteSchema = enquiryNoteSchema;

/** `PATCH /:id/status`: the requested status. Whether the change is allowed from the current
 * status is checked by the service against `QUOTATION_STATUS_TRANSITIONS`, not here. */
export const quotationStatusChangeSchema = z.object({
  status: quotationStatusSchema,
});
