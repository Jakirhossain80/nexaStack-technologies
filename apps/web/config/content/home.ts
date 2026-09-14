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

export interface PortfolioContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  viewAllCta: HeroCta;
}

export interface TechnologyContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  viewAllCta: HeroCta;
}

export interface WhyChooseContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  closingCta: { heading: string; cta: HeroCta };
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
  portfolio: {
    eyebrow: 'Portfolio',
    heading: 'Featured work',
    subheading: "A closer look at what's been built — with more projects added as they ship.",
    viewAllCta: { label: 'View full portfolio', href: '/portfolio' },
  },
  technology: {
    eyebrow: 'Technology',
    heading: 'The stack behind every build',
    subheading: 'Modern, typed, and production-tested — the same tools across every project.',
    viewAllCta: { label: 'View all technologies', href: '/technologies' },
  },
  whyChoose: {
    eyebrow: 'Why NexaStack',
    heading: 'Built the way client work should be',
    subheading: 'Not a checklist of buzzwords — the actual practices behind every project.',
    closingCta: {
      heading: 'Ready to talk about your project?',
      cta: { label: 'Get a Quote', href: '/quotation' },
    },
  },
} as const satisfies {
  hero: HeroContent;
  featuredServices: FeaturedServicesContent;
  solutions: SolutionsContent;
  portfolio: PortfolioContent;
  technology: TechnologyContent;
  whyChoose: WhyChooseContent;
};

export type HomeContent = typeof homeContent;
