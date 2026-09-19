// Moves ALREADY-SUBMITTED quotation attachments from public Cloudinary delivery to
// `authenticated` delivery, and rewrites the stored URLs to match.
//
//   pnpm --filter api run migrate-quotation-attachments             # DRY RUN (default): changes nothing
//   pnpm --filter api run migrate-quotation-attachments -- --apply  # performs the move
//
// WHY. Before Quotation Management, uploads were stored with Cloudinary's default `type=upload`:
// a public URL that never expires and needs no login. New uploads are now `authenticated`; this
// script fixes the ones that already exist. It does NOT delete anything.
//
// HOW. For each attachment whose stored URL is a recognised upload of this site's own pipeline
// (see `parseStoredAttachmentUrl`; anything else is reported and left alone), it renames the
// Cloudinary asset to a new public id with `to_type=authenticated` (Cloudinary does not allow a
// type-only rename to keep the same id, hence the `-auth` suffix), confirms the asset now exists as
// `authenticated`, and only then rewrites that one array element in MongoDB. A copy that already
// exists (an earlier run that moved the file but was interrupted before the database update) is
// detected and only the database is fixed. Idempotent: a second run reports nothing to do. A failure
// on one attachment is reported and does not stop the others; the database is never changed for an
// attachment whose move could not be confirmed.
//
// The rename moves the asset, so the old public URL stops working: that is the point. Anyone who
// had saved it will get a 404.
//
// Needs CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in apps/api/.env (the
// same account apps/web uploads to). Run the dry run first and read it.
//
// NOT YET RUN against a live account: written against Cloudinary's documented rename API, but the
// account credentials are not available in the development environment. Try it on a test account or
// a single record first.

import mongoose from 'mongoose';

import { env } from '../src/config/env.js';
import {
  canonicalAttachmentUrl,
  fetchAssetMetadata,
  parseStoredAttachmentUrl,
  signCloudinaryParams,
  type CloudinaryAssetRef,
  type CloudinaryConfig,
} from '../src/lib/cloudinary.js';
import { logger } from '../src/lib/logger.js';
import { QuotationSubmission } from '../src/models/QuotationSubmission.js';

const APPLY = process.argv.includes('--apply');
const NEW_ID_SUFFIX = '-auth';

interface Tally {
  requests: number;
  attachments: number;
  alreadyAuthenticated: number;
  unrecognised: number;
  moved: number;
  databaseOnlyFixed: number;
  wouldMove: number;
  failed: number;
}

function cloudinaryConfig(): CloudinaryConfig {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must all be set in apps/api/.env.',
    );
  }
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}

/** Signed `rename` call. Returns the new version Cloudinary reports, or null if it reports none. */
async function renameToAuthenticated(
  ref: CloudinaryAssetRef,
  toPublicId: string,
  config: CloudinaryConfig,
): Promise<{ version: string | null }> {
  const params: Record<string, string | number> = {
    from_public_id: ref.publicId,
    to_public_id: toPublicId,
    type: ref.type,
    to_type: 'authenticated',
    timestamp: Math.floor(Date.now() / 1000),
  };
  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([name, value]) => [name, String(value)])),
    api_key: config.apiKey,
    signature: signCloudinaryParams(params, config.apiSecret),
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${ref.resourceType}/rename`,
    { method: 'POST', body, signal: AbortSignal.timeout(30_000) },
  );
  if (!response.ok) {
    throw new Error(`Cloudinary rename failed with status ${response.status}`);
  }
  const data = (await response.json()) as { version?: unknown };
  return { version: typeof data.version === 'number' ? String(data.version) : null };
}

async function main(): Promise<void> {
  const config = cloudinaryConfig();
  await mongoose.connect(env.MONGODB_URI);

  const tally: Tally = {
    requests: 0,
    attachments: 0,
    alreadyAuthenticated: 0,
    unrecognised: 0,
    moved: 0,
    databaseOnlyFixed: 0,
    wouldMove: 0,
    failed: 0,
  };

  try {
    logger.info(
      { mode: APPLY ? 'APPLY' : 'DRY RUN (nothing will be changed)' },
      'Quotation attachment migration starting',
    );

    const collection = QuotationSubmission.collection;
    const cursor = collection.find(
      { attachments: { $exists: true, $ne: [] } },
      { projection: { referenceNumber: 1, attachments: 1 } },
    );

    for await (const doc of cursor) {
      const attachments = (doc.attachments ?? []) as string[];
      if (attachments.length === 0) continue;
      tally.requests += 1;

      for (const [index, stored] of attachments.entries()) {
        tally.attachments += 1;
        const where = { referenceNumber: doc.referenceNumber, attachment: index + 1 };

        const ref = parseStoredAttachmentUrl(stored, config.cloudName);
        if (!ref) {
          tally.unrecognised += 1;
          logger.warn(where, 'Not a recognised NexaStack upload: left untouched (and not downloadable).');
          continue;
        }
        if (ref.type === 'authenticated') {
          tally.alreadyAuthenticated += 1;
          continue;
        }

        const newRef: CloudinaryAssetRef = {
          ...ref,
          type: 'authenticated',
          publicId: `${ref.publicId}${NEW_ID_SUFFIX}`,
        };

        if (!APPLY) {
          tally.wouldMove += 1;
          logger.info(where, 'Would move to authenticated delivery.');
          continue;
        }

        try {
          // An earlier interrupted run may already have moved the file: then only the DB is stale.
          const alreadyThere = await fetchAssetMetadata(newRef, config);
          let version = newRef.version;
          if (!alreadyThere) {
            const renamed = await renameToAuthenticated(ref, newRef.publicId, config);
            version = renamed.version;
            const confirmed = await fetchAssetMetadata(newRef, config);
            if (!confirmed) throw new Error('The moved file could not be confirmed as authenticated');
          }

          const newUrl = canonicalAttachmentUrl(config.cloudName, { ...newRef, version });
          const updated = await collection.updateOne(
            { _id: doc._id, attachments: stored },
            { $set: { 'attachments.$': newUrl } },
          );
          if (updated.modifiedCount !== 1) {
            throw new Error('The request changed while migrating; the database was not updated');
          }

          if (alreadyThere) tally.databaseOnlyFixed += 1;
          else tally.moved += 1;
          logger.info(where, 'Moved to authenticated delivery and database updated.');
        } catch (err) {
          tally.failed += 1;
          logger.error({ ...where, err: err instanceof Error ? err.message : String(err) }, 'Could not migrate this attachment; it was left as it was.');
        }
      }
    }

    logger.info(
      tally,
      tally.requests === 0
        ? 'No quotation requests have attachments: nothing to migrate.'
        : APPLY
          ? 'Attachment migration finished.'
          : 'Dry run finished. Nothing was changed. Re-run with --apply to perform the move.',
    );
    if (tally.failed > 0 || tally.unrecognised > 0) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Attachment migration failed.');
  process.exitCode = 1;
});
