// Run manually, once, by the founder: `pnpm --filter api run seed-admin`.
//
// Creates the single real AdminUser from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD environment
// variables — never from a public registration form (there isn't one; root CLAUDE.md 22.2
// defers the rest of the admin dashboard, and NexaStack is a solo, founder-led studio with
// exactly one real administrator). Idempotent: if an AdminUser already exists, this exits
// without creating or resetting anything, so running it twice is safe.
//
// Never commit real values for these two variables — .env.example only holds placeholders.

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import { hashPassword } from '../src/lib/password.js';
import { logger } from '../src/lib/logger.js';
import { AdminUser } from '../src/models/AdminUser.js';

const MIN_PASSWORD_LENGTH = 8;

async function main(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    logger.fatal(
      'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must both be set (in apps/api/.env or the shell environment) to run this script.',
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    logger.fatal(`ADMIN_SEED_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(env.MONGODB_URI);

  try {
    const existing = await AdminUser.findOne();
    if (existing) {
      logger.info(
        { existingEmail: existing.email },
        'An AdminUser already exists — seed script is a no-op. Delete the existing account manually first if you really want to re-seed.',
      );
      return;
    }

    const passwordHash = await hashPassword(password);
    // The first account picked its own password, so it is not forced to change it. Every account created
    // after this one is made by a super_admin through `/admin/users` and IS.
    const created = await AdminUser.create({
      email,
      passwordHash,
      role: 'super_admin',
      status: 'active',
      mustChangePassword: false,
    });
    logger.info({ email: created.email, role: created.role }, 'Seeded the admin account.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Seed script failed.');
  process.exitCode = 1;
});
