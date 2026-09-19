import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateSessionAccess } from './sessionAccess.js';

const NORMAL = { allowPasswordChange: false };
const PASSWORD_ROUTE = { allowPasswordChange: true };

describe('evaluateSessionAccess', () => {
  it('an active account with a real password may act', () => {
    assert.equal(evaluateSessionAccess({ status: 'active', mustChangePassword: false }, NORMAL), 'ok');
  });

  it('accounts created before these fields existed (both missing) are active and unrestricted', () => {
    assert.equal(evaluateSessionAccess({}, NORMAL), 'ok');
    assert.equal(evaluateSessionAccess({ status: undefined, mustChangePassword: undefined }, NORMAL), 'ok');
    assert.equal(evaluateSessionAccess({ status: null, mustChangePassword: null }, NORMAL), 'ok');
  });

  it('a suspended account is refused on every route, including the password-change ones', () => {
    assert.equal(evaluateSessionAccess({ status: 'suspended', mustChangePassword: false }, NORMAL), 'suspended');
    assert.equal(evaluateSessionAccess({ status: 'suspended', mustChangePassword: false }, PASSWORD_ROUTE), 'suspended');
    assert.equal(evaluateSessionAccess({ status: 'suspended', mustChangePassword: true }, PASSWORD_ROUTE), 'suspended');
  });

  it('an account on its temporary password may reach only the routes that allow a password change', () => {
    assert.equal(evaluateSessionAccess({ status: 'active', mustChangePassword: true }, NORMAL), 'password_change_required');
    assert.equal(evaluateSessionAccess({ status: 'active', mustChangePassword: true }, PASSWORD_ROUTE), 'ok');
  });

  it('suspension wins over a pending password change', () => {
    assert.equal(evaluateSessionAccess({ status: 'suspended', mustChangePassword: true }, NORMAL), 'suspended');
  });

  it('an unrecognised status is not treated as suspended (only the exact value suspends)', () => {
    assert.equal(evaluateSessionAccess({ status: 'weird' }, NORMAL), 'ok');
  });
});
