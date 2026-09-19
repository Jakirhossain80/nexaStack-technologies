import { ENQUIRY_STATUS, ENQUIRY_STATUSES, type EnquiryStatus } from '@nexastack/shared';
import mongoose from 'mongoose';

import { escapeRegex } from './listQuery.js';

/**
 * Pure helpers for Contact-enquiry queries. Kept apart from `adminEnquiries.service.ts` (which
 * writes audit entries and therefore needs the environment) so they can be unit-tested on their own.
 */

/** The filter shared by the list and the export, so they can never disagree. */
export interface EnquiryFilter {
  q?: string | undefined;
  status?: EnquiryStatus[] | undefined;
  archived: boolean;
}

/**
 * Tolerates data written before `scripts/migrate-enquiry-status.ts` ran: the old toggle stored
 * `responded`, which meant "I replied", i.e. `contacted`. Anything unrecognised reads as `new`
 * (never silently `closed`) so it stays visible for the admin to triage.
 */
export function normalizeStatus(raw: string): EnquiryStatus {
  if (raw === 'responded') return ENQUIRY_STATUS.CONTACTED;
  return (ENQUIRY_STATUSES as readonly string[]).includes(raw)
    ? (raw as EnquiryStatus)
    : ENQUIRY_STATUS.NEW;
}

/**
 * The Mongo filter for a list/export. `sanitizeFilter` is on for this project, so `$ne`/`$in`
 * need `mongoose.trusted` (every operand here is a constant or an enum-validated value, never raw
 * user input). Active view is `archived: { $ne: true }`, not `archived: false`, so a legacy row
 * without the field still counts as active.
 */
export function buildEnquiryFilter(filter: EnquiryFilter): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {
    archived: filter.archived ? true : mongoose.trusted({ $ne: true }),
  };

  if (filter.status && filter.status.length > 0) {
    mongoFilter.status =
      filter.status.length === 1 ? filter.status[0] : mongoose.trusted({ $in: filter.status });
  }

  if (filter.q) {
    // Literal, case-insensitive substring match: search terms are never interpreted as a pattern.
    const pattern = new RegExp(escapeRegex(filter.q), 'i');
    mongoFilter.$or = [
      { fullName: pattern },
      { email: pattern },
      { subject: pattern },
      { message: pattern },
    ];
  }

  return mongoFilter;
}
