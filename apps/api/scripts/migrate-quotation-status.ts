// Run manually, once, by the founder: `pnpm --filter api run migrate-quotations`.
//
// Brings existing quotation requests in line with the Quotation Management data model:
//   1. status `responded` (the old two-state toggle: "I replied") becomes `reviewing`;
//   2. rows that predate the `archived` flag get `archived: false, archivedAt: null`;
//   3. rows that predate `notes` get `notes: []`.
// `responded` maps to `reviewing`, deliberately NOT `quote-sent`: the old toggle meant "I replied",
// which does not prove a quote was sent. Any OTHER unexpected `status` value is REPORTED and never
// rewritten: guessing at unknown data would be worse than leaving it visible for the founder.
//
// Idempotent: a second run finds nothing to change and says so. Uses the native driver on the
// underlying collection (not the Mongoose model) so the old values, which the new enum no longer
// allows, can be read and rewritten without validation getting in the way.
//
// The application does not depend on this having run: queries treat a missing `archived` as
// "active", a missing `notes` as empty, and `responded` is read as `reviewing`, and a
// `status=reviewing` filter also matches `responded` (adminQuotations.service.ts).
//
// It does NOT touch attachments. That is a separate, deliberately manual step:
// `scripts/migrate-quotation-attachments.ts`.

import { QUOTATION_STATUSES } from '@nexastack/shared';
import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';
import { QuotationSubmission } from '../src/models/QuotationSubmission.js';

async function countsByStatus(): Promise<Record<string, number>> {
  const rows = await QuotationSubmission.collection
    .aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
}

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  try {
    const collection = QuotationSubmission.collection;
    const before = await countsByStatus();
    logger.info({ statuses: before }, 'Quotation statuses before migration');

    const responded = await collection.updateMany(
      { status: 'responded' },
      { $set: { status: 'reviewing' } },
    );
    const archived = await collection.updateMany(
      { archived: { $exists: false } },
      { $set: { archived: false, archivedAt: null } },
    );
    const notes = await collection.updateMany(
      { notes: { $exists: false } },
      { $set: { notes: [] } },
    );

    const after = await countsByStatus();
    const unexpected = Object.keys(after).filter(
      (status) => !(QUOTATION_STATUSES as readonly string[]).includes(status),
    );

    logger.info(
      {
        respondedToReviewing: responded.modifiedCount,
        archivedFieldAdded: archived.modifiedCount,
        notesFieldAdded: notes.modifiedCount,
        statuses: after,
      },
      responded.modifiedCount + archived.modifiedCount + notes.modifiedCount === 0
        ? 'Nothing to migrate: the data is already up to date.'
        : 'Quotation migration complete.',
    );

    if (unexpected.length > 0) {
      logger.warn(
        { unexpected: unexpected.map((status) => ({ status, count: after[status] })) },
        'Some quotation requests have a status outside the new enum. They were NOT changed; review them by hand.',
      );
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Quotation migration failed.');
  process.exitCode = 1;
});
