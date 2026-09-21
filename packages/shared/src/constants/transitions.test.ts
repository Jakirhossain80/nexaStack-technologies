import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONTENT_STATUSES,
  CONTENT_STATUS_TRANSITIONS,
  canTransition,
  getAvailableTransitions,
} from './contentStatus.js';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_TRANSITIONS,
  canTransitionEnquiry,
  getAvailableEnquiryTransitions,
} from './enquiryStatus.js';
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_TRANSITIONS,
  canTransitionQuotation,
  getAvailableQuotationTransitions,
} from './quotationStatus.js';

/** Properties every status table must have, whatever its particular workflow. */
function checkTable<S extends string>(
  name: string,
  statuses: readonly S[],
  table: Readonly<Record<S, readonly S[]>>,
  can: (from: S, to: S) => boolean,
  available: (from: S) => readonly S[],
  /** Statuses only the system may set (never a target of a manual change), by design. */
  systemSetOnly: readonly S[] = [],
) {
  describe(`${name} transitions`, () => {
    it('has an entry for every status, and only lists real statuses', () => {
      assert.deepEqual(Object.keys(table).sort(), [...statuses].sort());
      for (const from of statuses) {
        for (const to of table[from])
          assert.ok(statuses.includes(to), `${from} -> ${to} targets an unknown status`);
      }
    });

    it('never lets a status transition to itself, or list a target twice', () => {
      for (const from of statuses) {
        assert.equal(can(from, from), false, `${from} -> ${from}`);
        assert.equal(
          new Set(table[from]).size,
          table[from].length,
          `${from} lists a duplicate target`,
        );
      }
    });

    it('canTransition and getAvailableTransitions agree with the table, for every pair', () => {
      for (const from of statuses) {
        assert.deepEqual(available(from), table[from]);
        for (const to of statuses)
          assert.equal(can(from, to), table[from].includes(to), `${from} -> ${to}`);
      }
    });

    it('leaves no status stranded: every status can be reached from some other status', () => {
      for (const to of statuses.filter((status) => !systemSetOnly.includes(status))) {
        assert.ok(
          statuses.some((from) => from !== to && table[from].includes(to)),
          `${to} is unreachable`,
        );
      }
    });
  });
}

checkTable(
  'content',
  CONTENT_STATUSES,
  CONTENT_STATUS_TRANSITIONS,
  canTransition,
  getAvailableTransitions,
);
// `new` is set by the system at submission and is never a manual target (see enquiryStatus.ts).
checkTable(
  'enquiry',
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_TRANSITIONS,
  canTransitionEnquiry,
  getAvailableEnquiryTransitions,
  ['new'],
);
checkTable(
  'quotation',
  QUOTATION_STATUSES,
  QUOTATION_STATUS_TRANSITIONS,
  canTransitionQuotation,
  getAvailableQuotationTransitions,
);

describe('content workflow specifics (the publishing state machine the public site depends on)', () => {
  it('a draft can be published or archived, never "unpublished"', () => {
    assert.equal(canTransition('draft', 'published'), true);
    assert.equal(canTransition('draft', 'archived'), true);
    assert.equal(canTransition('draft', 'unpublished'), false);
  });

  it('a published post can only be unpublished or archived, never sent back to draft', () => {
    assert.deepEqual([...getAvailableTransitions('published')], ['unpublished', 'archived']);
  });

  it('an archived post can only be restored to draft: it cannot be published directly', () => {
    assert.deepEqual([...getAvailableTransitions('archived')], ['draft']);
    assert.equal(canTransition('archived', 'published'), false);
  });

  it('an unpublished post can be republished', () => {
    assert.equal(canTransition('unpublished', 'published'), true);
  });
});

describe('enquiry workflow specifics', () => {
  it('"new" is system-set only: no status can transition back to it', () => {
    for (const from of ENQUIRY_STATUSES)
      assert.equal(canTransitionEnquiry(from, 'new'), false, from);
  });

  it('a closed enquiry can be reopened (read or contacted)', () => {
    assert.deepEqual([...getAvailableEnquiryTransitions('closed')].sort(), ['contacted', 'read']);
  });
});

describe('quotation workflow specifics', () => {
  it('a new request cannot jump straight to "accepted" or "quote-sent"', () => {
    assert.equal(canTransitionQuotation('new', 'accepted'), false);
    assert.equal(canTransitionQuotation('new', 'quote-sent'), false);
  });

  it('a closed request can only be reopened to "reviewing"', () => {
    assert.deepEqual([...getAvailableQuotationTransitions('closed')], ['reviewing']);
  });

  it('acceptance requires a sent quote', () => {
    for (const from of QUOTATION_STATUSES) {
      assert.equal(canTransitionQuotation(from, 'accepted'), from === 'quote-sent', from);
    }
  });
});
