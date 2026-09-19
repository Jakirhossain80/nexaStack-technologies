import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import { ERROR_CODES } from '@nexastack/shared';

import { AppError, ValidationError } from './errors.js';

/**
 * Reads a `multipart/form-data` upload without a multipart library: Node's built-in `Request`
 * parses the body via `formData()`. The body is buffered in memory, so it is capped, and the cap is
 * enforced BEFORE and WHILE reading, not after:
 *
 *   1. a declared `Content-Length` over the cap is refused without reading a byte;
 *   2. a body that lies about, or omits, its length (chunked) is cut off once it passes the cap.
 *
 * The cap is the file's limit plus a fixed allowance for multipart framing and the text fields. The
 * exact per-type file limit is applied afterwards by `validateMediaFile`, on the real bytes.
 */

/** Framing and text fields (boundaries, headers, alt text) on top of the file itself. */
const FRAMING_ALLOWANCE_BYTES = 256 * 1024;

const MAX_FIELDS = 20;
const MAX_FIELD_LENGTH = 2_000;

export interface ParsedMultipart {
  /** Text fields by name. */
  fields: Record<string, string>;
  /** The single uploaded file (field name `file`), or null if none was sent. */
  file: File | null;
}

function tooLarge(maxFileBytes: number): AppError {
  const mb = Math.round(maxFileBytes / (1024 * 1024));
  return new AppError(
    413,
    ERROR_CODES.PAYLOAD_TOO_LARGE,
    `That upload is larger than the ${mb} MB limit. Please choose a smaller file.`,
    { details: [{ location: 'body', path: 'file', message: `Larger than ${mb} MB` }] },
  );
}

function badBody(message: string): ValidationError {
  return new ValidationError([{ location: 'body', path: 'file', message }]);
}

/**
 * @param maxFileBytes the largest file any accepted type may be; the request is refused past this
 *   (plus framing) without being read in full.
 */
export async function readMultipart(
  req: IncomingMessage,
  maxFileBytes: number,
): Promise<ParsedMultipart> {
  const contentType = req.headers['content-type'] ?? '';
  if (!/^multipart\/form-data\s*;\s*boundary=/i.test(contentType)) {
    throw badBody('Send the file as multipart/form-data, with the file in the "file" field.');
  }

  const cap = maxFileBytes + FRAMING_ALLOWANCE_BYTES;

  const declared = Number(req.headers['content-length']);
  if (Number.isFinite(declared) && declared > cap) throw tooLarge(maxFileBytes);

  let received = 0;
  let exceeded = false;
  async function* limited(): AsyncGenerator<Buffer> {
    for await (const chunk of req as AsyncIterable<Buffer>) {
      received += chunk.length;
      if (received > cap) {
        exceeded = true;
        throw tooLarge(maxFileBytes);
      }
      yield chunk;
    }
  }

  let form: FormData;
  try {
    const request = new Request('http://upload.invalid/', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Readable.toWeb(Readable.from(limited())) as unknown as ReadableStream,
      duplex: 'half',
    } as RequestInit);
    form = await request.formData();
  } catch (err) {
    if (exceeded) throw tooLarge(maxFileBytes);
    if (err instanceof AppError) throw err;
    throw badBody('That upload could not be read. Please try again.');
  }

  const fields: Record<string, string> = {};
  let file: File | null = null;
  let count = 0;

  for (const [name, value] of form.entries()) {
    count += 1;
    if (count > MAX_FIELDS) throw badBody('That upload has too many parts.');

    if (typeof value === 'string') {
      if (value.length > MAX_FIELD_LENGTH) {
        throw new ValidationError([
          { location: 'body', path: name, message: 'That value is too long.' },
        ]);
      }
      fields[name] = value;
    } else if (name === 'file') {
      if (file) throw badBody('Send one file at a time.');
      file = value;
    } else {
      throw badBody('Only one file, in the "file" field, can be uploaded.');
    }
  }

  return { fields, file };
}
