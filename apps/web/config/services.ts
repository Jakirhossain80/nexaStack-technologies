/**
 * Services — the single source of truth (root CLAUDE.md 22.10, resolved). Read by the homepage
 * Featured Services section, `/services`, `/services/[slug]` and — later — a navbar dropdown.
 * Never hardcode a service in a component.
 */

export type ServiceIcon = 'globe' | 'stack' | 'dashboard' | 'api' | 'wrench' | 'gauge';

export interface Service {
  slug: string;
  title: string;
  summary: string;
  icon: ServiceIcon;
  /** Shown in the homepage grid. A future service can be added here without appearing there. */
  featured: boolean;
  /**
   * 2–4 technologies from `config/technologies.ts` this service is genuinely built or
   * delivered with. Omitted where nothing traces cleanly (e.g. an audit service isn't
   * "built with" a stack) — never padded to satisfy a UI that expects a chip row.
   */
  relatedTechnologies?: readonly string[];
}

export const services: readonly Service[] = [
  {
    slug: 'business-websites',
    title: 'Business website development',
    summary:
      'Company sites, landing pages and marketing websites built for speed, search visibility and accessibility from the first commit.',
    icon: 'globe',
    featured: true,
    relatedTechnologies: ['Next.js', 'React', 'Tailwind CSS'],
  },
  {
    slug: 'mern-nextjs-applications',
    title: 'MERN and Next.js application development',
    summary:
      'Full-stack web applications with React, Node and MongoDB: authentication, dashboards, data-driven interfaces and everything behind them.',
    icon: 'stack',
    featured: true,
    relatedTechnologies: ['Next.js', 'React', 'Node.js', 'MongoDB Atlas'],
  },
  {
    slug: 'admin-dashboards',
    title: 'Admin dashboard development',
    summary:
      'Internal tools and content dashboards with role-based access, so your team can manage the site without touching code.',
    icon: 'dashboard',
    featured: true,
    relatedTechnologies: ['Next.js', 'MongoDB Atlas', 'JWT', 'Tailwind CSS'],
  },
  {
    slug: 'backend-and-apis',
    title: 'Backend and API development',
    summary:
      'REST APIs with validated inputs, proper error handling and documentation — built to be integrated with, not just to work once.',
    icon: 'api',
    featured: true,
    relatedTechnologies: ['Node.js', 'Express.js', 'MongoDB Atlas', 'Mongoose'],
  },
  {
    slug: 'maintenance-and-bug-fixing',
    title: 'Bug fixing and maintenance',
    summary:
      'Diagnosing and fixing problems in existing codebases, plus ongoing updates, dependency upgrades and monitoring.',
    icon: 'wrench',
    featured: true,
    relatedTechnologies: ['ESLint', 'Prettier', 'pnpm', 'Git & GitHub'],
  },
  {
    slug: 'performance-seo-audits',
    title: 'Performance, SEO and accessibility audits',
    summary:
      'A concrete report on what is slowing a site down, hurting its ranking or blocking users, with the fixes prioritised.',
    icon: 'gauge',
    featured: true,
    // No relatedTechnologies: an audit isn't "built with" a stack, and the tools that would
    // actually run one (axe-core, Lighthouse) aren't in config/technologies.ts or root
    // CLAUDE.md §5's stack table — only in §14/§20's testing guidance. Not solid enough to
    // present here.
  },
] as const;

export function getFeaturedServices(): readonly Service[] {
  return services.filter((service) => service.featured);
}

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((service) => service.slug === slug);
}
