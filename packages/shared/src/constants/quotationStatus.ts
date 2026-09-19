import { z } from 'zod';

/**
 * Where a quotation request is in the sales pipeline. Archiving is a separate, orthogonal flag on
 * the request (`archived`), not another status: a request can be archived from any of these.
 *
 * DRAFT enum, pending confirmation by the founder.
 *
 * - `new`        never looked at. Set by the system at submission.
 * - `reviewing`  the founder is working out scope and price (also where legacy `responded` maps).
 * - `quote-sent` a quotation has been sent to the client.
 * - `accepted`   the client accepted.
 * - `declined`   either side decided not to proceed.
 * - `closed`     finished for any other reason (no reply, out of scope, work delivered).
 *
 * Unlike Contact enquiries there is NO automatic change when a request is opened: opening a request
 * is not the same as starting to review it, and a GET with a side effect was not asked for. So `new`
 * is a valid manual target (an accidental move can be undone).
 *
 * The status strings are written here and nowhere else.
 */
export const QUOTATION_STATUS = {
  NEW: 'new',
  REVIEWING: 'reviewing',
  QUOTE_SENT: 'quote-sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CLOSED: 'closed',
} as const;

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];

/** Every status, in pipeline order. For enums (Zod, Mongoose) and select options. */
export const QUOTATION_STATUSES = [
  QUOTATION_STATUS.NEW,
  QUOTATION_STATUS.REVIEWING,
  QUOTATION_STATUS.QUOTE_SENT,
  QUOTATION_STATUS.ACCEPTED,
  QUOTATION_STATUS.DECLINED,
  QUOTATION_STATUS.CLOSED,
] as const;

// Compile-time guard: fails to typecheck if a status is added to QUOTATION_STATUS but not listed
// in QUOTATION_STATUSES.
type MissingFromList = Exclude<QuotationStatus, (typeof QUOTATION_STATUSES)[number]>;
const assertAllStatusesListed: [MissingFromList] extends [never] ? true : never = true;
void assertAllStatusesListed;

export const quotationStatusSchema = z.enum(QUOTATION_STATUSES, {
  error:
    'Please choose a valid status: new, reviewing, quote-sent, accepted, declined or closed',
});

/**
 * The single source of truth for which manual status changes are allowed. The API enforces it (a
 * disallowed change is a 409) and the admin UI renders its buttons from it, so they cannot
 * disagree. A record keyed by every status, so adding a status without deciding its transitions
 * fails to typecheck.
 */
export const QUOTATION_STATUS_TRANSITIONS: Readonly<
  Record<QuotationStatus, readonly QuotationStatus[]>
> = {
  [QUOTATION_STATUS.NEW]: [
    QUOTATION_STATUS.REVIEWING,
    QUOTATION_STATUS.DECLINED,
    QUOTATION_STATUS.CLOSED,
  ],
  [QUOTATION_STATUS.REVIEWING]: [
    QUOTATION_STATUS.QUOTE_SENT,
    QUOTATION_STATUS.DECLINED,
    QUOTATION_STATUS.CLOSED,
    QUOTATION_STATUS.NEW,
  ],
  [QUOTATION_STATUS.QUOTE_SENT]: [
    QUOTATION_STATUS.ACCEPTED,
    QUOTATION_STATUS.DECLINED,
    QUOTATION_STATUS.REVIEWING,
    QUOTATION_STATUS.CLOSED,
  ],
  [QUOTATION_STATUS.ACCEPTED]: [QUOTATION_STATUS.CLOSED, QUOTATION_STATUS.QUOTE_SENT],
  [QUOTATION_STATUS.DECLINED]: [QUOTATION_STATUS.REVIEWING, QUOTATION_STATUS.CLOSED],
  [QUOTATION_STATUS.CLOSED]: [QUOTATION_STATUS.REVIEWING],
};

export function canTransitionQuotation(from: QuotationStatus, to: QuotationStatus): boolean {
  return QUOTATION_STATUS_TRANSITIONS[from].includes(to);
}

/** The statuses reachable from `from`, in the order the buttons should appear. */
export function getAvailableQuotationTransitions(
  from: QuotationStatus,
): readonly QuotationStatus[] {
  return QUOTATION_STATUS_TRANSITIONS[from];
}

/**
 * Statuses that still need the founder's action: not yet looked at, or being worked on with no quote
 * sent. Used (together with "not archived") by the dashboard's "requiring attention" list. The
 * dashboard's "New quotation requests" card counts `new` only.
 */
export const QUOTATION_ATTENTION_STATUSES = [
  QUOTATION_STATUS.NEW,
  QUOTATION_STATUS.REVIEWING,
] as const;
