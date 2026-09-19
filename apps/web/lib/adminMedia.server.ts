import type { MediaAdmin, MediaUsageAdmin, Paginated } from '@nexastack/shared';

import { forwardedRead, type AdminReadResult } from '@/lib/adminForward.server';

/** Server-side reads of the Media Library admin API (`/api/v1/admin/media/*`). */

const MEDIA_API = '/api/v1/admin/media';

export interface MediaListParams {
  q?: string | undefined;
  /** `image` or `document`, already validated by the caller. The page's URL calls this param `type`. */
  type?: string | undefined;
  /** JPG, PNG and WebP only: what a blog cover can use. */
  raster?: boolean | undefined;
  page?: number | undefined;
}

function mediaQueryString(params: MediaListParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('mediaType', params.type);
  if (params.raster) search.set('raster', 'true');
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function getMediaList(
  params: MediaListParams,
): Promise<AdminReadResult<Paginated<MediaAdmin>>> {
  return forwardedRead(`${MEDIA_API}${mediaQueryString(params)}`);
}

export async function getMediaDetail(id: string): Promise<AdminReadResult<MediaAdmin>> {
  const result = await forwardedRead<{ media: MediaAdmin }>(`${MEDIA_API}/${id}`);
  return result.ok ? { ok: true, data: result.data.media } : result;
}

/** The real references to an item: blog posts that use it as their cover image. */
export async function getMediaUsage(id: string): Promise<AdminReadResult<MediaUsageAdmin>> {
  const result = await forwardedRead<{ usage: MediaUsageAdmin }>(`${MEDIA_API}/${id}/usage`);
  return result.ok ? { ok: true, data: result.data.usage } : result;
}
