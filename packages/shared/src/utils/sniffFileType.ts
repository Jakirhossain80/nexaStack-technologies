/**
 * The real type of an uploaded file, read from its first bytes (magic numbers). The declared MIME type,
 * the file name and the browser's `accept` attribute are all attacker-controlled and are never
 * consulted.
 *
 * ONE implementation, used by the public quotation upload (`apps/web`) and by everything in `apps/api`
 * that accepts or serves a file (quotation attachment download, Media Library upload). It lives here so
 * the two apps can never drift apart on what counts as a PDF, PNG or JPEG.
 */

export type SniffedFileType = 'application/pdf' | 'image/png' | 'image/jpeg';

export function sniffFileType(bytes: Uint8Array): SniffedFileType | null {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf'; // %PDF
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'; // JPEG SOI marker
  }
  return null;
}
