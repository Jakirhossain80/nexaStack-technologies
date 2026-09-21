import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { company } from '@/config/company';
import { buildClientContactLinks } from '@/lib/quotationContact';
import {
  getTelHrefForNumber,
  getWhatsAppLink,
  getWhatsAppLinkForNumber,
  toInternationalDigits,
} from '@/lib/whatsapp';

/**
 * LINK CONSTRUCTION ONLY. An automated test cannot complete a WhatsApp conversation: that happens inside a
 * third-party app. What can be proven is that every `wa.me` URL the site builds is well formed and that the
 * message survives the round trip through URL encoding.
 */

const NEXASTACK_DIGITS = '8801712119253';

/** The message a WhatsApp client would prefill: the decoded `text` parameter of the link. */
function decodedText(link: string): string | null {
  return new URL(link).searchParams.get('text');
}

describe('getWhatsAppLink (a chat with NexaStack)', () => {
  it('builds the bare link with digits only: no "+", no leading zero, no doubled country code', () => {
    const link = getWhatsAppLink();
    assert.equal(link, `https://wa.me/${NEXASTACK_DIGITS}`);
    assert.doesNotMatch(link, /\+/);
    assert.notEqual(
      new URL(link).pathname,
      '/88001712119253',
      'the well-known 880 + 0 + number mistake',
    );
  });

  it('treats an empty message like no message (no dangling "?text=")', () => {
    assert.equal(getWhatsAppLink(''), `https://wa.me/${NEXASTACK_DIGITS}`);
    assert.equal(getWhatsAppLink(undefined), `https://wa.me/${NEXASTACK_DIGITS}`);
  });

  const messages: [string, string][] = [
    ['plain text', 'Hello NexaStack Technologies'],
    ['an ampersand (would otherwise start a new parameter)', 'Design & build'],
    ['a question mark', 'Can you build this?'],
    ['a hash (would otherwise start a fragment)', 'Project #1'],
    ['a percent sign', '50% deposit'],
    ['a plus sign (would otherwise decode to a space)', '1+1=2'],
    ['an equals sign', 'a=b'],
    ['double and single quotes', `She said "hi" and it's fine`],
    ['a newline and a tab', 'Line one\nLine two\tTabbed'],
    ['emoji', 'Hello 👋 from Dhaka 🇧🇩'],
    ['Bengali script', 'আমি একটি ওয়েবসাইট বানাতে চাই'],
    ['an injection attempt for another parameter', 'x&phone=8800000000000&text=owned'],
    ['a URL inside the message', 'See https://example.com/a?b=c&d=e#f'],
    ['a very long message', 'word '.repeat(400).trim()],
  ];
  for (const [label, message] of messages) {
    it(`round-trips ${label}`, () => {
      const link = getWhatsAppLink(message);
      assert.ok(link.startsWith(`https://wa.me/${NEXASTACK_DIGITS}?text=`));
      assert.equal(decodedText(link), message);
      assert.doesNotMatch(
        link,
        /[\s"<>]/,
        'no raw whitespace or markup-significant characters in the URL',
      );
      const url = new URL(link);
      assert.deepEqual(
        [...url.searchParams.keys()],
        ['text'],
        'the message must not be able to add parameters',
      );
      assert.equal(url.hash, '');
      assert.equal(
        url.pathname,
        `/${NEXASTACK_DIGITS}`,
        'the message must not be able to change the number',
      );
    });
  }

  it('produces the exact, expected encoding for the site prefilled message', () => {
    assert.equal(
      company.whatsapp.chatHref,
      'https://wa.me/8801712119253?text=Hello%20NexaStack%20Technologies%2C%20I%20would%20like%20to%20discuss%20a%20web%20development%20project.',
    );
  });
});

describe('every WhatsApp link the config and widget are built from', () => {
  it('company.whatsapp.href is the bare NexaStack link and chatHref decodes to the prefilled message', () => {
    assert.equal(company.whatsapp.href, `https://wa.me/${NEXASTACK_DIGITS}`);
    assert.equal(decodedText(company.whatsapp.chatHref), company.whatsapp.prefilledMessage);
  });

  it('the WhatsApp number, the tel: link and the E.164 number all describe the same phone', () => {
    const digits = company.phone.e164.replace(/\D/g, '');
    assert.equal(digits, NEXASTACK_DIGITS);
    assert.equal(company.phone.href, `tel:+${NEXASTACK_DIGITS}`);
    assert.equal(new URL(company.whatsapp.href).pathname, `/${digits}`);
  });
});

describe('toInternationalDigits (the CLIENT direction: turning a typed number into a wa.me number)', () => {
  const expectations: [string, string, string, string | null][] = [
    ['Bangladeshi domestic mobile', '01712119253', 'Bangladesh', '8801712119253'],
    ['Bangladeshi domestic mobile with separators', '01712-119 253', 'Bangladesh', '8801712119253'],
    ['already-international with a plus', '+880 1712-119253', 'Bangladesh', '8801712119253'],
    [
      'already-international with a plus, from another country',
      '+880 1712-119253',
      'United Kingdom',
      '8801712119253',
    ],
    ['already-international with 00', '00880 1712 119253', 'Bangladesh', '8801712119253'],
    ['880-prefixed digits for Bangladesh', '8801712119253', 'Bangladesh', '8801712119253'],
    ['a UK number with a plus', '+44 20 7946 0958', 'United Kingdom', '442079460958'],
    ['a US number with 00', '001 202 555 0100', 'United States', '12025550100'],
    // Refused, because guessing would message a stranger:
    [
      'a UK domestic number (a leading 0 means something different per country)',
      '020 7946 0958',
      'United Kingdom',
      null,
    ],
    ['a domestic number for a country with no rule', '0171 2119253', 'Germany', null],
    ['a Bangladeshi number that is too short', '0171211925', 'Bangladesh', null],
    ['a Bangladeshi number that is too long', '017121192530', 'Bangladesh', null],
    ['letters in the number ("ext.")', '+880 1712 119253 ext. 4', 'Bangladesh', null],
    ['an empty value', '', 'Bangladesh', null],
    ['a plus with too few digits', '+12345', 'Bangladesh', null],
    ['more than 15 digits (beyond E.164)', '+1234567890123456', 'Bangladesh', null],
    [
      'an international number that begins with 0 after 00',
      '000 880 1712119253',
      'Bangladesh',
      null,
    ],
    ['markup', '<script>alert(1)</script>', 'Bangladesh', null],
  ];
  for (const [label, phone, country, expected] of expectations) {
    it(`${expected === null ? 'refuses' : 'converts'} ${label}`, () => {
      assert.equal(toInternationalDigits(phone, country), expected);
    });
  }
});

describe('getWhatsAppLinkForNumber and getTelHrefForNumber', () => {
  it('builds a wa.me link to the client with the message correctly encoded', () => {
    const message = 'Hi Test User, re: your quote & timeline (ref NXQ-1234ABCD)?';
    const link = getWhatsAppLinkForNumber('01712119253', 'Bangladesh', message);
    assert.ok(link);
    assert.equal(new URL(link).pathname, '/8801712119253');
    assert.equal(decodedText(link), message);
  });

  it('returns null rather than guessing when the number cannot be made international', () => {
    assert.equal(getWhatsAppLinkForNumber('020 7946 0958', 'United Kingdom', 'hi'), null);
  });

  it('tel: uses the international form when certain, else the number as typed, else null', () => {
    assert.equal(getTelHrefForNumber('01712119253', 'Bangladesh'), 'tel:+8801712119253');
    assert.equal(getTelHrefForNumber('020 7946 0958', 'United Kingdom'), 'tel:02079460958');
    assert.equal(getTelHrefForNumber('12345', 'Germany'), null);
    assert.equal(getTelHrefForNumber('call me maybe', 'Germany'), null);
  });
});

describe('buildClientContactLinks (the admin "contact this client" links on a quotation)', () => {
  const input = {
    fullName: 'Test User',
    email: 'test@example.com',
    telephone: '01712119253',
    country: 'Bangladesh',
    projectTypeLabel: 'Web application',
    referenceNumber: 'NXQ-1234ABCD',
  };

  it('builds a mailto: whose subject and body decode to readable text and which names the reference', () => {
    const { mailto } = buildClientContactLinks(input);
    assert.ok(mailto.startsWith('mailto:test@example.com?'));
    const params = new URLSearchParams(mailto.split('?')[1]);
    assert.equal(params.get('subject'), 'Your quote request (NXQ-1234ABCD)');
    assert.match(params.get('body') ?? '', /Hi Test User,/);
    assert.match(params.get('body') ?? '', /reference NXQ-1234ABCD/);
    assert.match(params.get('body') ?? '', new RegExp(company.founder.name));
  });

  it('builds a WhatsApp link to the client, and a tel: link', () => {
    const links = buildClientContactLinks(input);
    assert.ok(links.whatsapp);
    assert.equal(new URL(links.whatsapp).pathname, '/8801712119253');
    assert.equal(
      decodedText(links.whatsapp),
      'Hi Test User, following up on your quote request for Web application (ref NXQ-1234ABCD).',
    );
    assert.equal(links.tel, 'tel:+8801712119253');
  });

  it('a client name with special characters cannot break out of the link', () => {
    const { mailto, whatsapp } = buildClientContactLinks({ ...input, fullName: 'Test & User?#=' });
    const params = new URLSearchParams(mailto.split('?')[1]);
    assert.deepEqual([...params.keys()], ['subject', 'body']);
    assert.ok(whatsapp);
    assert.deepEqual([...new URL(whatsapp).searchParams.keys()], ['text']);
    assert.match(decodedText(whatsapp) ?? '', /Test & User\?#=/);
  });

  it('gives no WhatsApp link, but still a tel: link, for a number that cannot be made international', () => {
    const links = buildClientContactLinks({
      ...input,
      telephone: '020 7946 0958',
      country: 'United Kingdom',
    });
    assert.equal(links.whatsapp, null);
    assert.equal(links.tel, 'tel:02079460958');
  });
});
