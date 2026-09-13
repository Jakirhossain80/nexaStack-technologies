import { z } from 'zod';

/**
 * Publication status for blog posts, projects and other managed content.
 *
 * The status strings are written here and nowhere else. Call sites use the named members
 * (`CONTENT_STATUS.PUBLISHED`) and the `ContentStatus` type — never a string literal.
 * There is deliberately no scheduled state.
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

/** Every status, in workflow order. For enums (Zod, Mongoose) and select options. */
export const CONTENT_STATUSES = [
  CONTENT_STATUS.DRAFT,
  CONTENT_STATUS.PUBLISHED,
  CONTENT_STATUS.ARCHIVED,
] as const;

// Compile-time guard: fails to typecheck if a status is added to CONTENT_STATUS but not listed
// in CONTENT_STATUSES.
type MissingFromList = Exclude<ContentStatus, (typeof CONTENT_STATUSES)[number]>;
const assertAllStatusesListed: [MissingFromList] extends [never] ? true : never = true;
void assertAllStatusesListed;

export const contentStatusSchema = z.enum(CONTENT_STATUSES, {
  error: 'Please choose a valid status: draft, published or archived',
});
