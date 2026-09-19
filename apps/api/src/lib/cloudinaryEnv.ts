import { env } from '../config/env.js';

import type { CloudinaryConfig } from './cloudinary.js';

/**
 * The Cloudinary credentials from the environment, or null if any is unset (the API still runs; a
 * feature that needs Cloudinary then answers with a clear 503 instead of pretending to work). Kept
 * apart from `cloudinary.ts` and `mediaCloudinary.ts` so those stay pure and testable without the
 * environment.
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}
