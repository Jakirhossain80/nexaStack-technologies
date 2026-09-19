import { z } from 'zod';

/**
 * Local to apps/api by design — packages/shared/CLAUDE.md section 5: "Define a schema
 * here that only one app uses — keep it local to that app instead." Params and query shapes
 * shared by the admin routers. (The old two-state submission status schemas lived here until
 * Enquiry and Quotation Management replaced them with their own status enums.)
 */
export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { error: 'must be a valid id' }),
});

/** GET /api/v1/admin/activity/recent?limit= — the dashboard's compact feed. Default (5)
 * matches the "5 most recent" the attention list also uses, so the dashboard's two feeds
 * read consistently. */
export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
});
