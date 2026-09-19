import {
  ERROR_CODES,
  MEDIA_FILENAME_MAX,
  maxBytesForMime,
  mediaTypeForMime,
  type MediaMimeType,
  type MediaType,
} from '@nexastack/shared';

import { sniffAttachmentType } from './cloudinary.js';
import { AppError, ValidationError } from './errors.js';

/**
 * Server-side validation of a Media Library upload, done on the REAL BYTES. The browser's `accept`
 * attribute, the declared MIME type and the file extension are all attacker-controlled and are never
 * consulted for the decision: a renamed `payload.html` saved as `photo.png` is refused.
 *
 * PDF, PNG and JPEG are recognised by the existing `sniffAttachmentType` (the quotation upload's
 * detector, imported rather than copied). This module adds WebP and SVG, and the per-type size caps
 * from `@nexastack/shared`.
 *
 * SVG is the risky one: it is an XML document that can carry scripts and external references, and
 * these files are published on a public site. An SVG is therefore accepted only when it is a plain
 * drawing: no scripts, event handlers, `foreignObject`, embedded documents, external references or
 * entity declarations. This is a conservative reject-list on text, not a full sanitiser: a file it
 * refuses can be re-exported as a plain SVG or PNG.
 */

export interface ValidatedMediaFile {
  mimeType: MediaMimeType;
  mediaType: MediaType;
  /** The real extension for this type, without the dot. */
  extension: 'jpg' | 'png' | 'webp' | 'svg' | 'pdf';
}

const EXTENSIONS: Record<MediaMimeType, ValidatedMediaFile['extension']> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

const TYPE_LABELS: Record<MediaMimeType, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/svg+xml': 'SVG',
  'application/pdf': 'PDF',
};

const UNSUPPORTED_TYPE_MESSAGE =
  "That file isn't a supported type. Upload a JPG, PNG, WebP or SVG image, or a PDF document.";

function fileIssue(message: string): ValidationError {
  return new ValidationError([{ location: 'body', path: 'file', message }]);
}

function isWebp(bytes: Uint8Array): boolean {
  // "RIFF" <size> "WEBP"
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

/** Decodes strict UTF-8; a file that is not valid text is not an SVG. */
function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** True if the text, after an optional XML prolog, comments and doctype, starts with an `<svg` root. */
function hasSvgRoot(text: string): boolean {
  let rest = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  // Bounded: a prolog, a few comments and a doctype are all that may precede the root element.
  for (let step = 0; step < 20; step += 1) {
    rest = rest.trimStart();
    if (rest.startsWith('<?xml')) {
      const end = rest.indexOf('?>');
      if (end === -1) return false;
      rest = rest.slice(end + 2);
    } else if (rest.startsWith('<!--')) {
      const end = rest.indexOf('-->');
      if (end === -1) return false;
      rest = rest.slice(end + 3);
    } else if (/^<!DOCTYPE/i.test(rest)) {
      // A DOCTYPE may carry an internal subset in [...] whose own declarations contain `>`.
      const doctype = /^<!DOCTYPE[^[>]*(?:\[[\s\S]*?\])?\s*>/i.exec(rest);
      if (!doctype) return false;
      rest = rest.slice(doctype[0].length);
    } else {
      break;
    }
  }
  return /^<svg[\s>/]/.test(rest);
}

/** Embedded raster images are common in exported SVGs and harmless; every other `data:` URI is not. */
const SAFE_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i;

interface SvgRule {
  reason: string;
  test: (text: string) => boolean;
}

const SVG_RULES: readonly SvgRule[] = [
  { reason: 'it contains a script', test: (t) => /<\s*script\b/i.test(t) },
  { reason: 'it contains a foreignObject', test: (t) => /<\s*foreignObject\b/i.test(t) },
  {
    reason: 'it embeds another document',
    test: (t) => /<\s*(?:iframe|embed|object|applet|link|meta|base)\b/i.test(t),
  },
  { reason: 'it contains an event handler', test: (t) => /[\s"'/]on[a-z]+\s*=/i.test(t) },
  { reason: 'it contains a javascript: link', test: (t) => /javascript\s*:/i.test(t) },
  {
    reason: 'it declares entities or an internal DTD',
    test: (t) => /<!ENTITY/i.test(t) || /<!DOCTYPE[^>]*\[/i.test(t),
  },
  {
    reason: 'it links to something outside the file',
    test: (t) => {
      // href / xlink:href must point inside the file (#id) or be an embedded raster image.
      for (const match of t.matchAll(/(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
        const target = (match[1] ?? match[2] ?? '').trim();
        if (!target.startsWith('#') && !SAFE_DATA_URI.test(target)) return true;
      }
      return false;
    },
  },
  {
    reason: 'it links to something outside the file',
    test: (t) => {
      // url(...) in attributes and styles, and CSS @import.
      if (/@import\b/i.test(t)) return true;
      for (const match of t.matchAll(/url\(\s*(["']?)([^)"']*)\1\s*\)/gi)) {
        const target = (match[2] ?? '').trim();
        if (!target.startsWith('#') && !SAFE_DATA_URI.test(target)) return true;
      }
      return false;
    },
  },
  {
    reason: 'it contains an embedded data URI that is not a plain image',
    test: (t) => {
      for (const match of t.matchAll(/data\s*:[^"')\s]*/gi)) {
        if (!SAFE_DATA_URI.test(match[0])) return true;
      }
      return false;
    },
  },
];

/** The first reason an SVG's text is not a plain drawing, or null if it passes every check. */
export function findSvgProblem(text: string): string | null {
  for (const rule of SVG_RULES) {
    if (rule.test(text)) return rule.reason;
  }
  return null;
}

/** The real type of a Media Library candidate from its bytes, or null if it is not an accepted type. */
export function sniffMediaType(bytes: Uint8Array): MediaMimeType | null {
  const common = sniffAttachmentType(bytes);
  if (common) return common;
  if (isWebp(bytes)) return 'image/webp';

  // Only test for SVG on plausibly text-like input, and only decode as much as needed to decide.
  const head = decodeUtf8(bytes.subarray(0, Math.min(bytes.length, 4096)));
  // A 4096-byte cut can split a multi-byte character; retry without the last few bytes.
  const text =
    head ?? decodeUtf8(bytes.subarray(0, Math.max(0, Math.min(bytes.length, 4096) - 3)));
  if (text !== null && hasSvgRoot(text)) return 'image/svg+xml';
  return null;
}

/**
 * Validates a candidate file and returns its real type, or throws a 400/413 the admin can act on.
 * Order: empty, type (by bytes), size for THAT type, then SVG safety.
 */
export function validateMediaFile(bytes: Uint8Array): ValidatedMediaFile {
  if (bytes.byteLength === 0) {
    throw fileIssue('That file appears to be empty. Please choose another file.');
  }

  const mimeType = sniffMediaType(bytes);
  if (!mimeType) throw fileIssue(UNSUPPORTED_TYPE_MESSAGE);

  const maxBytes = maxBytesForMime(mimeType);
  if (bytes.byteLength > maxBytes) {
    const limit = `${Math.round(maxBytes / (1024 * 1024))} MB`;
    throw new AppError(
      413,
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      `That ${TYPE_LABELS[mimeType]} file is larger than the ${limit} limit for its type. Please choose a smaller file.`,
      { details: [{ location: 'body', path: 'file', message: `Larger than ${limit}` }] },
    );
  }

  if (mimeType === 'image/svg+xml') {
    const text = decodeUtf8(bytes);
    if (text === null) throw fileIssue(UNSUPPORTED_TYPE_MESSAGE);
    const problem = findSvgProblem(text);
    if (problem) {
      throw fileIssue(
        `This SVG can't be uploaded because ${problem}. Export it again as a plain SVG (or use PNG or WebP).`,
      );
    }
  }

  return { mimeType, mediaType: mediaTypeForMime(mimeType), extension: EXTENSIONS[mimeType] };
}

/**
 * The name to store and show. Only the base name is kept (no path), control characters are removed,
 * and the extension is forced to the file's REAL type, so a `.png` name on a PDF cannot mislead
 * anyone about what they are downloading. Display text only: React escapes it wherever it is shown.
 */
export function sanitizeFilename(original: string, extension: ValidatedMediaFile['extension']): string {
  const base = (original.split(/[\\/]/).pop() ?? '').replace(/\.[A-Za-z0-9]{1,5}$/, '');

  const cleaned = [...base]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 0x1f || code === 0x7f ? '_' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MEDIA_FILENAME_MAX - extension.length - 1)
    .trim();

  return `${cleaned === '' || /^[._ -]+$/.test(cleaned) ? 'upload' : cleaned}.${extension}`;
}
