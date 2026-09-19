import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PASSWORD_MAX_LENGTH, changePasswordSchema, loginSchema } from '@nexastack/shared';

import {
  TEMP_PASSWORD_ALPHABET,
  TEMP_PASSWORD_LENGTH,
  generateTemporaryPassword,
} from './tempPassword.js';

describe('generateTemporaryPassword', () => {
  it('is 16 characters, all from the alphabet', () => {
    for (let i = 0; i < 200; i += 1) {
      const password = generateTemporaryPassword();
      assert.equal(password.length, TEMP_PASSWORD_LENGTH);
      assert.ok([...password].every((character) => TEMP_PASSWORD_ALPHABET.includes(character)), password);
    }
  });

  it('has a 56-character alphabet with no look-alikes (0 O 1 l I) and no symbols or spaces', () => {
    assert.equal(TEMP_PASSWORD_ALPHABET.length, 56);
    assert.equal(new Set(TEMP_PASSWORD_ALPHABET).size, 56, 'no repeated characters');
    for (const ambiguous of ['0', 'O', '1', 'l', 'I']) {
      assert.equal(TEMP_PASSWORD_ALPHABET.includes(ambiguous), false, ambiguous);
    }
    assert.match(TEMP_PASSWORD_ALPHABET, /^[A-Za-z2-9]+$/);
  });

  it('does not repeat: 5,000 in a row are all different', () => {
    const seen = new Set(Array.from({ length: 5_000 }, generateTemporaryPassword));
    assert.equal(seen.size, 5_000);
  });

  it('uses the whole alphabet, not a subset (every character appears in a large sample)', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4_000; i += 1) {
      for (const character of generateTemporaryPassword()) counts.set(character, (counts.get(character) ?? 0) + 1);
    }
    assert.equal(counts.size, TEMP_PASSWORD_ALPHABET.length);
    // 64,000 draws over 56 symbols is ~1,143 each: a wildly lopsided count would mean a biased generator.
    for (const [character, count] of counts) assert.ok(count > 800 && count < 1_500, `${character}: ${count}`);
  });

  it('is accepted by the sign-in form and by the change-password rules it is used with', () => {
    const password = generateTemporaryPassword();
    assert.equal(loginSchema.safeParse({ email: 'a@b.co', password }).success, true);
    assert.equal(changePasswordSchema.safeParse({ currentPassword: password, newPassword: 'a-new-passphrase-1' }).success, true);
  });
});

describe('changePasswordSchema', () => {
  const ok = { currentPassword: 'Temp-Pass-123', newPassword: 'A much better one 42' };

  it('accepts a valid change', () => {
    assert.equal(changePasswordSchema.safeParse(ok).success, true);
  });

  it('requires the current password, even for the forced first change', () => {
    assert.equal(changePasswordSchema.safeParse({ ...ok, currentPassword: '' }).success, false);
    assert.equal(changePasswordSchema.safeParse({ newPassword: ok.newPassword }).success, false);
  });

  it('rejects a new password that is too short, or the same as the current one', () => {
    assert.equal(changePasswordSchema.safeParse({ ...ok, newPassword: 'short' }).success, false);
    const same = changePasswordSchema.safeParse({ currentPassword: 'SamePassword1', newPassword: 'SamePassword1' });
    assert.equal(same.success, false);
    assert.deepEqual(!same.success && same.error.issues.map((issue) => issue.path.join('.')), ['newPassword']);
  });

  it('refuses a password longer than bcrypt reads (72), instead of silently truncating it', () => {
    assert.equal(changePasswordSchema.safeParse({ ...ok, newPassword: 'a'.repeat(PASSWORD_MAX_LENGTH) }).success, true);
    assert.equal(changePasswordSchema.safeParse({ ...ok, newPassword: 'a'.repeat(PASSWORD_MAX_LENGTH + 1) }).success, false);
  });

  it('rejects non-string values (an injected object)', () => {
    assert.equal(changePasswordSchema.safeParse({ currentPassword: { $ne: '' }, newPassword: ok.newPassword }).success, false);
  });
});
