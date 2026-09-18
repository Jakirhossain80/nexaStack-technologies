import { z } from 'zod';

/**
 * Local to apps/api by design — packages/shared/CLAUDE.md section 5: "Define a schema
 * here that only one app uses — keep it local to that app instead." Only this API ever
 * validates a submission status value; the web admin UI's toggle button sends one of these
 * two fixed literals, never a form a user types into.
 */
export const SUBMISSION_STATUSES = ['new', 'responded'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES, {
    error: 'Please choose a valid status: new or responded',
  }),
});

/** Shared by GET /enquiries and GET /quotations — both the dashboard's "content requiring
 * attention" section (status=new&limit=5) and the quick-action links (status=new) reuse
 * this same query shape rather than needing a separate endpoint. */
export const submissionListQuerySchema = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { error: 'must be a valid id' }),
});

/** GET /api/v1/admin/activity/recent?limit= — the dashboard's compact feed. Default (5)
 * matches the "5 most recent" the attention list also uses, so the dashboard's two feeds
 * read consistently. */
export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
});
