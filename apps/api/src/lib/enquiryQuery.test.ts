import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ENQUIRY_STATUS_TRANSITIONS,
  ENQUIRY_STATUSES,
  canTransitionEnquiry,
  type EnquiryStatus,
} from '@nexastack/shared';

import { buildEnquiryFilter, normalizeStatus } from './enquiryQuery.js';

describe('enquiry status transitions', () => {
  const ALLOWED: readonly [EnquiryStatus, EnquiryStatus][] = [
    ['new', 'read'],
    ['new', 'contacted'],
    ['new', 'closed'],
    ['read', 'contacted'],
    ['read', 'closed'],
    ['contacted', 'closed'],
    ['contacted', 'read'],
    ['closed', 'read'],
    ['closed', 'contacted'],
  ];

  it('allows exactly the documented moves and rejects every other pair', () => {
    for (const from of ENQUIRY_STATUSES) {
      for (const to of ENQUIRY_STATUSES) {
        const expected = ALLOWED.some(([f, t]) => f === from && t === to);
        assert.equal(canTransitionEnquiry(from, to), expected, `${from} -> ${to}`);
      }
    }
  });

  it('never allows "new" as a manual target (it means "never opened")', () => {
    for (const from of ENQUIRY_STATUSES) {
      assert.equal(canTransitionEnquiry(from, 'new'), false, `${from} -> new`);
    }
  });

  it('never allows a no-op change to the same status', () => {
    for (const status of ENQUIRY_STATUSES) {
      assert.equal(ENQUIRY_STATUS_TRANSITIONS[status].includes(status), false);
    }
  });
});

describe('normalizeStatus (data written before the migration)', () => {
  it('reads the legacy "responded" as "contacted"', () => {
    assert.equal(normalizeStatus('responded'), 'contacted');
  });

  it('passes every current status through unchanged', () => {
    for (const status of ENQUIRY_STATUSES) assert.equal(normalizeStatus(status), status);
  });

  it('reads an unrecognised value as "new" so it stays visible, never as "closed"', () => {
    assert.equal(normalizeStatus('archived'), 'new');
    assert.equal(normalizeStatus(''), 'new');
  });
});

describe('buildEnquiryFilter', () => {
  it('active view treats a missing archived field as active ($ne: true, not false)', () => {
    const filter = buildEnquiryFilter({ archived: false });
    assert.deepEqual(Object.fromEntries(Object.entries(filter.archived as object)), { $ne: true });
  });

  it('archived view matches only archived: true', () => {
    assert.equal(buildEnquiryFilter({ archived: true }).archived, true);
  });

  it('a single status is an equality match; several become $in', () => {
    assert.equal(buildEnquiryFilter({ archived: false, status: ['read'] }).status, 'read');
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(
          buildEnquiryFilter({ archived: false, status: ['new', 'read'] }).status as object,
        ),
      ),
      { $in: ['new', 'read'] },
    );
  });

  it('no status filter leaves status unconstrained', () => {
    assert.equal('status' in buildEnquiryFilter({ archived: false }), false);
  });

  it('search covers name, email, subject and message, case-insensitively', () => {
    const filter = buildEnquiryFilter({ archived: false, q: 'Acme' });
    const clauses = filter.$or as Record<string, RegExp>[];
    assert.deepEqual(
      clauses.map((clause) => Object.keys(clause)[0]),
      ['fullName', 'email', 'subject', 'message'],
    );
    assert.ok(clauses.every((clause) => Object.values(clause)[0]?.flags === 'i'));
  });

  it('a search term is matched literally: regex metacharacters are escaped', () => {
    const filter = buildEnquiryFilter({ archived: false, q: 'a.b(c)+' });
    const pattern = (filter.$or as Record<string, RegExp>[])[0]?.fullName as RegExp;
    assert.ok(pattern.test('xx a.b(c)+ yy'));
    assert.equal(pattern.test('aXb(c)+'), false, '"." must not match any character');
    assert.equal(pattern.test('abc'), false);
  });

  it('a catastrophic-backtracking pattern is inert text, not a pattern', () => {
    const pattern = (
      buildEnquiryFilter({ archived: false, q: '(a+)+$' }).$or as Record<string, RegExp>[]
    )[0]?.fullName as RegExp;
    const started = Date.now();
    pattern.test('a'.repeat(40) + '!');
    assert.ok(Date.now() - started < 100, 'must not backtrack');
  });
});
