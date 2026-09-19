import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  QUOTATION_ATTENTION_STATUSES,
  QUOTATION_STATUS_TRANSITIONS,
  QUOTATION_STATUSES,
  canTransitionQuotation,
  getAvailableQuotationTransitions,
  type QuotationStatus,
} from '@nexastack/shared';

import { buildQuotationFilter, normalizeStatus } from './quotationQuery.js';

describe('quotation status transitions', () => {
  const ALLOWED: readonly [QuotationStatus, QuotationStatus][] = [
    ['new', 'reviewing'],
    ['new', 'declined'],
    ['new', 'closed'],
    ['reviewing', 'quote-sent'],
    ['reviewing', 'declined'],
    ['reviewing', 'closed'],
    ['reviewing', 'new'],
    ['quote-sent', 'accepted'],
    ['quote-sent', 'declined'],
    ['quote-sent', 'reviewing'],
    ['quote-sent', 'closed'],
    ['accepted', 'closed'],
    ['accepted', 'quote-sent'],
    ['declined', 'reviewing'],
    ['declined', 'closed'],
    ['closed', 'reviewing'],
  ];

  it('allows exactly the documented moves and rejects every other pair', () => {
    for (const from of QUOTATION_STATUSES) {
      for (const to of QUOTATION_STATUSES) {
        const expected = ALLOWED.some(([f, t]) => f === from && t === to);
        assert.equal(canTransitionQuotation(from, to), expected, `${from} -> ${to}`);
      }
    }
  });

  it('never allows a no-op change to the same status', () => {
    for (const status of QUOTATION_STATUSES) {
      assert.equal(QUOTATION_STATUS_TRANSITIONS[status].includes(status), false);
    }
  });

  it('offers only moves the API will accept', () => {
    for (const from of QUOTATION_STATUSES) {
      for (const to of getAvailableQuotationTransitions(from)) {
        assert.equal(canTransitionQuotation(from, to), true);
      }
    }
  });

  it('every status can be left (no dead ends) and can be reached', () => {
    for (const status of QUOTATION_STATUSES) {
      assert.ok(QUOTATION_STATUS_TRANSITIONS[status].length > 0, `${status} has no way out`);
    }
    for (const target of QUOTATION_STATUSES) {
      if (target === 'new') continue; // reachable only from `reviewing`, by design
      assert.ok(
        QUOTATION_STATUSES.some((from) => canTransitionQuotation(from, target)),
        `${target} is unreachable`,
      );
    }
  });

  it('the attention statuses are new and reviewing', () => {
    assert.deepEqual([...QUOTATION_ATTENTION_STATUSES], ['new', 'reviewing']);
  });
});

describe('normalizeStatus (data written before the migration)', () => {
  it('reads the legacy "responded" as "reviewing", not "quote-sent"', () => {
    assert.equal(normalizeStatus('responded'), 'reviewing');
  });

  it('passes every current status through unchanged', () => {
    for (const status of QUOTATION_STATUSES) assert.equal(normalizeStatus(status), status);
  });

  it('reads an unrecognised value as "new" so it stays visible, never as "closed"', () => {
    assert.equal(normalizeStatus('archived'), 'new');
    assert.equal(normalizeStatus(''), 'new');
  });
});

describe('buildQuotationFilter', () => {
  it('active view treats a missing archived field as active ($ne: true, not false)', () => {
    const filter = buildQuotationFilter({ archived: false });
    assert.deepEqual(Object.fromEntries(Object.entries(filter.archived as object)), { $ne: true });
  });

  it('archived view matches only archived: true', () => {
    assert.equal(buildQuotationFilter({ archived: true }).archived, true);
  });

  it('a single status is an equality match; several become $in', () => {
    assert.equal(buildQuotationFilter({ archived: false, status: ['quote-sent'] }).status, 'quote-sent');
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(
          buildQuotationFilter({ archived: false, status: ['new', 'quote-sent'] }).status as object,
        ),
      ),
      { $in: ['new', 'quote-sent'] },
    );
  });

  it('filtering by "reviewing" also matches un-migrated "responded" rows', () => {
    const status = buildQuotationFilter({ archived: false, status: ['reviewing'] }).status as object;
    assert.deepEqual(Object.fromEntries(Object.entries(status)), {
      $in: ['reviewing', 'responded'],
    });
  });

  it('no status filter leaves status unconstrained', () => {
    assert.equal('status' in buildQuotationFilter({ archived: false }), false);
  });

  it('a project type filter is an equality match', () => {
    assert.equal(
      buildQuotationFilter({ archived: false, projectType: 'web-application' }).projectType,
      'web-application',
    );
  });

  it('search covers name, email, company, reference, objectives and project type, case-insensitively', () => {
    const filter = buildQuotationFilter({ archived: false, q: 'Acme' });
    const clauses = filter.$or as Record<string, unknown>[];
    assert.deepEqual(
      clauses.slice(0, 6).map((clause) => Object.keys(clause)[0]),
      ['fullName', 'email', 'companyName', 'referenceNumber', 'businessObjectives', 'projectType'],
    );
    assert.ok(
      clauses.slice(0, 6).every((clause) => (Object.values(clause)[0] as RegExp).flags === 'i'),
    );
  });

  it('searching by a project type’s display label finds that type', () => {
    const filter = buildQuotationFilter({ archived: false, q: 'web application' });
    const clauses = filter.$or as Record<string, unknown>[];
    const labelClause = clauses.find(
      (clause) => !(clause.projectType instanceof RegExp) && 'projectType' in clause,
    );
    assert.ok(labelClause, 'expected a label-derived projectType clause');
    assert.deepEqual(
      Object.fromEntries(Object.entries(labelClause.projectType as object)),
      { $in: ['web-application'] },
    );
  });

  it('a search term is matched literally: regex metacharacters are escaped', () => {
    const filter = buildQuotationFilter({ archived: false, q: 'a.b(c)+' });
    const pattern = (filter.$or as Record<string, RegExp>[])[0]?.fullName as RegExp;
    assert.ok(pattern.test('xx a.b(c)+ yy'));
    assert.equal(pattern.test('aXb(c)+'), false, '"." must not match any character');
  });

  it('a catastrophic-backtracking pattern is inert text, not a pattern', () => {
    const pattern = (
      buildQuotationFilter({ archived: false, q: '(a+)+$' }).$or as Record<string, RegExp>[]
    )[0]?.fullName as RegExp;
    const started = Date.now();
    pattern.test('a'.repeat(40) + '!');
    assert.ok(Date.now() - started < 100, 'must not backtrack');
  });
});
