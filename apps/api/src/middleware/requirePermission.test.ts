import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ROLES, hasPermission, type Role } from '@nexastack/shared';
import type { Request, Response } from 'express';

import { requireAnyPermission, requirePermission } from './requirePermission.js';

/** Runs a gate for a fake request and reports how it ended. */
function run(
  gate: ReturnType<typeof requirePermission>,
  admin: { role: Role } | undefined,
): 'allowed' | 'unauthenticated' | 'forbidden' {
  let outcome: 'allowed' | 'unauthenticated' | 'forbidden' | 'none' = 'none';
  gate(
    { admin } as unknown as Request,
    {} as Response,
    (err?: unknown) => {
      outcome = err ? ((err as { statusCode: number }).statusCode === 401 ? 'unauthenticated' : 'forbidden') : 'allowed';
    },
  );
  assert.notEqual(outcome, 'none', 'the gate must call next() exactly once');
  return outcome as 'allowed' | 'unauthenticated' | 'forbidden';
}

const admin = (role: Role) => ({ id: 'a', email: 'a@b.c', role, mustChangePassword: false, permissions: [] });

describe('requirePermission', () => {
  it('lets a role through exactly when it holds the capability', () => {
    for (const permission of ['manage:admins', 'media:delete', 'content:publish', 'media:read', 'audit:view'] as const) {
      const gate = requirePermission(permission);
      for (const role of ROLES) {
        assert.equal(run(gate, admin(role)), hasPermission(role, permission) ? 'allowed' : 'forbidden', `${role} / ${permission}`);
      }
    }
  });

  it('answers 401 when nobody is signed in, never 403', () => {
    assert.equal(run(requirePermission('media:read'), undefined), 'unauthenticated');
  });

  it('with several capabilities requires ALL of them', () => {
    const gate = requirePermission('content:create', 'content:publish');
    assert.equal(run(gate, admin('admin')), 'allowed');
    assert.equal(run(gate, admin('content_editor')), 'forbidden'); // has create, lacks publish
  });

  it('requireAnyPermission needs only one', () => {
    const gate = requireAnyPermission('manage:enquiries', 'manage:quotations');
    assert.equal(run(gate, admin('admin')), 'allowed');
    assert.equal(run(gate, admin('content_editor')), 'forbidden');
  });

  it('is tagged with what it requires, so every route can be audited', () => {
    const all = requirePermission('manage:media');
    const any = requireAnyPermission('audit:view', 'manage:admins');
    assert.deepEqual([...all.requiredPermissions], ['manage:media']);
    assert.equal(all.mode, 'all');
    assert.deepEqual([...any.requiredPermissions], ['audit:view', 'manage:admins']);
    assert.equal(any.mode, 'any');
  });

  it('a forbidden answer does not reveal which capability was missing', () => {
    let message = '';
    requirePermission('manage:admins')({ admin: admin('admin') } as unknown as Request, {} as Response, (err?: unknown) => {
      message = (err as Error).message;
    });
    assert.equal(/manage:admins|super_admin|permission:/i.test(message), false, message);
  });
});
