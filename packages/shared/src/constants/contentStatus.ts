import { z } from 'zod';

/**
 * Publication status for blog posts, projects and other managed content.
 *
 * The status strings are written here and nowhere else. Call sites use the named members
 * (`CONTENT_STATUS.PUBLISHED`) and the `ContentStatus` type — never a string literal.
 * There is deliberately no scheduled state.
 *
 * - `draft`       never published.
 * - `published`   live on the public site.
 * - `unpublished` was live and has been deliberately taken down. Keeps its original
 *                 `publishedAt`, and can be published again.
 * - `archived`    retired. Hidden from active lists by default; can be restored to a draft.
 */
export const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
  ARCHIVED: 'archived',
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

/** Every status, in workflow order. For enums (Zod, Mongoose) and select options. */
export const CONTENT_STATUSES = [
  CONTENT_STATUS.DRAFT,
  CONTENT_STATUS.PUBLISHED,
  CONTENT_STATUS.UNPUBLISHED,
  CONTENT_STATUS.ARCHIVED,
] as const;

// Compile-time guard: fails to typecheck if a status is added to CONTENT_STATUS but not listed
// in CONTENT_STATUSES.
type MissingFromList = Exclude<ContentStatus, (typeof CONTENT_STATUSES)[number]>;
const assertAllStatusesListed: [MissingFromList] extends [never] ? true : never = true;
void assertAllStatusesListed;

export const contentStatusSchema = z.enum(CONTENT_STATUSES, {
  error: 'Please choose a valid status: draft, published, unpublished or archived',
});

/**
 * The single source of truth for which status changes are allowed. The API enforces it (a
 * disallowed change is a 409) and the admin UI renders its action buttons from it, so the two
 * cannot disagree. A record keyed by every status, so adding a status without deciding its
 * transitions fails to typecheck.
 */
export const CONTENT_STATUS_TRANSITIONS: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  [CONTENT_STATUS.DRAFT]: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED],
  [CONTENT_STATUS.PUBLISHED]: [CONTENT_STATUS.UNPUBLISHED, CONTENT_STATUS.ARCHIVED],
  [CONTENT_STATUS.UNPUBLISHED]: [CONTENT_STATUS.PUBLISHED, CONTENT_STATUS.ARCHIVED],
  [CONTENT_STATUS.ARCHIVED]: [CONTENT_STATUS.DRAFT],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return CONTENT_STATUS_TRANSITIONS[from].includes(to);
}

/** The statuses reachable from `from`, in the order the action buttons should appear. */
export function getAvailableTransitions(from: ContentStatus): readonly ContentStatus[] {
  return CONTENT_STATUS_TRANSITIONS[from];
}
