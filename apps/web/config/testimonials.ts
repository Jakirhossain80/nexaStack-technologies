export interface Testimonial {
  id: string;
  name: string;
  role: string; // e.g. "Founder"
  company: string; // e.g. "Acme Inc."
  photo?: string; // local portrait path; demo entries use generated fictional portraits
  logo?: string; // path to a company logo, as an alternative to a personal photo
  quote: string;
  relatedLabel?: string; // e.g. "CareerBridge case study" or a service name
  relatedHref?: `/${string}`; // e.g. "/portfolio/careerbridge" or "/services/<slug>"
}

/**
 * Owner-requested dummy content for the landing-page layout. All identities, companies,
 * quotes and generated portraits below are fictional. The homepage labels these as demo
 * content. Replace with permissioned client feedback before presenting real endorsements.
 */
export const testimonials: Testimonial[] = [
  {
    id: 'demo-farhan',
    name: 'Farhan Ahmed',
    role: 'Founder',
    company: 'Northlane Retail',
    photo: '/testimonials/farhan.png',
    quote: 'Thoughtful design, clear communication, and a website we are proud to share.',
    relatedLabel: 'Business websites',
    relatedHref: '/services/business-websites',
  },
  {
    id: 'demo-sarah',
    name: 'Sarah Whitfield',
    role: 'Director',
    company: 'Whitfield Studio',
    photo: '/testimonials/sarah.png',
    quote: 'Our new website feels polished, welcoming, and effortless to use on every screen.',
    relatedLabel: 'View our work',
    relatedHref: '/portfolio',
  },
  {
    id: 'demo-tanvir',
    name: 'Tanvir Rahman',
    role: 'CTO',
    company: 'Meridian Labs',
    photo: '/testimonials/tanvir.png',
    quote: 'Complex requirements became a clean, reliable app with a smooth handover.',
    relatedLabel: 'Web applications',
    relatedHref: '/services/mern-nextjs-applications',
  },
  {
    id: 'demo-emily',
    name: 'Emily Carter',
    role: 'Product Lead',
    company: 'Carter Living',
    photo: '/testimonials/emily.png',
    quote: 'The attention to detail and helpful updates made the whole project feel easy.',
    relatedLabel: 'Admin dashboards',
    relatedHref: '/services/admin-dashboards',
  },
  {
    id: 'demo-imran',
    name: 'Imran Chowdhury',
    role: 'Founder',
    company: 'Chowdhury Freight',
    photo: '/testimonials/imran.png',
    quote: 'Responsive support and careful fixes gave us confidence in our website again.',
    relatedLabel: 'Website maintenance',
    relatedHref: '/services/maintenance-and-bug-fixing',
  },
];
