import {
  MEDIA_ALT_TEXT_MAX,
  MEDIA_ALT_TEXT_MIN,
  MEDIA_DESCRIPTION_MAX,
  MEDIA_FILENAME_MAX,
  MEDIA_TYPE,
  MEDIA_TYPES,
} from '@nexastack/shared';
import mongoose, { type InferSchemaType, type Model } from 'mongoose';

// See AdminUser.ts's comment: named imports from 'mongoose' don't reliably resolve under
// Node's raw ESM loader in this pure-Node project.
const { Schema, model, models } = mongoose;

/**
 * A Media Library item: a public image or document stored in Cloudinary. This API is the only
 * writer; nothing else on the site references these records yet (every existing page hardcodes its
 * image URLs), so replacing or deleting an item affects only whoever adopts the library later.
 *
 * Images and documents are described differently on purpose:
 *  - `altText` is REQUIRED for an image (root CLAUDE.md 15): it stands in for the picture. It is
 *    enforced here as well as by the shared Zod schema, so an unlabelled image cannot be stored.
 *  - `description` is OPTIONAL and belongs to a document. A document has no `alt`; a link to it is
 *    described by its visible link text.
 *
 * `url` is public and safe to publish. `cloudinaryPublicId` is what deletion and the best-effort
 * "is this used?" scan work from.
 */
const mediaSchema = new Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: MEDIA_FILENAME_MAX },
    mediaType: { type: String, required: true, enum: MEDIA_TYPES },
    cloudinaryPublicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },

    altText: {
      type: String,
      trim: true,
      minlength: MEDIA_ALT_TEXT_MIN,
      maxlength: MEDIA_ALT_TEXT_MAX,
      required: [
        function requiredForImages(this: { mediaType?: string }): boolean {
          return this.mediaType === MEDIA_TYPE.IMAGE;
        },
        'Alt text is required for an image',
      ],
    },
    description: { type: String, trim: true, maxlength: MEDIA_DESCRIPTION_MAX },

    uploadedByAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    replacedAt: { type: Date, default: null },
  },
  { collection: 'media', timestamps: { createdAt: true, updatedAt: false } },
);

mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ mediaType: 1, createdAt: -1 });

export type MediaDocument = InferSchemaType<typeof mediaSchema>;

// Explicit Model<T> on both sides of `??` — see AdminUser.ts's comment for why.
export const Media =
  (models.Media as Model<MediaDocument> | undefined) ?? model<MediaDocument>('Media', mediaSchema);
