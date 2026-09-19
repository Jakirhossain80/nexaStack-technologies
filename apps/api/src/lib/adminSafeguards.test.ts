import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AdminStatus, Role } from '@nexastack/shared';

import {
  SAFEGUARD_MESSAGES,
  findSafeguardViolation,
  lockedReasonFor,
  type AccountChange,
} from './adminSafeguards.js';

const account = (id: string, role: Role, status: AdminStatus = 'active') => ({ id, role, status });
const demote: AccountChange = { kind: 'role', role: 'admin' };
const suspend: AccountChange = { kind: 'status', status: 'suspended' };

describe('the last active super admin can never be suspended or demoted', () => {
  it('blocks suspending the only active super admin, and demoting them', () => {
    for (const change of [suspend, demote, { kind: 'role', role: 'content_editor' } as AccountChange]) {
      assert.equal(
        findSafeguardViolation({ actorId: 'other', target: account('sa', 'super_admin'), change, activeSuperAdminCount: 1 }),
        'last_super_admin',
      );
    }
  });

  it('allows it once there is another active super admin', () => {
    for (const change of [suspend, demote]) {
      assert.equal(
        findSafeguardViolation({ actorId: 'other', target: account('sa', 'super_admin'), change, activeSuperAdminCount: 2 }),
        null,
      );
    }
  });

  it('a change that KEEPS them a super admin is never a violation', () => {
    assert.equal(
      findSafeguardViolation({ actorId: 'other', target: account('sa', 'super_admin'), change: { kind: 'role', role: 'super_admin' }, activeSuperAdminCount: 1 }),
      null,
    );
    assert.equal(
      findSafeguardViolation({ actorId: 'other', target: account('sa', 'super_admin'), change: { kind: 'status', status: 'active' }, activeSuperAdminCount: 1 }),
      null,
    );
  });

  it('does not protect accounts that are not active super admins', () => {
    for (const target of [account('ad', 'admin'), account('ce', 'content_editor'), account('sus', 'super_admin', 'suspended')]) {
      const changes: AccountChange[] = [suspend, demote];
      for (const change of changes) {
        const violation = findSafeguardViolation({ actorId: 'other', target, change, activeSuperAdminCount: 1 });
        assert.equal(violation, null, `${target.role}/${target.status}`);
      }
    }
  });

  it('promoting an admin to super admin is always allowed', () => {
    assert.equal(
      findSafeguardViolation({ actorId: 'sa', target: account('ad', 'admin'), change: { kind: 'role', role: 'super_admin' }, activeSuperAdminCount: 1 }),
      null,
    );
  });
});

describe('nobody can suspend or change the role of their own account', () => {
  it('refuses a self-change even when other super admins exist', () => {
    for (const change of [suspend, demote]) {
      assert.equal(
        findSafeguardViolation({ actorId: 'sa', target: account('sa', 'super_admin'), change, activeSuperAdminCount: 3 }),
        'self',
      );
    }
    assert.equal(
      findSafeguardViolation({ actorId: 'ad', target: account('ad', 'admin'), change: suspend, activeSuperAdminCount: 1 }),
      'self',
    );
  });

  it('when both apply, the more useful reason (last super admin) is reported', () => {
    assert.equal(
      findSafeguardViolation({ actorId: 'sa', target: account('sa', 'super_admin'), change: suspend, activeSuperAdminCount: 1 }),
      'last_super_admin',
    );
  });
});

describe('lockedReasonFor (what the users list shows)', () => {
  it('marks the only active super admin, yourself, and nobody else', () => {
    assert.equal(lockedReasonFor({ actorId: 'x', target: account('sa', 'super_admin'), activeSuperAdminCount: 1 }), 'last_super_admin');
    assert.equal(lockedReasonFor({ actorId: 'sa', target: account('sa', 'super_admin'), activeSuperAdminCount: 2 }), 'self');
    assert.equal(lockedReasonFor({ actorId: 'x', target: account('sa', 'super_admin'), activeSuperAdminCount: 2 }), null);
    assert.equal(lockedReasonFor({ actorId: 'x', target: account('ad', 'admin'), activeSuperAdminCount: 1 }), null);
  });

  it('never offers an action the API would refuse: refused by the rules implies shown as locked', () => {
    let refusals = 0;
    for (const role of ['super_admin', 'admin', 'content_editor'] as const) {
      for (const status of ['active', 'suspended'] as const) {
        for (const actorIsTarget of [true, false]) {
          for (const count of [1, 2]) {
            const target = account('t', role, status);
            const actorId = actorIsTarget ? 't' : 'someone-else';
            const locked = lockedReasonFor({ actorId, target, activeSuperAdminCount: count });
            for (const change of [suspend, demote, { kind: 'role', role: 'content_editor' } as AccountChange]) {
              const refused = findSafeguardViolation({ actorId, target, change, activeSuperAdminCount: count });
              if (refused !== null) {
                refusals += 1;
                assert.equal(locked, refused, `${role}/${status}/self=${actorIsTarget}/count=${count}`);
              }
            }
          }
        }
      }
    }
    assert.ok(refusals > 0, 'the property was actually exercised');
  });

  it('every reason has a plain-language explanation for the UI', () => {
    assert.match(SAFEGUARD_MESSAGES.last_super_admin, /only active super admin/);
    assert.match(SAFEGUARD_MESSAGES.self, /your own account/);
  });
});
