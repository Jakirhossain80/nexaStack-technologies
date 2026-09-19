import {
  PROJECT_TYPE_OPTIONS,
  QUOTATION_STATUS,
  QUOTATION_STATUSES,
  type QuotationStatus,
} from '@nexastack/shared';
import mongoose from 'mongoose';

import { escapeRegex } from './listQuery.js';

/**
 * Pure helpers for quotation-request queries. Kept apart from `adminQuotations.service.ts` (which
 * writes audit entries and therefore needs the environment) so they can be unit-tested on their own.
 */

/** The filter shared by the list and the export, so they can never disagree. */
export interface QuotationFilter {
  q?: string | undefined;
  status?: QuotationStatus[] | undefined;
  archived: boolean;
  projectType?: string | undefined;
}

/** The old two-state toggle's "I replied" value, written before the migration. */
const LEGACY_RESPONDED = 'responded';

/**
 * Tolerates data written before `scripts/migrate-quotation-status.ts` ran: the old toggle stored
 * `responded`, meaning "I replied", which is `reviewing` here (it does not claim a quote was sent).
 * Anything unrecognised reads as `new` (never silently `closed`) so it stays visible for triage.
 */
export function normalizeStatus(raw: string): QuotationStatus {
  if (raw === LEGACY_RESPONDED) return QUOTATION_STATUS.REVIEWING;
  return (QUOTATION_STATUSES as readonly string[]).includes(raw)
    ? (raw as QuotationStatus)
    : QUOTATION_STATUS.NEW;
}

/** Stored values a filter on `status` must match: `reviewing` also covers un-migrated `responded`. */
function storedStatusesFor(statuses: readonly QuotationStatus[]): string[] {
  const stored = new Set<string>(statuses);
  if (stored.has(QUOTATION_STATUS.REVIEWING)) stored.add(LEGACY_RESPONDED);
  return [...stored];
}

/**
 * The Mongo filter for a list/export. `sanitizeFilter` is on for this project, so `$ne`/`$in`
 * need `mongoose.trusted` (every operand here is a constant or an enum-validated value, never raw
 * user input). Active view is `archived: { $ne: true }`, not `archived: false`, so a legacy row
 * without the field still counts as active.
 */
export function buildQuotationFilter(filter: QuotationFilter): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {
    archived: filter.archived ? true : mongoose.trusted({ $ne: true }),
  };

  if (filter.status && filter.status.length > 0) {
    const stored = storedStatusesFor(filter.status);
    mongoFilter.status = stored.length === 1 ? stored[0] : mongoose.trusted({ $in: stored });
  }

  if (filter.projectType) {
    mongoFilter.projectType = filter.projectType;
  }

  if (filter.q) {
    // Literal, case-insensitive substring match: search terms are never interpreted as a pattern.
    const pattern = new RegExp(escapeRegex(filter.q), 'i');
    const clauses: Record<string, unknown>[] = [
      { fullName: pattern },
      { email: pattern },
      { companyName: pattern },
      { referenceNumber: pattern },
      { businessObjectives: pattern },
      { projectType: pattern },
    ];

    // The database holds the project type's value ("web-application"), but people search by what
    // they see ("web application"), so also match the types whose display label matches.
    const labelMatches = PROJECT_TYPE_OPTIONS.filter((option) => pattern.test(option.label)).map(
      (option) => option.value,
    );
    if (labelMatches.length > 0) {
      clauses.push({ projectType: mongoose.trusted({ $in: labelMatches }) });
    }

    mongoFilter.$or = clauses;
  }

  return mongoFilter;
}
