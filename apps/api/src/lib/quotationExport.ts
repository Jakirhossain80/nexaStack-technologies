import {
  BUDGET_RANGE_OPTIONS,
  MAINTENANCE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  REQUIRED_SERVICE_OPTIONS,
} from '@nexastack/shared';

import { toCsv } from './csv.js';
import { normalizeStatus } from './quotationQuery.js';

/**
 * The quotation CSV: one flat row per request, short pipeline columns only. Long free-text answers,
 * internal notes and attachment URLs are deliberately NOT here (attachments appear as a COUNT).
 * Pure, so the escaping can be tested with hostile values without a database.
 */

export const QUOTATION_CSV_HEADER = [
  'referenceNumber',
  'submittedAt',
  'status',
  'archived',
  'fullName',
  'email',
  'telephone',
  'companyName',
  'country',
  'projectType',
  'requiredServices',
  'budgetRange',
  'preferredStartDate',
  'targetCompletionDate',
  'maintenanceRequired',
  'attachmentCount',
  'notesCount',
] as const;

export interface QuotationCsvRow {
  referenceNumber: string;
  createdAt: Date;
  status: string;
  archived?: boolean | null;
  fullName: string;
  email: string;
  telephone: string;
  companyName?: string | null;
  country: string;
  projectType: string;
  requiredServices: readonly string[];
  budgetRange: string;
  preferredStartDate: string;
  targetCompletionDate?: string | null;
  maintenanceRequired: string;
  attachmentCount: number;
  notesCount: number;
}

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Enum values are written as the labels the admin sees; anything unrecognised is kept as stored. */
export function buildQuotationCsv(rows: readonly QuotationCsvRow[]): string {
  return toCsv(
    QUOTATION_CSV_HEADER,
    rows.map((row) => [
      row.referenceNumber,
      row.createdAt.toISOString(),
      normalizeStatus(row.status),
      row.archived === true ? 'true' : 'false',
      row.fullName,
      row.email,
      row.telephone,
      row.companyName ?? '',
      row.country,
      labelFor(PROJECT_TYPE_OPTIONS, row.projectType),
      row.requiredServices.map((value) => labelFor(REQUIRED_SERVICE_OPTIONS, value)).join('; '),
      labelFor(BUDGET_RANGE_OPTIONS, row.budgetRange),
      row.preferredStartDate,
      row.targetCompletionDate ?? '',
      labelFor(MAINTENANCE_OPTIONS, row.maintenanceRequired),
      String(row.attachmentCount),
      String(row.notesCount),
    ]),
  );
}
