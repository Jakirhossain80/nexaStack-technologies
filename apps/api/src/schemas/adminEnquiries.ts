import { emptyToUndefined, enquiryStatusSchema, paginationQuerySchema } from '@nexastack/shared';
import { z } from 'zod';

/**
 * Query schemas for `/api/v1/admin/enquiries`. Local to apps/api by design
 * (packages/shared/CLAUDE.md section 5): the web admin only builds these URLs, it never validates
 * them with a schema. The list and the export take the SAME filter, so a CSV always contains
 * exactly the rows the list shows for those params.
 */

/** `status=read` or `status=new,read`. A comma list lets the dashboard ask for "needs attention". */
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
        .array(enquiryStatusSchema, { error: 'Please choose valid statuses: new, read, contacted or closed' })
        .min(1)
        .max(4),
    )
    .optional(),
);

const filterShape = {
  q: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, { error: 'Search text must be 100 characters or fewer' }).optional(),
  ),
  status: statusFilter,
  // `false` (the default) is the active working view; `true` shows ONLY archived enquiries.
  archived: z
    .preprocess(emptyToUndefined, z.enum(['true', 'false'], { error: 'archived must be true or false' }).default('false'))
    .transform((value) => value === 'true'),
};

export const enquiryExportQuerySchema = z.object(filterShape);

export const enquiryListQuerySchema = paginationQuerySchema.extend(filterShape);
