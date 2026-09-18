export interface Testimonial {
  id: string;
  clientName: string;
  clientPosition: string; // e.g. "Founder"
  clientCompany: string; // e.g. "Acme Inc."
  photoUrl?: string; // client photo — local path or Cloudinary URL, via next/image
  companyLogoUrl?: string; // alternative to a personal photo; precedence: photoUrl > companyLogoUrl > initials
  quote: string;
  rating?: 1 | 2 | 3 | 4 | 5; // optional — never defaulted or invented when not actually given
  relatedProjectSlug?: string; // a real slug in config/projects.ts, or omitted
  relatedServiceSlug?: string; // a real slug in config/services.ts, or omitted — set at most one
  featured?: boolean; // surfaced preferentially on the homepage teaser and /testimonials
  approved: boolean; // only true entries render anywhere public
  /** Internal record of how/when publish consent was obtained. Never destructured or rendered
   * by any component — keep it that way if this shape is ever split into public/internal views. */
  consentNoteInternal?: string;
}

/**
 * Owner-requested dummy content for the landing-page layout, kept live on the homepage by
 * explicit owner decision (root CLAUDE.md doesn't yet resolve when real client testimonials
 * will exist). All identities, companies, quotes and generated portraits below are fictional —
 * the homepage discloses this directly ("Demo testimonials — fictional names, companies,
 * comments, and AI-generated portraits shown for preview purposes"). `approved: true` reflects
 * that they are, in fact, already showing; no `rating` because none was ever actually given.
 * Replace with permissioned real client feedback as it becomes available — do not add another
 * fabricated entry here, real or demo-labeled; new fixture data belongs only in
 * `/dev/testimonials-preview`.
 */
export const testimonials: Testimonial[] = [
  {
    id: 'demo-farhan',
    clientName: 'Farhan Ahmed',
    clientPosition: 'Founder',
    clientCompany: 'Northlane Retail',
    photoUrl: '/testimonials/farhan.png',
    quote: 'Thoughtful design, clear communication, and a website we are proud to share.',
    relatedServiceSlug: 'business-websites',
    approved: true,
  },
  {
    id: 'demo-sarah',
    clientName: 'Sarah Whitfield',
    clientPosition: 'Director',
    clientCompany: 'Whitfield Studio',
    photoUrl: '/testimonials/sarah.png',
    quote: 'Our new website feels polished, welcoming, and effortless to use on every screen.',
    // Previously linked to the generic /portfolio index, not a specific project — that doesn't
    // fit relatedProjectSlug's "real slug in config/projects.ts" contract, so it's dropped
    // rather than pointed at the one unrelated real project that happens to exist.
    approved: true,
  },
  {
    id: 'demo-tanvir',
    clientName: 'Tanvir Rahman',
    clientPosition: 'CTO',
    clientCompany: 'Meridian Labs',
    photoUrl: '/testimonials/tanvir.png',
    quote: 'Complex requirements became a clean, reliable app with a smooth handover.',
    relatedServiceSlug: 'mern-nextjs-applications',
    approved: true,
  },
  {
    id: 'demo-emily',
    clientName: 'Emily Carter',
    clientPosition: 'Product Lead',
    clientCompany: 'Carter Living',
    photoUrl: '/testimonials/emily.png',
    quote: 'The attention to detail and helpful updates made the whole project feel easy.',
    relatedServiceSlug: 'admin-dashboards',
    approved: true,
  },
  {
    id: 'demo-imran',
    clientName: 'Imran Chowdhury',
    clientPosition: 'Founder',
    clientCompany: 'Chowdhury Freight',
    photoUrl: '/testimonials/imran.png',
    quote: 'Responsive support and careful fixes gave us confidence in our website again.',
    relatedServiceSlug: 'maintenance-and-bug-fixing',
    approved: true,
  },
];

export function getApprovedTestimonials(): readonly Testimonial[] {
  return testimonials.filter((testimonial) => testimonial.approved);
}
