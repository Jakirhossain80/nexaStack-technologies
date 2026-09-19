// Run manually, once, by the founder: `pnpm --filter api run migrate-admin-users`.
//
// Brings existing admin accounts in line with the Admin Roles data model:
//   1. accounts with no `status` become `active`;
//   2. accounts with no `mustChangePassword` get `false` (they chose their own password long ago).
// Any account whose `status` is something OTHER than `active` / `suspended` is REPORTED and never
// rewritten: guessing at unknown data would be worse than leaving it visible.
//
// Idempotent: a second run finds nothing to change and says so. Uses the native driver on the
// underlying collection (not the Mongoose model) so old documents can be read exactly as stored.
//
// The application does not depend on this having run: a MISSING status is read as active and a missing
// `mustChangePassword` as false (lib/sessionAccess.ts, and every count uses `status: { $ne: 'suspended' }`).
// It exists so the stored data says what the code assumes, and so a query written later in the plain
// `status: 'active'` way cannot silently exclude the founder's account.
//
// It finishes by checking that at least one ACTIVE super_admin exists and warns loudly if not.

import { ADMIN_STATUSES } from '@nexastack/shared';
import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';
import { AdminUser } from '../src/models/AdminUser.js';

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  try {
    const collection = AdminUser.collection;

    const statusAdded = await collection.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } },
    );
    const flagAdded = await collection.updateMany(
      { mustChangePassword: { $exists: false } },
      { $set: { mustChangePassword: false } },
    );

    const unexpected = await collection
      .find({ status: { $nin: [...ADMIN_STATUSES] } }, { projection: { email: 1, status: 1 } })
      .toArray();
    const activeSuperAdmins = await collection.countDocuments({ role: 'super_admin', status: 'active' });

    logger.info(
      {
        statusAdded: statusAdded.modifiedCount,
        mustChangePasswordAdded: flagAdded.modifiedCount,
        activeSuperAdmins,
      },
      statusAdded.modifiedCount + flagAdded.modifiedCount === 0
        ? 'Nothing to migrate: the data is already up to date.'
        : 'Admin user migration complete.',
    );

    if (unexpected.length > 0) {
      logger.warn(
        { accounts: unexpected.map((doc) => ({ email: doc.email, status: doc.status })) },
        'Some accounts have a status outside the new enum. They were NOT changed; review them by hand.',
      );
      process.exitCode = 1;
    }
    if (activeSuperAdmins === 0) {
      logger.warn(
        'There is NO active super_admin account. Nobody can create or manage accounts until one is seeded or repaired by hand.',
      );
      process.exitCode = 1;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Admin user migration failed.');
  process.exitCode = 1;
});
