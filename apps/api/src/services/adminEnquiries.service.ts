import {
  ENQUIRY_NOTES_MAX,
  ENQUIRY_STATUS,
  ERROR_CODES,
  canTransitionEnquiry,
  type EnquiryAdminDetail,
  type EnquiryAdminSummary,
  type EnquiryNoteAdmin,
  type EnquiryStatus,
  type Paginated,
} from '@nexastack/shared';
import mongoose from 'mongoose';

import { toCsv } from '../lib/csv.js';
import { AppError, ConflictError, NotFoundError } from '../lib/errors.js';
import { buildEnquiryFilter, normalizeStatus, type EnquiryFilter } from '../lib/enquiryQuery.js';
import { skipFor, toPaginated } from '../lib/listQuery.js';
import { AdminUser } from '../models/AdminUser.js';
import { ContactSubmission } from '../models/ContactSubmission.js';
import { type AdminActionContext, logAdminAction } from './adminActivityLog.service.js';

export type { EnquiryFilter } from '../lib/enquiryQuery.js';

/** Above this the export is refused with a clear message rather than building a huge string. */
export const EXPORT_MAX_ROWS = 5_000;

const NOT_FOUND_MESSAGE = 'This enquiry was not found. It may have been removed.';

interface EnquiryRow {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  subject: string;
  message: string;
  preferredContactMethod: string;
  status: string;
  archived?: boolean | null;
  archivedAt?: Date | null;
  createdAt: Date;
  notesCount: number;
}

/**
 * Matching rows, newest first, with a computed `notesCount` and without the notes array itself
 * (which can be large and is not needed to list or export).
 */
async function findRows(
  filter: Record<string, unknown>,
  skip: number,
  limit: number,
): Promise<EnquiryRow[]> {
  return ContactSubmission.aggregate<EnquiryRow>([
    { $match: filter },
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $addFields: { notesCount: { $size: { $ifNull: ['$notes', []] } } } },
    { $project: { notes: 0 } },
  ]);
}

function toSummary(row: EnquiryRow): EnquiryAdminSummary {
  return {
    id: String(row._id),
    fullName: row.fullName,
    email: row.email,
    subject: row.subject,
    status: normalizeStatus(row.status),
    archived: row.archived === true,
    createdAt: row.createdAt.toISOString(),
    notesCount: row.notesCount,
  };
}

export async function listEnquiries(
  filter: EnquiryFilter,
  page: number,
  limit: number,
): Promise<Paginated<EnquiryAdminSummary>> {
  const mongoFilter = buildEnquiryFilter(filter);
  const [rows, total] = await Promise.all([
    findRows(mongoFilter, skipFor(page, limit), limit),
    ContactSubmission.countDocuments(mongoFilter),
  ]);
  return toPaginated(rows.map(toSummary), total, page, limit);
}

/** Notes carry an author id; the UI shows the author's email. A deleted account reads as null. */
async function authorEmails(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  // `trusted`: `sanitizeFilter` would otherwise turn `$in` into `$eq`. The ids are read from our
  // own note subdocuments, never from the request.
  const objectIds = ids.map((value) => new mongoose.Types.ObjectId(value));
  const admins = await AdminUser.find({ _id: mongoose.trusted({ $in: objectIds }) })
    .select('email')
    .lean();
  return new Map(admins.map((admin) => [String(admin._id), admin.email]));
}

async function loadDetail(id: string): Promise<EnquiryAdminDetail> {
  const doc = await ContactSubmission.findById(id).lean();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);

  const notes = doc.notes ?? [];
  const emails = await authorEmails([...new Set(notes.map((note) => String(note.authorAdminId)))]);

  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone ?? undefined,
    companyName: doc.companyName ?? undefined,
    subject: doc.subject,
    message: doc.message,
    preferredContactMethod: doc.preferredContactMethod,
    status: normalizeStatus(doc.status),
    archived: doc.archived === true,
    archivedAt: doc.archivedAt ? doc.archivedAt.toISOString() : null,
    createdAt: (doc.createdAt as Date).toISOString(),
    notesCount: notes.length,
    notes: notes.map(
      (note): EnquiryNoteAdmin => ({
        id: String(note._id),
        text: note.text,
        createdAt: note.createdAt.toISOString(),
        authorEmail: emails.get(String(note.authorAdminId)) ?? null,
      }),
    ),
  };
}

/**
 * Opening an enquiry marks it read. The transition is a single conditional update filtered on
 * `status: 'new'`, so two tabs opening it at once produce exactly one change and one audit entry,
 * and an enquiry that is already read, contacted or closed is never touched. Legacy `responded`
 * rows are not `new`, so they are left alone too.
 */
export async function openEnquiry(
  id: string,
  context: AdminActionContext,
): Promise<EnquiryAdminDetail> {
  const marked = await ContactSubmission.updateOne(
    { _id: id, status: ENQUIRY_STATUS.NEW },
    { $set: { status: ENQUIRY_STATUS.READ } },
  );

  const detail = await loadDetail(id);

  if (marked.modifiedCount === 1) {
    await logAdminAction(context, 'enquiry_marked_read', {
      enquiryId: id,
      from: ENQUIRY_STATUS.NEW,
      to: ENQUIRY_STATUS.READ,
      trigger: 'opened',
    });
  }
  return detail;
}

/** A manual status change. Allowed moves come from the shared `ENQUIRY_STATUS_TRANSITIONS`. */
export async function changeEnquiryStatus(
  id: string,
  next: EnquiryStatus,
  context: AdminActionContext,
): Promise<EnquiryAdminDetail> {
  const doc = await ContactSubmission.findById(id).select('status').lean();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);

  const from = normalizeStatus(doc.status);
  if (!canTransitionEnquiry(from, next)) {
    throw new ConflictError(`This enquiry is ${from}, so it can't be changed to ${next}.`);
  }

  // Conditional on the status we just read, so a concurrent change is a 409, not a silent overwrite.
  const result = await ContactSubmission.updateOne(
    { _id: id, status: doc.status },
    { $set: { status: next } },
  );
  if (result.modifiedCount !== 1) {
    throw new ConflictError('This enquiry was changed by someone else. Reload the page and try again.');
  }

  await logAdminAction(context, 'enquiry_status_changed', {
    enquiryId: id,
    from,
    to: next,
    trigger: 'manual',
  });
  return loadDetail(id);
}

/** Append-only. Logs the note's id and length, never its text (the text already lives on the enquiry). */
export async function addEnquiryNote(
  id: string,
  text: string,
  context: AdminActionContext,
): Promise<EnquiryAdminDetail> {
  const current = await ContactSubmission.findById(id).select('notes').lean();
  if (!current) throw new NotFoundError(NOT_FOUND_MESSAGE);
  if ((current.notes?.length ?? 0) >= ENQUIRY_NOTES_MAX) {
    throw new ConflictError(`An enquiry can hold at most ${ENQUIRY_NOTES_MAX} notes.`);
  }

  const noteId = new mongoose.Types.ObjectId();
  await ContactSubmission.updateOne(
    { _id: id },
    {
      $push: {
        notes: { _id: noteId, authorAdminId: context.adminId, text, createdAt: new Date() },
      },
    },
  );

  await logAdminAction(context, 'enquiry_note_added', {
    enquiryId: id,
    noteId: String(noteId),
    length: text.length,
  });
  return loadDetail(id);
}

/** Idempotent: archiving an archived enquiry changes and logs nothing. Status is left alone. */
export async function setEnquiryArchived(
  id: string,
  archived: boolean,
  context: AdminActionContext,
): Promise<EnquiryAdminDetail> {
  const filter = archived
    ? { _id: id, archived: mongoose.trusted({ $ne: true }) }
    : { _id: id, archived: true };
  const update = archived
    ? { $set: { archived: true, archivedAt: new Date() } }
    : { $set: { archived: false, archivedAt: null } };

  const result = await ContactSubmission.updateOne(filter, update);

  if (result.modifiedCount === 1) {
    await logAdminAction(context, archived ? 'enquiry_archived' : 'enquiry_unarchived', {
      enquiryId: id,
    });
  }
  return loadDetail(id);
}

const CSV_HEADER = [
  'id',
  'submittedAt',
  'status',
  'archived',
  'fullName',
  'email',
  'phone',
  'companyName',
  'preferredContactMethod',
  'subject',
  'message',
  'notesCount',
] as const;

export interface EnquiryExport {
  csv: string;
  rowCount: number;
}

/**
 * A CSV of EXACTLY the rows the list shows for the same filter (same `buildEnquiryFilter`).
 * Internal notes are deliberately not exported. Logs the export with the active filter.
 */
export async function exportEnquiries(
  filter: EnquiryFilter,
  context: AdminActionContext,
): Promise<EnquiryExport> {
  const mongoFilter = buildEnquiryFilter(filter);

  const total = await ContactSubmission.countDocuments(mongoFilter);
  if (total > EXPORT_MAX_ROWS) {
    throw new AppError(
      413,
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      `${total.toLocaleString('en-US')} enquiries match, which is more than the ${EXPORT_MAX_ROWS.toLocaleString('en-US')} an export can hold. Narrow the search or filters and try again.`,
    );
  }

  const rows = await findRows(mongoFilter, 0, EXPORT_MAX_ROWS);
  const csv = toCsv(
    CSV_HEADER,
    rows.map((row) => [
      String(row._id),
      row.createdAt.toISOString(),
      normalizeStatus(row.status),
      row.archived === true ? 'true' : 'false',
      row.fullName,
      row.email,
      row.phone ?? '',
      row.companyName ?? '',
      row.preferredContactMethod,
      row.subject,
      row.message,
      String(row.notesCount),
    ]),
  );

  await logAdminAction(context, 'enquiry_exported', {
    filter: { q: filter.q ?? null, status: filter.status ?? null, archived: filter.archived },
    rowCount: rows.length,
  });
  return { csv, rowCount: rows.length };
}
