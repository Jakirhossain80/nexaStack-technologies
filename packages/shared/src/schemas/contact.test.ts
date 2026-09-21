import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issuesByPath, parseValid } from '../test-utils/issues.js';

import { contactFormSchema, contactSchema } from './contact.js';

const validForm = {
  fullName: 'Test User',
  email: 'test@example.com',
  subject: 'Test enquiry',
  message: 'This is a synthetic test message.',
  preferredContactMethod: 'email',
  consent: true,
};

describe('contactFormSchema (the live /contact form)', () => {
  it('accepts a minimal valid submission and leaves optional fields undefined', () => {
    const data = parseValid(contactFormSchema, validForm);
    assert.equal(data.phone, undefined);
    assert.equal(data.companyName, undefined);
  });

  it('trims text fields and turns a blank optional field into undefined', () => {
    const data = parseValid(contactFormSchema, {
      ...validForm,
      fullName: '  Test User  ',
      phone: '   ',
      companyName: '',
    });
    assert.equal(data.fullName, 'Test User');
    assert.equal(data.phone, undefined);
    assert.equal(data.companyName, undefined);
  });

  const rejected: [string, Record<string, unknown>, string, RegExp][] = [
    ['a one-character name', { fullName: 'T' }, 'fullName', /at least 2 characters/],
    ['a whitespace-only name', { fullName: '   ' }, 'fullName', /at least 2 characters/],
    [
      'a name over 120 characters',
      { fullName: 'a'.repeat(121) },
      'fullName',
      /120 characters or fewer/,
    ],
    ['a malformed email', { email: 'not-an-email' }, 'email', /valid email address/],
    [
      'an email over 254 characters',
      { email: `${'a'.repeat(250)}@example.com` },
      'email',
      /254 characters or fewer/,
    ],
    ['a two-character subject', { subject: 'Hi' }, 'subject', /at least 3 characters/],
    [
      'a subject over 160 characters',
      { subject: 'a'.repeat(161) },
      'subject',
      /160 characters or fewer/,
    ],
    ['a nine-character message', { message: '123456789' }, 'message', /at least 10 characters/],
    [
      'a message over 2,000 characters',
      { message: 'a'.repeat(2001) },
      'message',
      /2,000 characters or fewer/,
    ],
    [
      'an unknown contact method',
      { preferredContactMethod: 'fax' },
      'preferredContactMethod',
      /how you would like to be contacted/,
    ],
    ['consent = false', { consent: false }, 'consent', /confirm you agree/],
    ['consent as the string "true"', { consent: 'true' }, 'consent', /confirm you agree/],
    ['a phone over 30 characters', { phone: '1'.repeat(31) }, 'phone', /30 characters or fewer/],
    [
      'a company name over 160 characters',
      { companyName: 'a'.repeat(161) },
      'companyName',
      /160 characters or fewer/,
    ],
  ];
  for (const [label, override, path, message] of rejected) {
    it(`rejects ${label} with a message that says what to do`, () => {
      const issues = issuesByPath(contactFormSchema, { ...validForm, ...override });
      assert.match(issues[path]?.[0] ?? '', message);
    });
  }

  it('rejects a missing required field with its own message (not a generic type error)', () => {
    const { email: _email, ...withoutEmail } = validForm;
    assert.match(
      issuesByPath(contactFormSchema, withoutEmail)['email']?.[0] ?? '',
      /enter your email address/,
    );
    const { consent: _consent, ...withoutConsent } = validForm;
    assert.match(
      issuesByPath(contactFormSchema, withoutConsent)['consent']?.[0] ?? '',
      /confirm you agree/,
    );
  });

  it('requires a phone when the preferred method is phone or WhatsApp, and reports it on the method field', () => {
    for (const method of ['phone', 'whatsapp']) {
      const issues = issuesByPath(contactFormSchema, {
        ...validForm,
        preferredContactMethod: method,
      });
      assert.match(issues['preferredContactMethod']?.[0] ?? '', /Add a phone or WhatsApp number/);
      const data = parseValid(contactFormSchema, {
        ...validForm,
        preferredContactMethod: method,
        phone: '+8801000000000',
      });
      assert.equal(data.phone, '+8801000000000');
    }
  });

  it('does not require a phone when the preferred method is email', () => {
    parseValid(contactFormSchema, { ...validForm, preferredContactMethod: 'email' });
  });

  it('rejects non-object input outright', () => {
    for (const bad of [null, undefined, 'x', 42, []]) {
      assert.equal(contactFormSchema.safeParse(bad).success, false);
    }
  });

  it('drops unknown keys (mass-assignment guard: the parsed value holds only known fields)', () => {
    const data = parseValid(contactFormSchema, {
      ...validForm,
      status: 'closed',
      archived: true,
      $set: { x: 1 },
    });
    assert.deepEqual(Object.keys(data).sort(), [
      'consent',
      'email',
      'fullName',
      'message',
      'preferredContactMethod',
      'subject',
    ]);
  });
});

describe('contactSchema (the Express scaffold, unused by the live site)', () => {
  const valid = {
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test enquiry',
    message: 'This is a synthetic test message that is long enough.',
  };

  it('accepts a valid body', () => {
    parseValid(contactSchema, valid);
  });

  it('keeps its own, stricter 20-character message minimum (it is not the live form schema)', () => {
    const issues = issuesByPath(contactSchema, { ...valid, message: 'too short message' });
    assert.match(issues['message']?.[0] ?? '', /at least 20 characters/);
  });

  it('rejects a bad email and a missing name', () => {
    assert.match(
      issuesByPath(contactSchema, { ...valid, email: 'nope' })['email']?.[0] ?? '',
      /valid email address/,
    );
    const { name: _name, ...withoutName } = valid;
    assert.match(issuesByPath(contactSchema, withoutName)['name']?.[0] ?? '', /enter your name/);
  });
});
