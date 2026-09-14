/**
 * Homepage copy. Sections import their slice of this object as props — editing copy should
 * never require touching a component (root CLAUDE.md 10, apps/web CLAUDE.md 7).
 */

export interface HeroCta {
  label: string;
  href: `/${string}`;
}

export interface HeroContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  /** Qualitative, true-today statements for the hero stat panel — never counters or claims we can't stand behind. */
  stats: readonly string[];
}

export interface FeaturedServicesContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  viewAllCta: HeroCta;
}

export const homeContent = {
  hero: {
    eyebrow: 'Web development studio · Dhaka, Bangladesh',
    heading: 'MERN and Next.js web development for growing businesses',
    subheading:
      'NexaStack Technologies is a founder-led studio building fast, accessible websites and web applications — and staying involved after launch.',
    primaryCta: { label: 'Get a Quote', href: '/quotation' },
    secondaryCta: { label: 'See our work', href: '/portfolio' },
    stats: [
      '5+ years building with MERN and Next.js',
      'WCAG AA accessibility as standard',
      'Replies within one business day',
    ],
  },
  featuredServices: {
    eyebrow: 'Services',
    heading: 'What we build',
    subheading:
      'From a single landing page to a full-stack application with an admin dashboard behind it.',
    viewAllCta: { label: 'View all services', href: '/services' },
  },
} as const satisfies { hero: HeroContent; featuredServices: FeaturedServicesContent };

export type HomeContent = typeof homeContent;
