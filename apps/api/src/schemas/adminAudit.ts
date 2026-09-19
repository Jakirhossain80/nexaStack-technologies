import { ADMIN_EVENT_TYPES, emptyToUndefined, paginationQuerySchema } from '@nexastack/shared';
import { z } from 'zod';

/**
 * `GET /api/v1/auth/activity`: the audit view's query. Local to apps/api (packages/shared/CLAUDE.md
 * section 5): the web admin only builds these URLs.
 *
 * `from` and `to` are calendar dates (`YYYY-MM-DD`, from `<input type="date">`), read as days in
 * Asia/Dhaka and both inclusive (see `lib/auditDates.ts`). A malformed or impossible date (2026-02-31)
 * is rejected rather than silently rolled over.
 */

const isRealDate = (value: string): boolean =>
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const dateParam = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Use a date like 2026-09-19' })
    .refine(isRealDate, { error: 'That date does not exist' })
    .optional(),
);

export const auditLogQuerySchema = paginationQuerySchema
  .extend({
    limit: z.coerce
      .number({ error: 'Limit must be a number' })
      .int({ error: 'Limit must be a whole number' })
      .min(1, { error: 'Limit must be at least 1' })
      .max(100, { error: 'Limit must be 100 or fewer' })
      .default(50),
    event: z.preprocess(
      emptyToUndefined,
      z.enum(ADMIN_EVENT_TYPES, { error: 'Please choose a valid event type' }).optional(),
    ),
    from: dateParam,
    to: dateParam,
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    error: 'The "from" date must be on or before the "to" date',
    path: ['from'],
  });
