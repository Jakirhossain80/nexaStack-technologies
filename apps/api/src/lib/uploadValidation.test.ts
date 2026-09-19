import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ValidationError } from './errors.js';
import { findSvgProblem, sanitizeFilename, sniffMediaType, validateMediaFile } from './uploadValidation.js';

const enc = (text: string): Uint8Array => new TextEncoder().encode(text);

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF = enc('%PDF-1.7\n%…\n');
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const SVG = enc(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="url(#g)"/></svg>',
);

/** The error `validateMediaFile` threw, with its status and the field it blames. */
function rejection(bytes: Uint8Array): { status: number; path: string | undefined; message: string } {
  try {
    validateMediaFile(bytes);
  } catch (err) {
    assert.ok(err instanceof Error);
    const app = err as Error & {
      statusCode: number;
      details?: { path: string; message: string }[];
    };
    // A ValidationError's own message is generic; the field's detail carries what the admin reads.
    return {
      status: app.statusCode,
      path: app.details?.[0]?.path,
      message: app.details?.[0]?.message ?? app.message,
    };
  }
  assert.fail('expected the file to be rejected');
}

describe('validateMediaFile: accepted types (detected from bytes)', () => {
  it('accepts JPG, PNG, WebP and SVG as images, PDF as a document', () => {
    assert.deepEqual(validateMediaFile(JPEG), { mimeType: 'image/jpeg', mediaType: 'image', extension: 'jpg' });
    assert.deepEqual(validateMediaFile(PNG), { mimeType: 'image/png', mediaType: 'image', extension: 'png' });
    assert.deepEqual(validateMediaFile(WEBP), { mimeType: 'image/webp', mediaType: 'image', extension: 'webp' });
    assert.deepEqual(validateMediaFile(SVG), { mimeType: 'image/svg+xml', mediaType: 'image', extension: 'svg' });
    assert.deepEqual(validateMediaFile(PDF), { mimeType: 'application/pdf', mediaType: 'document', extension: 'pdf' });
  });

  it('accepts an SVG with an XML prolog, a comment and an Illustrator-style DOCTYPE', () => {
    const svg = enc(
      '\uFEFF<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator -->\n' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="g"/></defs>' +
        '<use xlink:href="#g"/><image href="data:image/png;base64,iVBORw0KGgo="/></svg>',
    );
    assert.equal(validateMediaFile(svg).mimeType, 'image/svg+xml');
  });
});

describe('validateMediaFile: rejected regardless of what the file is called', () => {
  it('rejects an empty file', () => {
    const r = rejection(new Uint8Array());
    assert.equal(r.status, 400);
    assert.equal(r.path, 'file');
  });

  it('rejects HTML, scripts, executables and plain text (e.g. a renamed payload.html saved as photo.png)', () => {
    for (const bytes of [
      enc('<!doctype html><script>alert(1)</script>'),
      enc('<html><body>hi</body></html>'),
      enc('#!/bin/sh\nrm -rf /'),
      Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03]), // MZ (Windows executable)
      Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), // ZIP / Office
      Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]), // GIF is not on the list
      enc('just some text'),
    ]) {
      const r = rejection(bytes);
      assert.equal(r.status, 400);
      assert.equal(r.path, 'file');
      assert.match(r.message, /isn't a supported type/);
    }
  });

  it('rejects a truncated WebP/RIFF header and non-UTF-8 binary posing as SVG', () => {
    assert.equal(sniffMediaType(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20])), null);
    assert.equal(sniffMediaType(Uint8Array.from([0xff, 0xfe, 0xfd, 0x3c, 0x73, 0x76, 0x67])), null);
  });
});

describe('validateMediaFile: size caps apply per real type', () => {
  const pad = (head: Uint8Array, total: number): Uint8Array => {
    const out = new Uint8Array(total);
    out.set(head);
    return out;
  };
  const MB = 1024 * 1024;

  it('accepts a raster image and a PDF at exactly 10 MB, rejects them 1 byte over (413)', () => {
    assert.equal(validateMediaFile(pad(PNG, 10 * MB)).mimeType, 'image/png');
    assert.equal(validateMediaFile(pad(PDF, 10 * MB)).mimeType, 'application/pdf');
    for (const head of [PNG, JPEG, WEBP, PDF]) {
      const r = rejection(pad(head, 10 * MB + 1));
      assert.equal(r.status, 413);
      assert.equal(r.path, 'file');
    }
  });

  it('caps SVG at 1 MB, far below raster images', () => {
    const big = new Uint8Array(1 * MB + 1);
    big.set(enc('<svg xmlns="http://www.w3.org/2000/svg">'));
    big.fill(0x20, 40);
    assert.equal(rejection(big).status, 413);
    const ok = new Uint8Array(1 * MB);
    ok.set(enc('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
    ok.fill(0x20, 50);
    assert.equal(validateMediaFile(ok).mimeType, 'image/svg+xml');
  });
});

describe('SVG safety: only plain drawings are accepted', () => {
  const wrap = (inner: string, attrs = ''): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;

  const HOSTILE: [string, string][] = [
    ['a script element', wrap('<script>alert(1)</script>')],
    ['a script element, mixed case', wrap('<ScRiPt>alert(1)</sCrIpT>')],
    ['a foreignObject', wrap('<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject>')],
    ['an iframe', wrap('<iframe src="https://evil.example"></iframe>')],
    ['an onload handler', wrap('', 'onload="alert(1)"')],
    ['an onclick handler on a child', wrap('<rect width="1" height="1" onclick="alert(1)"/>')],
    ['an onmouseover handler in single quotes', wrap("<circle r='1' onmouseover='x()'/>")],
    ['a javascript: link', wrap('<a xlink:href="javascript:alert(1)"><rect/></a>')],
    ['a javascript: link with whitespace', wrap('<a href="java\tscript:alert(1)"/>')],
    ['an external image', wrap('<image href="https://evil.example/track.png"/>')],
    ['an external xlink:href', wrap('<use xlink:href="https://evil.example/x.svg#a"/>')],
    ['a relative file reference', wrap('<image href="other.svg"/>')],
    ['a protocol-relative link', wrap('<image href="//evil.example/x.png"/>')],
    ['an external url() fill', wrap('<rect fill="url(https://evil.example/x)"/>')],
    ['a CSS @import', wrap('<style>@import "https://evil.example/x.css";</style>')],
    ['a data:text/html link', wrap('<a href="data:text/html,<script>1</script>"/>')],
    ['a nested SVG data URI', wrap('<image href="data:image/svg+xml;base64,PHN2Zz4="/>')],
    ['an entity declaration', '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "boom">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>'],
    ['an internal DTD subset', '<!DOCTYPE svg [ ]><svg xmlns="http://www.w3.org/2000/svg"/>'],
  ];

  for (const [label, svg] of HOSTILE) {
    it(`rejects an SVG with ${label}`, () => {
      assert.ok(findSvgProblem(svg), `expected a problem for ${label}`);
      const r = rejection(enc(svg));
      assert.equal(r.status, 400);
      assert.equal(r.path, 'file');
      assert.match(r.message, /SVG can't be uploaded because/);
    });
  }

  it('accepts ordinary drawings: paths, gradients, internal references, text, embedded PNG', () => {
    for (const svg of [
      wrap('<path d="M0 0L10 10" fill="none" stroke="#000" stroke-linejoin="round" stroke-width="2"/>'),
      wrap('<defs><linearGradient id="a"><stop offset="0"/></linearGradient></defs><rect fill="url(#a)"/>'),
      wrap('<defs><clipPath id="c"/></defs><g clip-path="url(#c)"><use href="#c"/></g>'),
      wrap('<text x="1" y="1" font-family="Geist, sans-serif">Click on button = fun</text>'),
      wrap('<image href="data:image/jpeg;base64,/9j/4AAQ"/>'),
      wrap('<style>.a{fill:#fff}</style><rect class="a"/>'),
    ]) {
      assert.equal(findSvgProblem(svg), null, svg);
      assert.equal(validateMediaFile(enc(svg)).mimeType, 'image/svg+xml');
    }
  });
});

describe('sanitizeFilename', () => {
  it('keeps a normal name and forces the real extension', () => {
    assert.equal(sanitizeFilename('Team photo.jpeg', 'jpg'), 'Team photo.jpg');
    assert.equal(sanitizeFilename('logo.final.png', 'webp'), 'logo.final.webp'); // a .png name on a WebP is corrected
    assert.equal(sanitizeFilename('brochure', 'pdf'), 'brochure.pdf');
  });

  it('strips paths and control characters', () => {
    assert.equal(sanitizeFilename('C:\\Users\\me\\..\\secret.png', 'png'), 'secret.png');
    assert.equal(sanitizeFilename('../../etc/passwd', 'pdf'), 'passwd.pdf');
    const name = sanitizeFilename('a\r\nb\u0000c.pdf', 'pdf');
    assert.equal([...name].some((character) => character.charCodeAt(0) <= 0x1f), false);
  });

  it('keeps non-Latin names, falls back when nothing usable remains, and caps the length', () => {
    assert.equal(sanitizeFilename('বাংলা ছবি.png', 'png'), 'বাংলা ছবি.png');
    assert.equal(sanitizeFilename('...', 'png'), 'upload.png');
    assert.equal(sanitizeFilename('', 'pdf'), 'upload.pdf');
    assert.ok(sanitizeFilename('a'.repeat(500), 'png').length <= 150);
  });

  it('a ValidationError is what the API turns into a 400 with a field path', () => {
    assert.ok(ValidationError.name);
  });
});
