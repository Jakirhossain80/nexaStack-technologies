/**
 * Company facts — the single source of truth (root CLAUDE.md section 4).
 *
 * Import this everywhere these values appear: footer, contact page, JSON-LD, email templates,
 * legal pages. Never hardcode any of them in a component.
 */

type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> };

function deepFreeze<T extends object>(value: T): DeepReadonly<T> {
  for (const nested of Object.values(value)) {
    if (nested !== null && typeof nested === 'object' && !Object.isFrozen(nested)) {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value) as DeepReadonly<T>;
}

const legalName = 'NexaStack Technologies';
const whatsappHref = 'https://wa.me/8801712119253';
const whatsappPrefilledMessage = `Hello ${legalName}, I would like to discuss a web development project.`;

export const company = deepFreeze({
  legalName,
  tagline: 'We Build Better Websites',
  foundingYear: 2026,

  founder: {
    name: 'Md. Jakir Hossain',
    jobTitle: 'CEO',
  },

  // How much of this to publish is an open decision (CLAUDE.md 22.8). This object only holds
  // the data; each page decides what to show.
  address: {
    streetAddress: 'House 14, Road 06',
    locality: 'Uttara',
    region: 'Dhaka',
    postalCode: '1230',
    country: 'Bangladesh',
    countryCode: 'BD',
    full: 'House 14, Road 06, Uttara, Dhaka 1230, Bangladesh',
  },

  // +880 is Bangladesh's country code; the domestic trunk "0" is dropped internationally.
  phone: {
    display: '+880 1712-119253',
    e164: '+8801712119253',
    href: 'tel:+8801712119253',
  },
  whatsapp: {
    // wa.me requires digits only: no "+", no leading zero.
    href: whatsappHref,
    prefilledMessage: whatsappPrefilledMessage,
    /** Click-to-chat link that opens with the prefilled message. */
    chatHref: `${whatsappHref}?text=${encodeURIComponent(whatsappPrefilledMessage)}`,
  },

  // Placeholder — replace with hello@<domain> once registered (CLAUDE.md 22.6).
  email: {
    general: 'nexastack@mail.com',
    href: 'mailto:nexastack@mail.com',
  },

  hours: {
    opens: '10:00',
    closes: '18:00',
    // Six days a week; Friday is the weekly holiday.
    openDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    weeklyHoliday: 'Friday',
    display: '10:00–18:00, Saturday to Thursday',
    timeZone: 'Asia/Dhaka',
    utcOffset: '+06:00',
  },

  social: {
    github: 'https://github.com/Jakirhossain80',
    linkedin: 'https://www.linkedin.com/in/jakir-hossain-dev',
  },
} as const);

export type Company = typeof company;
