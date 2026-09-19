import type { MediaAdmin } from '@nexastack/shared';

import { formatFileSize } from '@/lib/quotationLabels';

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/svg+xml': 'SVG',
  'application/pdf': 'PDF',
};

/** `PNG`, `PDF`: the file's format for display. An unrecognised type is shown as stored. */
export function formatLabel(mimeType: string): string {
  return MIME_LABELS[mimeType] ?? mimeType;
}

/** `PNG · 1.2 MB · 1600 × 900`, or what is known of it. */
export function describeMedia(media: Pick<MediaAdmin, 'mimeType' | 'sizeBytes' | 'width' | 'height'>): string {
  const parts = [formatLabel(media.mimeType), formatFileSize(media.sizeBytes)];
  if (media.width !== null && media.height !== null) parts.push(`${media.width} × ${media.height}`);
  return parts.join(' · ');
}
