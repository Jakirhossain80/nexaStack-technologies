import { z } from 'zod';

/** Publication status for blog posts, projects and other managed content. */
export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;

export const contentStatusSchema = z.enum(CONTENT_STATUSES, {
  error: 'Please choose a valid status: draft, published or archived',
});

export type ContentStatus = (typeof CONTENT_STATUSES)[number];
