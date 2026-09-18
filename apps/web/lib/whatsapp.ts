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
