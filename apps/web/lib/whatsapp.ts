/**
 * The one place that knows NexaStack's WhatsApp number and how to build a `wa.me` link.
 * Every WhatsApp "chat with us" link in the app (`config/company.ts`, and anything that needs
 * its own prefilled message, like `WhatsAppWidget`) goes through this — a future change to the
 * number or the URL format only happens here.
 *
 * `components/sections/ShareLinks.tsx` intentionally does NOT use this: that's WhatsApp's
 * generic share-intent link (sharing a blog post with a third party), which has no phone number
 * at all — a different feature, not a "chat with NexaStack" link.
 */

// Digits only, no "+", no leading zero — root CLAUDE.md section 4.
const WHATSAPP_NUMBER = '8801712119253';

export function getWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/*
 * The functions below are the OTHER direction: the founder reaching out TO a client, using the
 * telephone number the client typed into the quotation form. `getWhatsAppLink` cannot do this — it
 * always addresses NexaStack's own number.
 *
 * A typed phone number is free text with no guaranteed format, so it is only turned into an
 * international number when that can be done without guessing:
 *   - `+…` or `00…`  → already international: keep the digits;
 *   - Bangladesh (the client's stated country) and a domestic `01XXXXXXXXX` mobile → `880` + the
 *     number without its trunk `0` (root CLAUDE.md 4: `01712119253` → `8801712119253`);
 *   - anything else is left alone, because the meaning of a leading `0` depends on the country and
 *     a wrong guess would message a stranger.
 * When it can't be made international the caller gets `null` and shows an explanation instead of a
 * WhatsApp button.
 */

/** E.164 allows at most 15 digits; below 8 a number cannot be a full international one. */
const INTERNATIONAL_MIN_DIGITS = 8;
const INTERNATIONAL_MAX_DIGITS = 15;

/** Only digits and common separators, with an optional leading `+`. Letters ("ext.") fail. */
const PLAIN_PHONE = /^\+?[\d\s().-]+$/;

/** Digits only, in international form (no `+`, no leading zeros), or null if that isn't certain. */
export function toInternationalDigits(rawPhone: string, country: string): string | null {
  const phone = rawPhone.trim();
  if (!PLAIN_PHONE.test(phone)) return null;

  const digits = phone.replace(/\D/g, '');
  let international: string | null = null;

  if (phone.startsWith('+')) {
    international = digits;
  } else if (digits.startsWith('00')) {
    international = digits.slice(2);
  } else if (country === 'Bangladesh') {
    if (digits.startsWith('0') && digits.length === 11) international = `880${digits.slice(1)}`;
    else if (digits.startsWith('880') && digits.length === 13) international = digits;
  }

  if (
    international === null ||
    international.startsWith('0') ||
    international.length < INTERNATIONAL_MIN_DIGITS ||
    international.length > INTERNATIONAL_MAX_DIGITS
  ) {
    return null;
  }
  return international;
}

/** A `wa.me` chat with the CLIENT, prefilled with `message`; null if their number can't be made international. */
export function getWhatsAppLinkForNumber(
  rawPhone: string,
  country: string,
  message?: string,
): string | null {
  const digits = toInternationalDigits(rawPhone, country);
  if (digits === null) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * A `tel:` link for the client's number: the international form when it is certain, otherwise the
 * number as typed (digits and a leading `+` only), which a phone can still dial. Null if there are
 * too few digits to be a number at all.
 */
export function getTelHrefForNumber(rawPhone: string, country: string): string | null {
  const digits = toInternationalDigits(rawPhone, country);
  if (digits !== null) return `tel:+${digits}`;

  const typed = rawPhone.trim();
  if (!PLAIN_PHONE.test(typed)) return null;
  const dialable = `${typed.startsWith('+') ? '+' : ''}${typed.replace(/\D/g, '')}`;
  return dialable.replace('+', '').length >= 6 ? `tel:${dialable}` : null;
}
