import {
  ERROR_CODES,
  MEDIA_TYPE,
  mediaDocumentMetadataSchema,
  mediaImageMetadataSchema,
  type MediaAdmin,
  type MediaDeleteInput,
  type MediaUsageAdmin,
  type Paginated,
  type ValidationIssue,
} from '@nexastack/shared';
import type { Types } from 'mongoose';
import type { ZodError } from 'zod';

import { adminEmailsById } from '../lib/adminEmails.js';
import { getCloudinaryConfig } from '../lib/cloudinaryEnv.js';
import { AppError, NotFoundError, ServiceUnavailableError, ValidationError } from '../lib/errors.js';
import { skipFor, toPaginated } from '../lib/listQuery.js';
import { logger } from '../lib/logger.js';
import {
  destroyMediaAsset,
  resourceTypeFor,
  uploadMediaAsset,
  type UploadedMediaAsset,
} from '../lib/mediaCloudinary.js';
import { buildMediaFilter, type MediaFilter } from '../lib/mediaQuery.js';
import {
  sanitizeFilename,
  validateMediaFile,
  type ValidatedMediaFile,
} from '../lib/uploadValidation.js';
import { Media, type MediaDocument } from '../models/Media.js';
import { type AdminActionContext, logAdminAction } from './adminActivityLog.service.js';
import { describeUsageBlock, findMediaUsage, repointPostsToMedia } from './mediaUsage.service.js';

export type { MediaFilter } from '../lib/mediaQuery.js';

const NOT_FOUND_MESSAGE = 'This file was not found. It may have been removed.';

type MediaLean = MediaDocument & { _id: Types.ObjectId };

function toMediaAdmin(doc: MediaLean, emails: Map<string, string>): MediaAdmin {
  return {
    id: String(doc._id),
    filename: doc.filename,
    mediaType: doc.mediaType as MediaAdmin['mediaType'],
    url: doc.url,
    cloudinaryPublicId: doc.cloudinaryPublicId,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    width: doc.width ?? null,
    height: doc.height ?? null,
    altText: doc.altText ?? undefined,
    description: doc.description ?? undefined,
    uploadedByEmail: emails.get(String(doc.uploadedByAdminId)) ?? null,
    createdAt: (doc.createdAt as Date).toISOString(),
    replacedAt: doc.replacedAt ? doc.replacedAt.toISOString() : null,
  };
}

async function present(docs: MediaLean[]): Promise<MediaAdmin[]> {
  const emails = await adminEmailsById(docs.map((doc) => String(doc.uploadedByAdminId)));
  return docs.map((doc) => toMediaAdmin(doc, emails));
}

/** Zod issues on a request field, as the API's field-level validation details. */
function toValidationError(error: ZodError): ValidationError {
  const details: ValidationIssue[] = error.issues.map((issue) => ({
    location: 'body',
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
  return new ValidationError(details);
}

/**
 * The descriptive field a file of this type takes, validated: alt text for an image (REQUIRED, so an
 * unlabelled image never gets in), an optional description for a document. Runs before anything is
 * sent to Cloudinary.
 */
function parseDescriptor(
  mediaType: ValidatedMediaFile['mediaType'],
  fields: Record<string, string | undefined>,
): { altText?: string; description?: string } {
  if (mediaType === MEDIA_TYPE.IMAGE) {
    const parsed = mediaImageMetadataSchema.safeParse({ altText: fields.altText });
    if (!parsed.success) throw toValidationError(parsed.error);
    return { altText: parsed.data.altText };
  }

  const parsed = mediaDocumentMetadataSchema.safeParse({ description: fields.description });
  if (!parsed.success) throw toValidationError(parsed.error);
  return parsed.data.description ? { description: parsed.data.description } : {};
}

function requireCloudinary() {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new ServiceUnavailableError(
      'File storage is not set up on this server yet. Ask the site owner to configure Cloudinary.',
    );
  }
  return config;
}

/** Uploads, mapping any Cloudinary failure to a safe 503 (the detail goes to the log, not the client). */
async function uploadOrFail(
  bytes: Uint8Array,
  filename: string,
  file: ValidatedMediaFile,
  config: ReturnType<typeof requireCloudinary>,
): Promise<UploadedMediaAsset> {
  try {
    return await uploadMediaAsset(bytes, filename, file, config);
  } catch (err) {
    logger.error({ err }, 'Media upload to Cloudinary failed');
    throw new ServiceUnavailableError(
      'The file could not be uploaded right now. Nothing was saved. Please try again shortly.',
    );
  }
}

/** Best-effort removal of an asset we uploaded but could not record. Never throws. */
async function discardUpload(asset: UploadedMediaAsset, config: ReturnType<typeof requireCloudinary>) {
  try {
    await destroyMediaAsset(asset.resourceType, asset.publicId, config);
  } catch (err) {
    logger.error(
      { err, publicId: asset.publicId },
      'Could not remove an uploaded asset after a failed save; it is orphaned in Cloudinary',
    );
  }
}

export async function listMedia(
  filter: MediaFilter,
  page: number,
  limit: number,
): Promise<Paginated<MediaAdmin>> {
  const mongoFilter = buildMediaFilter(filter);
  const [docs, total] = await Promise.all([
    Media.find(mongoFilter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skipFor(page, limit))
      .limit(limit)
      .lean<MediaLean[]>(),
    Media.countDocuments(mongoFilter),
  ]);
  return toPaginated(await present(docs), total, page, limit);
}

export async function getMedia(id: string): Promise<MediaAdmin> {
  const doc = await Media.findById(id).lean<MediaLean>();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);
  const [item] = await present([doc]);
  return item as MediaAdmin;
}

export interface UploadInput {
  bytes: Uint8Array;
  originalName: string;
  /** Text fields from the form: `altText` (images) or `description` (documents). */
  fields: Record<string, string | undefined>;
}

/**
 * Order matters: (1) the file, on its real bytes; (2) the alt text / description for THAT type;
 * only then (3) storage is contacted. So a missing alt text is a 400 before Cloudinary sees a byte.
 */
export async function uploadMedia(input: UploadInput, context: AdminActionContext): Promise<MediaAdmin> {
  const file = validateMediaFile(input.bytes);
  const descriptor = parseDescriptor(file.mediaType, input.fields);
  const config = requireCloudinary();

  const filename = sanitizeFilename(input.originalName, file.extension);
  const asset = await uploadOrFail(input.bytes, filename, file, config);

  let created: MediaLean;
  try {
    created = (
      await Media.create({
        filename,
        mediaType: file.mediaType,
        cloudinaryPublicId: asset.publicId,
        url: asset.url,
        mimeType: file.mimeType,
        sizeBytes: asset.bytes,
        ...(asset.width !== null ? { width: asset.width } : {}),
        ...(asset.height !== null ? { height: asset.height } : {}),
        ...descriptor,
        uploadedByAdminId: context.adminId,
      })
    ).toObject() as MediaLean;
  } catch (err) {
    // The file is in Cloudinary but there is no record of it: remove it rather than leave an orphan.
    await discardUpload(asset, config);
    throw err;
  }

  await logAdminAction(context, 'media_uploaded', {
    mediaId: String(created._id),
    filename,
    mediaType: file.mediaType,
    mimeType: file.mimeType,
    sizeBytes: asset.bytes,
    publicId: asset.publicId,
  });

  const [item] = await present([created]);
  return item as MediaAdmin;
}

export interface UpdateInput {
  altText?: string | undefined;
  description?: string | undefined;
}

/**
 * Edits the descriptive text. An image keeps its REQUIRED alt text (it can be changed, never blanked);
 * a document's description is optional and can be cleared. Sending the other type's field is refused
 * rather than silently ignored.
 */
export async function updateMedia(
  id: string,
  input: UpdateInput,
  context: AdminActionContext,
): Promise<MediaAdmin> {
  const doc = await Media.findById(id).lean<MediaLean>();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);

  let changed: 'altText' | 'description';
  let update: Record<string, unknown>;

  if (doc.mediaType === MEDIA_TYPE.IMAGE) {
    if (input.description !== undefined) {
      throw new ValidationError([
        { location: 'body', path: 'description', message: 'An image is described by its alt text, not a description.' },
      ]);
    }
    const parsed = mediaImageMetadataSchema.safeParse({ altText: input.altText });
    if (!parsed.success) throw toValidationError(parsed.error);
    changed = 'altText';
    update = { $set: { altText: parsed.data.altText } };
  } else {
    if (input.altText !== undefined) {
      throw new ValidationError([
        { location: 'body', path: 'altText', message: 'A document has a description, not alt text.' },
      ]);
    }
    const parsed = mediaDocumentMetadataSchema.safeParse({ description: input.description ?? '' });
    if (!parsed.success) throw toValidationError(parsed.error);
    changed = 'description';
    update = parsed.data.description
      ? { $set: { description: parsed.data.description } }
      : { $unset: { description: '' } };
  }

  await Media.updateOne({ _id: id }, update);
  await logAdminAction(context, 'media_updated', { mediaId: id, filename: doc.filename, field: changed });
  return getMedia(id);
}

export interface ReplaceInput {
  bytes: Uint8Array;
  originalName: string;
  /** Also permanently delete the previous Cloudinary file. Off unless the admin opted in. */
  deleteOld: boolean;
}

export type OldFileOutcome = 'kept' | 'deleted' | 'delete-failed';

export interface ReplaceResult {
  media: MediaAdmin;
  oldFile: OldFileOutcome;
  /**
   * How many blog posts that use this item as their cover now point at the new file, or null if that
   * update failed (in which case the old file is kept, so those posts keep working).
   */
  postsUpdated: number | null;
}

/**
 * Swaps the underlying file, keeping the record's `_id` and its alt text / description. The new file
 * must be the same kind (an image replaces an image). Records that reference the item by id follow the
 * new file: today, blog posts using it as their cover are repointed. Content that merely hardcodes the
 * URL (config files, page components) does NOT follow.
 *
 * The old Cloudinary file is KEPT unless the admin ticked the box, because anything that hardcodes its
 * URL would otherwise break. Even when they did, it is deleted only AFTER the posts have been repointed
 * successfully, so a failed repoint can never leave a post pointing at a deleted file. Either way the old
 * public id goes to the audit log.
 */
export async function replaceMedia(
  id: string,
  input: ReplaceInput,
  context: AdminActionContext,
): Promise<ReplaceResult> {
  const doc = await Media.findById(id).lean<MediaLean>();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);

  const file = validateMediaFile(input.bytes);
  if (file.mediaType !== doc.mediaType) {
    throw new ValidationError([
      {
        location: 'body',
        path: 'file',
        message: `This is ${doc.mediaType === MEDIA_TYPE.IMAGE ? 'an image' : 'a document'}, so it can only be replaced with ${doc.mediaType === MEDIA_TYPE.IMAGE ? 'another image' : 'another document'}.`,
      },
    ]);
  }

  // A blog cover is rendered through next/image, which does not serve SVG, so a post's cover image
  // cannot be swapped for one.
  if (file.mimeType === 'image/svg+xml' && doc.mimeType !== 'image/svg+xml') {
    const usage = await findMediaUsage(id);
    if (usage.blogPosts.length > 0) {
      throw new ValidationError([
        {
          location: 'body',
          path: 'file',
          message: `This image is the cover of ${usage.blogPosts.length} blog ${usage.blogPosts.length === 1 ? 'post' : 'posts'}, and an SVG can't be a cover. Choose a JPG, PNG or WebP instead.`,
        },
      ]);
    }
  }
  const config = requireCloudinary();

  const filename = sanitizeFilename(input.originalName, file.extension);
  const asset = await uploadOrFail(input.bytes, filename, file, config);

  // Conditional on the file we started from, so a concurrent replace is not silently overwritten.
  let updated;
  try {
    updated = await Media.updateOne(
      { _id: id, cloudinaryPublicId: doc.cloudinaryPublicId },
      {
        $set: {
          filename,
          cloudinaryPublicId: asset.publicId,
          url: asset.url,
          mimeType: file.mimeType,
          sizeBytes: asset.bytes,
          width: asset.width,
          height: asset.height,
          replacedAt: new Date(),
        },
      },
    );
  } catch (err) {
    await discardUpload(asset, config);
    throw err;
  }
  if (updated.modifiedCount !== 1) {
    await discardUpload(asset, config);
    throw new AppError(
      409,
      ERROR_CODES.CONFLICT,
      'This file was changed by someone else while you were replacing it. Reload the page and try again.',
    );
  }

  // Posts that use this item as their cover keep a snapshot of its URL: point them at the new file.
  let postsUpdated: number | null;
  try {
    postsUpdated = await repointPostsToMedia(id, asset.url);
  } catch (err) {
    logger.error({ err, mediaId: id }, 'Could not repoint blog posts to the replaced file');
    postsUpdated = null;
  }

  let oldFile: OldFileOutcome = 'kept';
  // Only remove the old file if nothing can still be pointing at it.
  if (input.deleteOld && postsUpdated !== null) {
    try {
      await destroyMediaAsset(resourceTypeFor(doc.mediaType as MediaAdmin['mediaType']), doc.cloudinaryPublicId, config);
      oldFile = 'deleted';
    } catch (err) {
      logger.error({ err, publicId: doc.cloudinaryPublicId }, 'Could not delete the replaced file');
      oldFile = 'delete-failed';
    }
  }

  await logAdminAction(context, 'media_replaced', {
    mediaId: id,
    filename,
    previousFilename: doc.filename,
    oldPublicId: doc.cloudinaryPublicId,
    oldUrl: doc.url,
    newPublicId: asset.publicId,
    oldFile,
    postsUpdated,
    oldDeleteSkipped: input.deleteOld && postsUpdated === null,
  });
  return { media: await getMedia(id), oldFile, postsUpdated };
}

/** The real references to an item (blog cover images), for the media detail page and the delete dialog. */
export async function getMediaUsage(id: string): Promise<MediaUsageAdmin> {
  if (!(await Media.exists({ _id: id }))) throw new NotFoundError(NOT_FOUND_MESSAGE);
  return findMediaUsage(id);
}

export interface DeleteResult {
  deleted: true;
  /** What Cloudinary reported: the file was removed, or was already gone. */
  cloudinary: 'deleted' | 'not-found';
}

/**
 * Permanent. The typed file name must equal the record's EXACTLY (checked here, not only in the UI),
 * so a stray click or a scripted call cannot delete on its own. The Cloudinary asset is deleted first
 * (with CDN invalidation); if that fails nothing is removed, so it can be retried. Only then is the
 * record deleted. The audit entry says exactly what went.
 *
 * `referencesReported` / `referencesAcknowledged` are what the admin saw in the best-effort scan (which
 * runs in apps/web, the only place that can see the site's config). They are recorded, not enforced:
 * this API cannot verify them.
 */
export async function deleteMedia(
  id: string,
  input: MediaDeleteInput,
  context: AdminActionContext,
): Promise<DeleteResult> {
  const doc = await Media.findById(id).lean<MediaLean>();
  if (!doc) throw new NotFoundError(NOT_FOUND_MESSAGE);

  // A REAL reference (a post that stores this item's id) blocks deletion outright: this is a certainty,
  // not the best-effort hint, so it is checked first and no typed confirmation can override it. The
  // check and the delete are not one transaction, so a post could pick the image in the instant between
  // them; the window is small and the consequence is a broken cover, not data loss.
  const usage = await findMediaUsage(id);
  if (usage.blogPosts.length > 0) {
    throw new AppError(409, ERROR_CODES.CONFLICT, describeUsageBlock(usage));
  }

  if (input.confirmFilename !== doc.filename) {
    throw new ValidationError([
      {
        location: 'body',
        path: 'confirmFilename',
        message: 'The file name you typed does not match. Nothing was deleted.',
      },
    ]);
  }

  const config = requireCloudinary();

  let outcome: DeleteResult['cloudinary'];
  try {
    outcome = await destroyMediaAsset(
      resourceTypeFor(doc.mediaType as MediaAdmin['mediaType']),
      doc.cloudinaryPublicId,
      config,
    );
  } catch (err) {
    logger.error({ err, mediaId: id }, 'Media delete failed at Cloudinary');
    throw new ServiceUnavailableError(
      'The file could not be deleted from storage right now, so nothing was removed. Please try again shortly.',
    );
  }

  await Media.deleteOne({ _id: id });

  await logAdminAction(context, 'media_deleted', {
    mediaId: id,
    filename: doc.filename,
    mediaType: doc.mediaType,
    publicId: doc.cloudinaryPublicId,
    url: doc.url,
    sizeBytes: doc.sizeBytes,
    cloudinary: outcome,
    referencesReported: input.referencesReported ?? 0,
    referencesAcknowledged: input.referencesAcknowledged ?? false,
  });

  return { deleted: true, cloudinary: outcome };
}
