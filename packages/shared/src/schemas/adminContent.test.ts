import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MEDIA_ALT_TEXT_MAX,
  MEDIA_ALT_TEXT_MIN,
  MEDIA_DESCRIPTION_MAX,
} from '../constants/media.js';
import { issuesByPath, parseValid } from '../test-utils/issues.js';

import { ENQUIRY_NOTE_MAX, enquiryNoteSchema, enquiryStatusChangeSchema } from './enquiry.js';
import {
  mediaAltTextSchema,
  mediaDeleteSchema,
  mediaDescriptionSchema,
  mediaDocumentMetadataSchema,
  mediaImageMetadataSchema,
} from './media.js';
import {
  QUOTATION_NOTE_MAX,
  quotationNoteSchema,
  quotationStatusChangeSchema,
} from './quotationAdmin.js';

describe('enquiry admin schemas', () => {
  it('note: trims, and refuses an empty or over-long note', () => {
    assert.equal(parseValid(enquiryNoteSchema, { text: '  Called back.  ' }).text, 'Called back.');
    assert.match(
      issuesByPath(enquiryNoteSchema, { text: '   ' })['text']?.[0] ?? '',
      /before adding it/,
    );
    assert.match(
      issuesByPath(enquiryNoteSchema, { text: 'a'.repeat(ENQUIRY_NOTE_MAX + 1) })['text']?.[0] ??
        '',
      /2,000 characters or fewer/,
    );
    parseValid(enquiryNoteSchema, { text: 'a'.repeat(ENQUIRY_NOTE_MAX) });
  });

  it('status change: only the four real enquiry statuses', () => {
    for (const status of ['new', 'read', 'contacted', 'closed'])
      parseValid(enquiryStatusChangeSchema, { status });
    assert.match(
      issuesByPath(enquiryStatusChangeSchema, { status: 'archived' })['status']?.[0] ?? '',
      /valid status/,
    );
  });
});

describe('quotation admin schemas', () => {
  it('reuses the enquiry note rules (one schema, not a copy)', () => {
    assert.equal(quotationNoteSchema, enquiryNoteSchema);
    assert.equal(QUOTATION_NOTE_MAX, ENQUIRY_NOTE_MAX);
  });

  it('status change: only the six real quotation statuses', () => {
    for (const status of ['new', 'reviewing', 'quote-sent', 'accepted', 'declined', 'closed']) {
      parseValid(quotationStatusChangeSchema, { status });
    }
    assert.equal(quotationStatusChangeSchema.safeParse({ status: 'quote_sent' }).success, false);
    assert.equal(quotationStatusChangeSchema.safeParse({ status: { $ne: 'new' } }).success, false);
  });
});

describe('media schemas', () => {
  it(`image alt text is required (${MEDIA_ALT_TEXT_MIN}-${MEDIA_ALT_TEXT_MAX} characters)`, () => {
    parseValid(mediaImageMetadataSchema, { altText: 'A test diagram' });
    assert.match(
      issuesByPath(mediaImageMetadataSchema, {})['altText']?.[0] ?? '',
      /alt text is required/,
    );
    assert.match(
      issuesByPath(mediaImageMetadataSchema, { altText: '   ' })['altText']?.[0] ?? '',
      /Alt text is required/,
    );
    assert.equal(mediaAltTextSchema.safeParse('a'.repeat(MEDIA_ALT_TEXT_MAX)).success, true);
    assert.equal(mediaAltTextSchema.safeParse('a'.repeat(MEDIA_ALT_TEXT_MAX + 1)).success, false);
  });

  it('document description is optional, blank means absent, and is length-capped', () => {
    assert.equal(parseValid(mediaDocumentMetadataSchema, {}).description, undefined);
    assert.equal(
      parseValid(mediaDocumentMetadataSchema, { description: '  ' }).description,
      undefined,
    );
    assert.equal(
      mediaDescriptionSchema.safeParse('a'.repeat(MEDIA_DESCRIPTION_MAX + 1)).success,
      false,
    );
  });

  it('delete: requires the typed file name; report fields default and are range-checked', () => {
    const data = parseValid(mediaDeleteSchema, { confirmFilename: 'test.png' });
    assert.equal(data.referencesReported, 0);
    assert.equal(data.referencesAcknowledged, false);
    assert.match(
      issuesByPath(mediaDeleteSchema, { confirmFilename: '' })['confirmFilename']?.[0] ?? '',
      /Type the file name/,
    );
    assert.equal(mediaDeleteSchema.safeParse({}).success, false);
    assert.equal(
      mediaDeleteSchema.safeParse({ confirmFilename: 'x', referencesReported: -1 }).success,
      false,
    );
    assert.equal(
      mediaDeleteSchema.safeParse({ confirmFilename: 'x', referencesReported: 1001 }).success,
      false,
    );
  });
});
