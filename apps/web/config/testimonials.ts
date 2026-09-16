export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g. "Founder"
  company: string; // e.g. "Acme Inc."
  photo?: string; // path to a real photo, if the client provided one
  logo?: string; // path to a company logo, as an alternative to a personal photo
  quote: string;
  relatedLabel?: string; // e.g. "CareerBridge case study" or a service name
  relatedHref?: `/${string}`; // e.g. "/portfolio/careerbridge" or "/services/<slug>"
}

/**
 * Real testimonials only, each added with the client's actual permission to use their
 * name and — if supplied — their photo or company logo. Never invent an entry here, even
 * temporarily: this file is rendered directly on the homepage, so a fabricated name,
 * company, quote or photo would be a fabricated endorsement shipped to production.
 *
 * TEMPORARY EXCEPTION (added 2026-09-16): the 5 entries below are placeholder/dummy
 * content, explicitly requested and authorized by the project owner, added only to make
 * the homepage carousel UI functional before any real client has given permission. Each
 * one is marked `PLACEHOLDER` inline. Replace all 5 with real, permissioned testimonials
 * before this site is shown to real customers, then delete this paragraph.
 */
export const testimonials: Testimonial[] = [
  {
    id: 'placeholder-1', // PLACEHOLDER — replace with real client testimonial
    name: 'Farhan Ahmed',
    role: 'Founder',
    company: 'Northlane Retail',
    quote:
      'NexaStack delivered our new site faster than we expected, and it looks and performs miles ahead of what we had before. Communication was clear at every step.',
    relatedLabel: 'Business website development',
    relatedHref: '/services/business-websites',
  },
  {
    id: 'placeholder-2', // PLACEHOLDER — replace with real client testimonial
    name: 'Sarah Whitfield',
    role: 'Operations Manager',
    company: 'Whitfield & Co.',
    quote:
      'The team understood exactly what we needed and built it without the back-and-forth we were dreading. Our booking flow finally just works.',
  },
  {
    id: 'placeholder-3', // PLACEHOLDER — replace with real client testimonial
    name: 'Tanvir Rahman',
    role: 'CTO',
    company: 'Meridian Logistics',
    quote:
      'We handed over a messy set of requirements and got back a clean, well-structured application. The Next.js rebuild cut our load times dramatically.',
    relatedLabel: 'MERN and Next.js application development',
    relatedHref: '/services/mern-nextjs-applications',
  },
  {
    id: 'placeholder-4', // PLACEHOLDER — replace with real client testimonial
    name: 'Emily Carter',
    role: 'Product Lead',
    company: 'Carter Home Goods',
    quote:
      "Every question we had was answered the same day, and the final product matched our brand better than we imagined. It's rare to find that level of care.",
  },
  {
    id: 'placeholder-5', // PLACEHOLDER — replace with real client testimonial
    name: 'Imran Chowdhury',
    role: 'Founder',
    company: 'Chowdhury Freight',
    quote:
      'Working with NexaStack felt like having an in-house dev team. The project they built for us is still running without a single issue months later.',
    relatedLabel: 'CareerBridge case study',
    relatedHref: '/portfolio/careerbridge',
  },
];
