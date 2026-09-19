'use server';

import { OBJECT_ID_PATTERN, type MediaAdmin } from '@nexastack/shared';

import { getMediaDetail, getMediaList } from '@/lib/adminMedia.server';
import { can, getAdminSession } from '@/lib/adminSession.server';
import { scanMediaReferences } from '@/lib/mediaReferences.server';
import type { MediaReferenceScan } from '@/lib/mediaReferenceScan';

export type ScanMediaResult =
  { ok: true; scan: MediaReferenceScan } | { ok: false; message: string };

/**
 * Server Action behind the delete dialog's "where might this be used?" hint. It runs in `apps/web`
 * because only this app can see the site's config; the API (a separate deployment) cannot.
 *
 * A Server Action is a public POST endpoint in its own right and does NOT pass through the admin
 * layout's auth check, so the session is verified here, and again by the API when the media record is
 * read (the session cookie is forwarded). Needs `media:delete` (the capability the dialog it serves is for),
 * the same as the media API itself. The action reads and reports; it changes nothing.
 */
export async function scanMediaReferencesAction(mediaId: string): Promise<ScanMediaResult> {
  const admin = await getAdminSession();
  if (!can(admin, 'media:delete')) {
    return { ok: false, message: 'You do not have permission to check this.' };
  }
  if (typeof mediaId !== 'string' || !OBJECT_ID_PATTERN.test(mediaId)) {
    return { ok: false, message: 'That file was not found.' };
  }

  const media = await getMediaDetail(mediaId);
  if (!media.ok) return { ok: false, message: media.message };

  return { ok: true, scan: await scanMediaReferences(media.data.cloudinaryPublicId) };
}

/** What the blog editor's image picker needs from a library item, and nothing more. */
export type PickerItem = Pick<MediaAdmin, 'id' | 'filename' | 'url' | 'altText' | 'width' | 'height'>;

export type PickerResult =
  | { ok: true; items: PickerItem[]; page: number; totalPages: number; total: number }
  | { ok: false; message: string };

/**
 * Server Action behind the blog editor's cover-image picker: one page of JPG, PNG and WebP images from
 * the Media Library, optionally searched. Read-only (`media:read`, which every role holds), so
 * `content_editor` (who can write blog drafts) may use it; the API applies the same rule again. Like the scan above
 * it verifies the session itself, because a Server Action does not pass through the layout's guard.
 */
export async function listMediaPickerAction(input: {
  q?: string;
  page?: number;
}): Promise<PickerResult> {
  const admin = await getAdminSession();
  if (!admin) return { ok: false, message: 'Your session has expired. Sign in again.' };
  if (!can(admin, 'media:read')) {
    return { ok: false, message: 'Your account does not have permission to use the Media Library.' };
  }

  const q = typeof input.q === 'string' ? input.q.trim().slice(0, 100) || undefined : undefined;
  const page = Number.isInteger(input.page) && (input.page as number) >= 1 ? (input.page as number) : 1;

  const result = await getMediaList({ q, type: 'image', raster: true, page });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.status === 403
          ? 'Your account does not have permission to use the Media Library.'
          : result.message,
    };
  }

  return {
    ok: true,
    items: result.data.items.map(({ id, filename, url, altText, width, height }) => ({
      id,
      filename,
      url,
      altText,
      width,
      height,
    })),
    page: result.data.page,
    totalPages: result.data.totalPages,
    total: result.data.total,
  };
}
