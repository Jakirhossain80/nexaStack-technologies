import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PERMISSIONS,
  ROLES,
  ROLE_PERMISSIONS,
  hasAnyPermission,
  hasPermission,
  permissionsFor,
  type Permission,
  type Role,
} from '@nexastack/shared';

/**
 * The AGREED matrix, written out independently of the implementation. If someone edits
 * `ROLE_PERMISSIONS`, this test makes the change visible and deliberate: the matrix is a decision, not
 * an accident. (`media:read` is the one row added to the original draft, so the cover-image picker keeps
 * working for content editors.)
 */
const S = 'super_admin';
const A = 'admin';
const C = 'content_editor';

const MATRIX: Record<Permission, readonly Role[]> = {
  'manage:admins': [S],
  'settings:manage': [S],
  'manage:enquiries': [S, A],
  'manage:quotations': [S, A],
  'manage:media': [S, A],
  'media:read': [S, A, C],
  'media:delete': [S, A],
  'content:create': [S, A, C],
  'content:edit': [S, A, C],
  'content:publish': [S, A],
  'content:delete': [S, A],
  'audit:view': [S, A],
};

describe('the permission matrix', () => {
  it('grants exactly the agreed capabilities to each role, and nothing more', () => {
    for (const permission of PERMISSIONS) {
      for (const role of ROLES) {
        const expected = MATRIX[permission].includes(role);
        assert.equal(hasPermission(role, permission), expected, `${role} / ${permission}`);
      }
    }
  });

  it('lists every capability in the agreed matrix and no other', () => {
    assert.deepEqual([...PERMISSIONS].sort(), Object.keys(MATRIX).sort());
    assert.equal(PERMISSIONS.length, 12);
  });

  it('has an entry for every role, with no unknown or duplicated capability', () => {
    assert.deepEqual(Object.keys(ROLE_PERMISSIONS).sort(), [...ROLES].sort());
    for (const role of ROLES) {
      const list = ROLE_PERMISSIONS[role];
      assert.equal(new Set(list).size, list.length, `${role} lists a capability twice`);
      for (const permission of list) assert.ok(PERMISSIONS.includes(permission), `${role}: ${permission}`);
    }
  });

  it('is strictly nested: content_editor is within admin, which is within super_admin', () => {
    const within = (inner: Role, outer: Role) =>
      ROLE_PERMISSIONS[inner].every((permission) => ROLE_PERMISSIONS[outer].includes(permission));
    assert.ok(within('content_editor', 'admin'));
    assert.ok(within('admin', 'super_admin'));
    assert.ok(ROLE_PERMISSIONS.super_admin.length > ROLE_PERMISSIONS.admin.length);
    assert.ok(ROLE_PERMISSIONS.admin.length > ROLE_PERMISSIONS.content_editor.length);
  });

  it('super_admin holds every capability that exists', () => {
    assert.deepEqual([...ROLE_PERMISSIONS.super_admin].sort(), [...PERMISSIONS].sort());
  });

  it('only super_admin can manage accounts and settings', () => {
    for (const role of ['admin', 'content_editor'] as const) {
      assert.equal(hasPermission(role, 'manage:admins'), false);
      assert.equal(hasPermission(role, 'settings:manage'), false);
    }
  });

  it('a content editor can create and edit content but never publish, delete or touch anything else', () => {
    assert.deepEqual([...permissionsFor('content_editor')].sort(), ['content:create', 'content:edit', 'media:read']);
    for (const denied of ['content:publish', 'content:delete', 'manage:media', 'media:delete', 'manage:enquiries', 'manage:quotations', 'audit:view'] as const) {
      assert.equal(hasPermission('content_editor', denied), false, denied);
    }
  });

  it('"any of" is true when one matches and false when none do', () => {
    assert.equal(hasAnyPermission('admin', ['manage:admins', 'manage:media']), true);
    assert.equal(hasAnyPermission('content_editor', ['manage:enquiries', 'manage:quotations']), false);
    assert.equal(hasAnyPermission('admin', []), false);
  });
});
