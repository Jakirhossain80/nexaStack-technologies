import { z } from 'zod';

/**
 * Where a Contact enquiry is in the reply workflow. Archiving is a separate, orthogonal flag on
 * the enquiry (`archived`), not a fifth status: an enquiry can be archived from any of these.
 *
 * - `new`       never opened by an admin. Set by the system only (at submission); it is never a
 *               target of a manual change, because opening the detail page marks it `read` and a
 *               manual "back to new" would flip straight back on the next refresh.
 * - `read`      opened, no follow-up recorded yet.
 * - `contacted` the sender has been replied to or called.
 * - `closed`    finished.
 *
 * The status strings are written here and nowhere else.
 */
export const ENQUIRY_STATUS = {
  NEW: 'new',
  READ: 'read',
  CONTACTED: 'contacted',
  CLOSED: 'closed',
} as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUS)[keyof typeof ENQUIRY_STATUS];

/** Every status, in workflow order. For enums (Zod, Mongoose) and select options. */
export const ENQUIRY_STATUSES = [
  ENQUIRY_STATUS.NEW,
  ENQUIRY_STATUS.READ,
  ENQUIRY_STATUS.CONTACTED,
  ENQUIRY_STATUS.CLOSED,
] as const;

// Compile-time guard: fails to typecheck if a status is added to ENQUIRY_STATUS but not listed
// in ENQUIRY_STATUSES.
type MissingFromList = Exclude<EnquiryStatus, (typeof ENQUIRY_STATUSES)[number]>;
const assertAllStatusesListed: [MissingFromList] extends [never] ? true : never = true;
void assertAllStatusesListed;

export const enquiryStatusSchema = z.enum(ENQUIRY_STATUSES, {
  error: 'Please choose a valid status: new, read, contacted or closed',
});

/**
 * The single source of truth for which manual status changes are allowed. The API enforces it (a
 * disallowed change is a 409) and the admin UI renders its buttons from it, so they cannot
 * disagree. A record keyed by every status, so adding a status without deciding its transitions
 * fails to typecheck. The automatic `new -> read` on opening is done by the API directly and is
 * deliberately not in this table.
 */
export const ENQUIRY_STATUS_TRANSITIONS: Readonly<Record<EnquiryStatus, readonly EnquiryStatus[]>> =
  {
    [ENQUIRY_STATUS.NEW]: [ENQUIRY_STATUS.READ, ENQUIRY_STATUS.CONTACTED, ENQUIRY_STATUS.CLOSED],
    [ENQUIRY_STATUS.READ]: [ENQUIRY_STATUS.CONTACTED, ENQUIRY_STATUS.CLOSED],
    [ENQUIRY_STATUS.CONTACTED]: [ENQUIRY_STATUS.CLOSED, ENQUIRY_STATUS.READ],
    [ENQUIRY_STATUS.CLOSED]: [ENQUIRY_STATUS.READ, ENQUIRY_STATUS.CONTACTED],
  };

export function canTransitionEnquiry(from: EnquiryStatus, to: EnquiryStatus): boolean {
  return ENQUIRY_STATUS_TRANSITIONS[from].includes(to);
}

/** The statuses reachable from `from`, in the order the buttons should appear. */
export function getAvailableEnquiryTransitions(from: EnquiryStatus): readonly EnquiryStatus[] {
  return ENQUIRY_STATUS_TRANSITIONS[from];
}

/**
 * Statuses that still need the admin's attention: opened or not, but no follow-up recorded. Used
 * (together with "not archived") by the dashboard's "requiring attention" list.
 */
export const ENQUIRY_ATTENTION_STATUSES = [ENQUIRY_STATUS.NEW, ENQUIRY_STATUS.READ] as const;
