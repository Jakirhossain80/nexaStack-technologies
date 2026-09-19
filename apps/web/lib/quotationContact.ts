import { company } from '@/config/company';
import { getTelHrefForNumber, getWhatsAppLinkForNumber } from '@/lib/whatsapp';

/**
 * The "contact the client" actions on a quotation request. These are plain links: clicking one
 * opens the founder's OWN email app, phone or WhatsApp with the client's real details already
 * filled in. Nothing is sent by this site, and no outbound-email system exists (that is a separate,
 * deferred notification hook for the opposite direction: alerting the founder to a new submission).
 */

export interface ClientContactInput {
  fullName: string;
  email: string;
  telephone: string;
  country: string;
  /** The project type's display label ("Web application"), not its stored value. */
  projectTypeLabel: string;
  referenceNumber: string;
}

export interface ClientContactLinks {
  mailto: string;
  /** Null when the client's number cannot be made international without guessing. */
  whatsapp: string | null;
  /** Null only if the number has too few digits to dial. */
  tel: string | null;
}

export function buildClientContactLinks(input: ClientContactInput): ClientContactLinks {
  const { fullName, email, telephone, country, projectTypeLabel, referenceNumber } = input;

  const subject = `Your quote request (${referenceNumber})`;
  const body = [
    `Hi ${fullName},`,
    '',
    `Following up on your quote request for ${projectTypeLabel} (reference ${referenceNumber}).`,
    '',
    '',
    'Best regards,',
    company.founder.name,
    company.legalName,
  ].join('\n');

  const whatsappMessage = `Hi ${fullName}, following up on your quote request for ${projectTypeLabel} (ref ${referenceNumber}).`;

  return {
    // `email` was validated as an address by the shared schema when the client submitted it.
    mailto: `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    whatsapp: getWhatsAppLinkForNumber(telephone, country, whatsappMessage),
    tel: getTelHrefForNumber(telephone, country),
  };
}
