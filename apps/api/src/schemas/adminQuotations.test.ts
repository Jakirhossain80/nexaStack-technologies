import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  attachmentParamsSchema,
  quotationExportQuerySchema,
  quotationListQuerySchema,
} from './adminQuotations.js';

describe('quotationListQuerySchema', () => {
  it('defaults to the active view, page 1, 20 per page, no filters', () => {
    const parsed = quotationListQuerySchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.archived, false);
    assert.equal(parsed.q, undefined);
    assert.equal(parsed.status, undefined);
    assert.equal(parsed.projectType, undefined);
  });

  it('parses a comma list of statuses (the dashboard’s "needs attention" query)', () => {
    const parsed = quotationListQuerySchema.parse({ status: 'new,reviewing', limit: '5' });
    assert.deepEqual(parsed.status, ['new', 'reviewing']);
    assert.equal(parsed.limit, 5);
  });

  it('accepts every real status, including the hyphenated one', () => {
    assert.deepEqual(quotationListQuerySchema.parse({ status: 'quote-sent' }).status, ['quote-sent']);
  });

  it('rejects an unknown status, and the retired "responded"', () => {
    assert.equal(quotationListQuerySchema.safeParse({ status: 'won' }).success, false);
    assert.equal(quotationListQuerySchema.safeParse({ status: 'new,won' }).success, false);
    assert.equal(quotationListQuerySchema.safeParse({ status: 'responded' }).success, false);
  });

  it('accepts a known project type and rejects anything else', () => {
    assert.equal(quotationListQuerySchema.parse({ projectType: 'web-application' }).projectType, 'web-application');
    assert.equal(quotationListQuerySchema.safeParse({ projectType: 'spaceship' }).success, false);
  });

  it('treats blank controls as "not provided"', () => {
    const parsed = quotationListQuerySchema.parse({ q: '  ', status: '', projectType: '', archived: '' });
    assert.equal(parsed.q, undefined);
    assert.equal(parsed.status, undefined);
    assert.equal(parsed.projectType, undefined);
    assert.equal(parsed.archived, false);
  });

  it('archived=true selects the archived view; anything else is rejected', () => {
    assert.equal(quotationListQuerySchema.parse({ archived: 'true' }).archived, true);
    assert.equal(quotationListQuerySchema.parse({ archived: 'false' }).archived, false);
    assert.equal(quotationListQuerySchema.safeParse({ archived: 'yes' }).success, false);
  });

  it('trims the search text and caps it at 100 characters', () => {
    assert.equal(quotationListQuerySchema.parse({ q: '  acme  ' }).q, 'acme');
    assert.equal(quotationListQuerySchema.safeParse({ q: 'a'.repeat(101) }).success, false);
  });

  it('rejects an object smuggled in as a filter value (NoSQL-injection shape)', () => {
    assert.equal(quotationListQuerySchema.safeParse({ q: { $ne: '' } }).success, false);
    assert.equal(quotationListQuerySchema.safeParse({ status: { $ne: 'new' } }).success, false);
  });

  it('bounds paging', () => {
    assert.equal(quotationListQuerySchema.safeParse({ page: '0' }).success, false);
    assert.equal(quotationListQuerySchema.safeParse({ limit: '101' }).success, false);
  });
});

describe('quotationExportQuerySchema', () => {
  it('takes the same filters as the list but no paging', () => {
    const parsed = quotationExportQuerySchema.parse({
      q: 'acme',
      status: 'reviewing',
      projectType: 'ecommerce-store',
      archived: 'true',
      page: '3',
    });
    assert.deepEqual(parsed, {
      q: 'acme',
      status: ['reviewing'],
      projectType: 'ecommerce-store',
      archived: true,
    });
  });
});

describe('attachmentParamsSchema', () => {
  const ID = '507f1f77bcf86cd799439011';

  it('accepts a request id and an attachment index within the upload limit (0-4)', () => {
    assert.deepEqual(attachmentParamsSchema.parse({ id: ID, attachmentId: '0' }), {
      id: ID,
      attachmentId: 0,
    });
    assert.equal(attachmentParamsSchema.parse({ id: ID, attachmentId: '4' }).attachmentId, 4);
  });

  it('rejects an out-of-range, negative, fractional or non-numeric index and a bad id', () => {
    for (const attachmentId of ['5', '-1', '1.5', 'abc', '']) {
      assert.equal(attachmentParamsSchema.safeParse({ id: ID, attachmentId }).success, false, attachmentId);
    }
    assert.equal(attachmentParamsSchema.safeParse({ id: 'nope', attachmentId: '0' }).success, false);
  });
});
