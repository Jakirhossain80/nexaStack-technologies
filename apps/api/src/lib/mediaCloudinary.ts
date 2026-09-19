import { randomBytes } from 'node:crypto';

import { MEDIA_MAX_DIMENSION, MEDIA_TYPE, type MediaType } from '@nexastack/shared';

import { signCloudinaryParams, type CloudinaryConfig } from './cloudinary.js';
import type { ValidatedMediaFile } from './uploadValidation.js';

/**
 * Cloudinary access for the Media Library, from `fetch` and `node:crypto` (no SDK, no dependency).
 * Reuses only the request-signing primitive and config shape from `./cloudinary.ts` (the quotation
 * attachment module, left untouched).
 *
 * Unlike quotation attachments, these are PUBLIC marketing assets: delivery type `upload`, plain
 * `res.cloudinary.com` URLs, no signing needed to view them.
 *
 * Optimisation uses Cloudinary's own features, not an image library:
 *  - at upload, a raster image is capped at `MEDIA_MAX_DIMENSION` on either side (`c_limit`: only
 *    ever scaled DOWN, never enlarged) so a 6000px export is not stored at full size;
 *  - at delivery, the URL carries `f_auto,q_auto`, so each visitor gets the best format (AVIF/WebP)
 *    and a sensible quality automatically. Other sizes are made on demand by adding `w_…`.
 * SVG is left as is (a vector has nothing to resize or re-encode), and a PDF is stored untouched.
 */

export const MEDIA_FOLDER = 'nexastack/media';

/** Incoming transformation, applied once before the original is stored. */
export const RASTER_UPLOAD_TRANSFORMATION = `c_limit,w_${MEDIA_MAX_DIMENSION},h_${MEDIA_MAX_DIMENSION}`;

/** Delivery transformation baked into a raster image's stored URL. */
export const RASTER_DELIVERY_TRANSFORMATION = 'f_auto,q_auto';

export type MediaResourceType = 'image' | 'raw';

/** Images (including SVG) are Cloudinary `image` assets; a PDF is `raw`, stored untouched. */
export function resourceTypeFor(mediaType: MediaType): MediaResourceType {
  return mediaType === MEDIA_TYPE.IMAGE ? 'image' : 'raw';
}

/**
 * Our own random public id, so nothing depends on Cloudinary's generated one (and a raw file gets
 * its `.pdf`, which Cloudinary requires in a raw public id). 96 bits of randomness.
 */
export function newMediaPublicId(file: Pick<ValidatedMediaFile, 'mediaType' | 'extension'>): string {
  const random = randomBytes(12).toString('hex');
  return file.mediaType === MEDIA_TYPE.DOCUMENT
    ? `${MEDIA_FOLDER}/${random}.${file.extension}`
    : `${MEDIA_FOLDER}/${random}`;
}

export interface MediaUrlParts {
  resourceType: MediaResourceType;
  publicId: string;
  version: number;
  /** `svg` is the only image format that needs its extension in the URL. */
  extension: ValidatedMediaFile['extension'];
}

/** The public delivery URL stored on the record and copied by the admin. */
export function buildMediaUrl(cloudName: string, parts: MediaUrlParts): string {
  const base = `https://res.cloudinary.com/${cloudName}/${parts.resourceType}/upload`;
  if (parts.resourceType === 'raw') return `${base}/v${parts.version}/${parts.publicId}`;
  if (parts.extension === 'svg') return `${base}/v${parts.version}/${parts.publicId}.svg`;
  return `${base}/${RASTER_DELIVERY_TRANSFORMATION}/v${parts.version}/${parts.publicId}`;
}

export interface UploadedMediaAsset {
  publicId: string;
  resourceType: MediaResourceType;
  url: string;
  bytes: number;
  width: number | null;
  height: number | null;
}

interface UploadResponse {
  public_id?: unknown;
  version?: unknown;
  bytes?: unknown;
  width?: unknown;
  height?: unknown;
  resource_type?: unknown;
  type?: unknown;
}

/** The exact request parameters and signature for an upload. Pure, so the signing can be tested. */
export function buildUploadParams(
  publicId: string,
  file: Pick<ValidatedMediaFile, 'mediaType' | 'extension'>,
  config: CloudinaryConfig,
  timestamp: number,
): Record<string, string> {
  const params: Record<string, string | number> = { public_id: publicId, timestamp };
  // Only a raster image is resized; SVG and PDF are stored as they are.
  if (file.mediaType === MEDIA_TYPE.IMAGE && file.extension !== 'svg') {
    params.transformation = RASTER_UPLOAD_TRANSFORMATION;
  }
  const signature = signCloudinaryParams(params, config.apiSecret);
  return {
    ...Object.fromEntries(Object.entries(params).map(([name, value]) => [name, String(value)])),
    api_key: config.apiKey,
    signature,
  };
}

/**
 * Uploads a validated file as a public asset and returns what the record needs. Throws on any
 * failure (network, non-2xx, or a response that is not what was asked for); the caller turns that
 * into a safe message and never stores a record for a failed upload.
 */
export async function uploadMediaAsset(
  bytes: Uint8Array,
  filename: string,
  file: ValidatedMediaFile,
  config: CloudinaryConfig,
): Promise<UploadedMediaAsset> {
  const publicId = newMediaPublicId(file);
  const resourceType = resourceTypeFor(file.mediaType);
  const params = buildUploadParams(publicId, file, config, Math.floor(Date.now() / 1000));

  const form = new FormData();
  form.append(
    'file',
    new Blob([bytes as Uint8Array<ArrayBuffer>], { type: file.mimeType }),
    filename,
  );
  for (const [name, value] of Object.entries(params)) form.append(name, value);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) },
  );
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as UploadResponse;

  // Never record something as public that Cloudinary did not store as we asked.
  if (data.type !== 'upload' || data.resource_type !== resourceType) {
    throw new Error('Cloudinary stored the upload with an unexpected type');
  }
  if (data.public_id !== publicId || typeof data.version !== 'number') {
    throw new Error('Cloudinary returned an unexpected upload response');
  }

  return {
    publicId,
    resourceType,
    url: buildMediaUrl(config.cloudName, {
      resourceType,
      publicId,
      version: data.version,
      extension: file.extension,
    }),
    bytes: typeof data.bytes === 'number' ? data.bytes : bytes.byteLength,
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
  };
}

export type DestroyOutcome = 'deleted' | 'not-found';

/**
 * Permanently deletes an asset. `invalidate` also purges CDN copies, because Cloudinary documents
 * that a deleted asset can otherwise keep being served from cache. `not found` means it is already
 * gone, which is what the caller wanted, so it is not an error. Anything else throws.
 */
export async function destroyMediaAsset(
  resourceType: MediaResourceType,
  publicId: string,
  config: CloudinaryConfig,
): Promise<DestroyOutcome> {
  const params: Record<string, string | number> = {
    invalidate: 'true',
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const body = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([name, value]) => [name, String(value)])),
    api_key: config.apiKey,
    signature: signCloudinaryParams(params, config.apiSecret),
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/destroy`,
    { method: 'POST', body, signal: AbortSignal.timeout(30_000) },
  );
  if (!response.ok) {
    throw new Error(`Cloudinary destroy failed with status ${response.status}`);
  }

  const data = (await response.json()) as { result?: unknown };
  if (data.result === 'ok') return 'deleted';
  if (data.result === 'not found') return 'not-found';
  throw new Error(`Cloudinary destroy returned an unexpected result: ${String(data.result)}`);
}

/**
 * Whether an asset still exists in Cloudinary, from the Admin API (not from the CDN, which can
 * serve a cached copy after a delete). True/false when Cloudinary answers clearly, null when it
 * cannot be determined. Never throws.
 */
export async function mediaAssetExists(
  resourceType: MediaResourceType,
  publicId: string,
  config: CloudinaryConfig,
): Promise<boolean | null> {
  const basic = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/${resourceType}/upload/${publicId}`,
      { headers: { Authorization: `Basic ${basic}` }, signal: AbortSignal.timeout(10_000) },
    );
    if (response.ok) return true;
    if (response.status === 404) return false;
    return null;
  } catch {
    return null;
  }
}
