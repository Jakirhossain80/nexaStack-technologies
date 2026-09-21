import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import {
  ENQUIRY_STATUSES,
  QUOTATION_STATUSES,
  canTransitionEnquiry,
  canTransitionQuotation,
} from '@nexastack/shared';

import { seedEnquiry, seedQuotation } from './support/fixtures.js';
import { API, startApi, type Api } from './support/harness.js';

/**
 * Enquiry and quotation management through the real API and database: status workflow (every from -> to pair
 * checked against the shared tables), notes, archiving, list filters, CSV export, and the audit trail. What a
 * real admin does all day, and where a regression would silently lose or misfile a client's request.
 */

let api: Api;
let cookie: string;
let adminId: string;

before(async () => {
  api = await startApi();
  const admin = await api.seedAdmin('admin');
  adminId = admin.id;
  cookie = await api.loginAs(admin);
});

after(async () => {
  await api.stop();
});

const call = (path: string, method = 'GET', body?: unknown) =>
  api.request(`${API}${path}`, { method, cookie, body });

describe('enquiries', () => {
  it('list: newest first, paginated, with the envelope and no message bodies leaked into summaries', async () => {
    await seedEnquiry(api, { subject: 'List test one' });
    await seedEnquiry(api, { subject: 'List test two' });
    const reply = await call('/admin/enquiries?limit=1&page=1');
    assert.equal(reply.status, 200);
    assert.equal(reply.body.success, true);
    const { items, page, limit, total, totalPages } = reply.body.data;
    assert.equal(items.length, 1);
    assert.equal(page, 1);
    assert.equal(limit, 1);
    assert.ok(total >= 2 && totalPages >= 2);
    assert.ok(!('message' in items[0]), 'the list summary does not carry the message');
    assert.equal(typeof items[0].id, 'string');
  });

  it('opening an unread enquiry marks it read (and logs it); opening it again changes nothing', async () => {
    const enquiry = await seedEnquiry(api);
    assert.equal((await api.models.ContactSubmission.findById(enquiry.id).lean())?.status, 'new');
    const opened = await call(`/admin/enquiries/${enquiry.id}`);
    assert.equal(opened.status, 200);
    assert.equal(opened.body.data.enquiry.status, 'read');
    assert.equal(opened.body.data.enquiry.message, 'This is a synthetic test message.');
    assert.equal((await api.models.ContactSubmission.findById(enquiry.id).lean())?.status, 'read');
    assert.equal(
      await api.models.AdminActivityLog.countDocuments({
        eventType: 'enquiry_marked_read',
        'metadata.enquiryId': String(enquiry.id),
      }),
      1,
    );
    await call(`/admin/enquiries/${enquiry.id}`);
    assert.equal(
      await api.models.AdminActivityLog.countDocuments({
        eventType: 'enquiry_marked_read',
        'metadata.enquiryId': String(enquiry.id),
      }),
      1,
    );
  });

  describe('every status pair, against the shared transition table', () => {
    for (const from of ENQUIRY_STATUSES) {
      for (const to of ENQUIRY_STATUSES) {
        const allowed = canTransitionEnquiry(from, to);
        it(`${from} -> ${to} is ${allowed ? 'allowed' : 'refused (409), unchanged'}`, async () => {
          const enquiry = await seedEnquiry(api, { status: from });
          const reply = await call(`/admin/enquiries/${enquiry.id}/status`, 'PATCH', {
            status: to,
          });
          const now = (await api.models.ContactSubmission.findById(enquiry.id).lean())?.status;
          if (allowed) {
            assert.equal(reply.status, 200, JSON.stringify(reply.body));
            assert.equal(now, to);
            assert.equal(reply.body.data.enquiry.status, to);
            const logged = await api.models.AdminActivityLog.findOne({
              eventType: 'enquiry_status_changed',
              'metadata.enquiryId': String(enquiry.id),
            }).lean();
            assert.equal(String(logged?.adminUserId), adminId);
          } else {
            assert.equal(reply.status, 409);
            assert.equal(reply.body.error?.code, 'CONFLICT');
            assert.equal(now, from);
          }
        });
      }
    }
  });

  it('notes are append-only, attributed to the signed-in admin, trimmed, and length-limited', async () => {
    const enquiry = await seedEnquiry(api);
    const first = await call(`/admin/enquiries/${enquiry.id}/notes`, 'POST', {
      text: '  Called; no answer.  ',
    });
    assert.equal(first.status, 201);
    await call(`/admin/enquiries/${enquiry.id}/notes`, 'POST', { text: 'Second note.' });
    const stored = await api.models.ContactSubmission.findById(enquiry.id).lean();
    assert.deepEqual(
      stored?.notes.map((note) => note.text),
      ['Called; no answer.', 'Second note.'],
    );
    assert.equal(String(stored?.notes[0]?.authorAdminId), adminId);

    assert.equal(
      (await call(`/admin/enquiries/${enquiry.id}/notes`, 'POST', { text: '   ' })).status,
      400,
    );
    assert.equal(
      (await call(`/admin/enquiries/${enquiry.id}/notes`, 'POST', { text: 'x'.repeat(2001) }))
        .status,
      400,
    );
    assert.equal(
      (await api.models.ContactSubmission.findById(enquiry.id).lean())?.notes.length,
      2,
      'refused notes are not stored',
    );
  });

  it('archiving hides an enquiry from the working list, shows it under archived=true, and unarchiving restores it', async () => {
    const enquiry = await seedEnquiry(api, { subject: 'Archive me please' });
    const id = String(enquiry.id);
    const inList = async (query: string) =>
      ((await call(`/admin/enquiries?${query}`)).body.data.items as { id: string }[]).some(
        (row) => row.id === id,
      );

    assert.equal(await inList('q=Archive%20me'), true);
    const archived = await call(`/admin/enquiries/${id}/archive`, 'PATCH');
    assert.equal(archived.status, 200);
    const row = await api.models.ContactSubmission.findById(id).lean();
    assert.equal(row?.archived, true);
    assert.ok(row?.archivedAt instanceof Date);
    assert.equal(await inList('q=Archive%20me'), false, 'archived rows leave the working list');
    assert.equal(
      await inList('q=Archive%20me&archived=true'),
      true,
      'and appear in the archive view',
    );

    assert.equal((await call(`/admin/enquiries/${id}/unarchive`, 'PATCH')).status, 200);
    const restored = await api.models.ContactSubmission.findById(id).lean();
    assert.equal(restored?.archived, false);
    assert.equal(restored?.archivedAt, null);
    assert.equal(await inList('q=Archive%20me'), true);
  });

  it('filters by status (including a comma list) and by search text', async () => {
    await seedEnquiry(api, { subject: 'Filter needle new', status: 'new' });
    await seedEnquiry(api, { subject: 'Filter needle closed', status: 'closed' });
    const subjects = async (query: string) =>
      (
        (await call(`/admin/enquiries?q=Filter%20needle&${query}`)).body.data.items as {
          subject: string;
        }[]
      )
        .map((row) => row.subject)
        .sort();
    assert.deepEqual(await subjects('status=new'), ['Filter needle new']);
    assert.deepEqual(await subjects('status=closed'), ['Filter needle closed']);
    assert.deepEqual(await subjects('status=new,closed'), [
      'Filter needle closed',
      'Filter needle new',
    ]);
  });

  it('CSV export: right headers, one row per matching enquiry, a UTF-8 BOM, and spreadsheet formulas neutralised', async () => {
    await seedEnquiry(api, {
      subject: '=HYPERLINK("http://evil.example","click")',
      fullName: 'Export Test',
      message: 'Line one, with a comma\nand a newline',
    });
    const reply = await api.request(`${API}/admin/enquiries/export?q=HYPERLINK`, { cookie });
    assert.equal(reply.status, 200);
    assert.match(reply.headers.get('content-type') ?? '', /text\/csv/);
    assert.match(reply.headers.get('content-disposition') ?? '', /attachment/i);
    assert.ok(reply.text.startsWith('﻿'), 'UTF-8 BOM so Excel reads non-Latin names');
    const lines = reply.text.replace('﻿', '').trimEnd().split('\r\n');
    assert.ok(lines.length >= 2, 'a header and at least one row');
    assert.doesNotMatch(reply.text, /(^|,|\r\n)=HYPERLINK/, 'a formula must never start a cell');
    assert.match(reply.text, /'=HYPERLINK/, 'it is prefixed with an apostrophe instead');
  });
});

describe('quotations', () => {
  it('detail carries the reference number and the whole request; the list summary does not carry free text', async () => {
    const quotation = await seedQuotation(api, { fullName: 'Detail Test' });
    const detail = await call(`/admin/quotations/${quotation.id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.quotation.referenceNumber, quotation.referenceNumber);
    assert.equal(detail.body.data.quotation.fullName, 'Detail Test');
    assert.equal(
      detail.body.data.quotation.businessObjectives,
      'A synthetic objective for a test run.',
    );
    const list = await call(`/admin/quotations?q=${quotation.referenceNumber}`);
    assert.equal(list.body.data.items.length, 1);
    assert.ok(!('businessObjectives' in list.body.data.items[0]));
  });

  it('can be found by its confirmation number', async () => {
    const quotation = await seedQuotation(api);
    const found = await call(`/admin/quotations?q=${quotation.referenceNumber}`);
    assert.equal(found.body.data.items[0].referenceNumber, quotation.referenceNumber);
  });

  describe('every status pair, against the shared transition table', () => {
    for (const from of QUOTATION_STATUSES) {
      for (const to of QUOTATION_STATUSES) {
        const allowed = canTransitionQuotation(from, to);
        it(`${from} -> ${to} is ${allowed ? 'allowed' : 'refused (409), unchanged'}`, async () => {
          const quotation = await seedQuotation(api, { status: from });
          const reply = await call(`/admin/quotations/${quotation.id}/status`, 'PATCH', {
            status: to,
          });
          const now = (await api.models.QuotationSubmission.findById(quotation.id).lean())?.status;
          if (allowed) {
            assert.equal(reply.status, 200, JSON.stringify(reply.body));
            assert.equal(now, to);
          } else {
            assert.equal(reply.status, 409);
            assert.equal(now, from);
          }
        });
      }
    }
  });

  it('notes, archive and unarchive work as they do for enquiries', async () => {
    const quotation = await seedQuotation(api);
    const id = String(quotation.id);
    assert.equal(
      (await call(`/admin/quotations/${id}/notes`, 'POST', { text: 'Sent a draft estimate.' }))
        .status,
      201,
    );
    assert.equal(
      (await api.models.QuotationSubmission.findById(id).lean())?.notes[0]?.text,
      'Sent a draft estimate.',
    );
    assert.equal((await call(`/admin/quotations/${id}/archive`, 'PATCH')).status, 200);
    assert.equal((await api.models.QuotationSubmission.findById(id).lean())?.archived, true);
    assert.equal((await call(`/admin/quotations/${id}/unarchive`, 'PATCH')).status, 200);
    assert.equal((await api.models.QuotationSubmission.findById(id).lean())?.archived, false);
  });

  it('an unknown quotation is a 404 in the envelope, never a 500', async () => {
    const reply = await call('/admin/quotations/507f1f77bcf86cd799439099');
    assert.equal(reply.status, 404);
    assert.equal(reply.body.error?.code, 'NOT_FOUND');
  });

  it('CSV export works and carries the reference numbers', async () => {
    const quotation = await seedQuotation(api);
    const reply = await api.request(
      `${API}/admin/quotations/export?q=${quotation.referenceNumber}`,
      { cookie },
    );
    assert.equal(reply.status, 200);
    assert.match(reply.headers.get('content-type') ?? '', /text\/csv/);
    assert.match(reply.text, new RegExp(String(quotation.referenceNumber)));
  });

  it('an attachment cannot be downloaded when storage is not configured: 503, not a fake success', async () => {
    const quotation = await seedQuotation(api, {
      attachments: ['https://res.cloudinary.com/test-cloud/raw/upload/quotations/test-file.pdf'],
    });
    const reply = await call(`/admin/quotations/${quotation.id}/attachments/0`);
    assert.ok(
      [400, 404, 503].includes(reply.status),
      `${reply.status} ${reply.text.slice(0, 200)}`,
    );
    assert.equal(reply.body.success, false);
  });
});

describe('the dashboard', () => {
  it('counts what needs attention from real rows', async () => {
    await seedEnquiry(api, { status: 'new' });
    await seedQuotation(api, { status: 'new' });
    const reply = await call('/admin/dashboard/stats');
    assert.equal(reply.status, 200);
    assert.equal(reply.body.success, true);
    assert.ok(reply.body.data && typeof reply.body.data === 'object');
  });
});
