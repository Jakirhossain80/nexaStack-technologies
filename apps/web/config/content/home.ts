/**
 * Homepage copy. Sections import their slice of this object as props — editing copy should
 * never require touching a component (root CLAUDE.md 10, apps/web CLAUDE.md 7).
 */

export interface HeroCta {
  label: string;
  href: `/${string}`;
}

export interface HeroHeading {
  lead: string;
  /** Trailing phrase given the decorative gradient underline. */
  highlight: string;
}

export interface HeroTechnologies {
  label: string;
  items: readonly string[];
}

export interface HeroContent {
  eyebrow: string;
  heading: HeroHeading;
  subheading: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  /** Qualitative, true-today statements for the hero stat panel — never counters or claims we can't stand behind. */
  stats: readonly string[];
  /** Floating technology summary beside the hero mockup. Stack facts only. */
  technologies: HeroTechnologies;
}

export interface FeaturedServicesContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  viewAllCta: HeroCta;
}

export interface SolutionsContent {
  eyebrow: string;
  heading: string;
  subheading: string;
}

export const homeContent = {
  hero: {
    eyebrow: 'Web development studio · Dhaka, Bangladesh',
    heading: { lead: 'MERN and Next.js web development for', highlight: 'growing businesses' },
    subheading:
      'NexaStack Technologies is a founder-led studio building fast, accessible websites and web applications — and staying involved after launch.',
    primaryCta: { label: 'Get a Quote', href: '/quotation' },
    secondaryCta: { label: 'See our work', href: '/portfolio' },
    stats: [
      '5+ years building with MERN and Next.js',
      'WCAG AA accessibility as standard',
      'Replies within one business day',
    ],
    technologies: {
      label: 'Built with',
      items: ['Next.js', 'React', 'Node.js', 'Express', 'MongoDB', 'TypeScript'],
    },
  },
  featuredServices: {
    eyebrow: 'Services',
    heading: 'What we build',
    subheading:
      'From a single landing page to a full-stack application with an admin dashboard behind it.',
    viewAllCta: { label: 'View all services', href: '/services' },
  },
  solutions: {
    eyebrow: 'Solutions',
    heading: 'Built for how your business actually runs',
    subheading:
      'The same engineering approach, shaped around what each kind of business actually needs.',
  },
} as const satisfies {
  hero: HeroContent;
  featuredServices: FeaturedServicesContent;
  solutions: SolutionsContent;
};

export type HomeContent = typeof homeContent;
