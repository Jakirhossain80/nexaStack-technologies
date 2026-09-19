import {
  ATTACHMENT_MAX_FILES,
  PROJECT_TYPE_OPTIONS,
  emptyToUndefined,
  paginationQuerySchema,
  quotationStatusSchema,
} from '@nexastack/shared';
import { z } from 'zod';

/**
 * Query and param schemas for `/api/v1/admin/quotations`. Local to apps/api by design
 * (packages/shared/CLAUDE.md section 5): the web admin only builds these URLs, it never validates
 * them with a schema. The list and the export take the SAME filter, so a CSV always contains
 * exactly the rows the list shows for those params.
 */

/** `status=reviewing` or `status=new,reviewing`. A comma list lets the dashboard ask for "needs attention". */
const statusFilter = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .transform((raw) =>
      raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(quotationStatusSchema, {
          error:
            'Please choose valid statuses: new, reviewing, quote-sent, accepted, declined or closed',
        })
        .min(1)
        .max(6),
    )
    .optional(),
);

const PROJECT_TYPE_VALUES = PROJECT_TYPE_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

const filterShape = {
  q: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, { error: 'Search text must be 100 characters or fewer' }).optional(),
  ),
  status: statusFilter,
  projectType: z.preprocess(
    emptyToUndefined,
    z.enum(PROJECT_TYPE_VALUES, { error: 'Please choose a valid project type' }).optional(),
  ),
  // `false` (the default) is the active working view; `true` shows ONLY archived requests.
  archived: z
    .preprocess(
      emptyToUndefined,
      z.enum(['true', 'false'], { error: 'archived must be true or false' }).default('false'),
    )
    .transform((value) => value === 'true'),
};

export const quotationExportQuerySchema = z.object(filterShape);

export const quotationListQuerySchema = paginationQuerySchema.extend(filterShape);

/** `/:id/attachments/:attachmentId` — the position in the request's attachment list. */
export const attachmentParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { error: 'must be a valid id' }),
  // Digits only, parsed explicitly: `z.coerce.number()` would read '' or ' ' as 0 and '0x1' as 1.
  attachmentId: z
    .string({ error: 'attachmentId must be a number' })
    .regex(/^\d{1,2}$/, { error: 'attachmentId must be a whole number, 0 or more' })
    .transform(Number)
    .pipe(z.number().max(ATTACHMENT_MAX_FILES - 1, { error: 'That attachment does not exist' })),
});
