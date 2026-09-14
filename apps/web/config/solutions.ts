/**
 * Solutions — the single source of truth (root CLAUDE.md 22.10 sibling: what kind of business
 * each capability serves, not what we build — see `config/services.ts` for that). Read by the
 * homepage Solutions & Industries section and `/solutions/[slug]`. Never hardcode a solution in
 * a component.
 *
 * Exactly five entries. Unlike services, do not add a sixth without explicit approval — a new
 * service is a capability claim ("we can also build X"); a new industry entry is a domain-expertise
 * claim, which is riskier to make without a specified target market (root CLAUDE.md 22.9).
 */

export type SolutionIcon = 'recruitment' | 'logistics' | 'business-ops' | 'ecommerce' | 'startup-mvp';

export interface Solution {
  slug: string;
  title: string;
  summary: string;
  icon: SolutionIcon;
  /** Shown in the homepage section. A future solution can be added here without appearing there. */
  featured: boolean;
}

export const solutions: readonly Solution[] = [
  {
    // Same domain as the CareerBridge project. Once the portfolio section exists, this card
    // should link to that case study instead of standing alone — revisit then.
    slug: 'recruitment-job-portals',
    title: 'Recruitment and job portals',
    summary:
      'Candidate and employer accounts, job listings with search and filters, applications, and admin tools to manage postings and users.',
    icon: 'recruitment',
    featured: true,
  },
  {
    slug: 'shipping-logistics-systems',
    title: 'Shipping and logistics systems',
    summary:
      'Shipment tracking, document and approval workflows, supplier and agent coordination, and reconciliation between systems.',
    icon: 'logistics',
    featured: true,
  },
  {
    slug: 'business-management-apps',
    title: 'Business-management applications',
    summary:
      'Internal tools for inventory, operations, customer records or scheduling — replacing a spreadsheet with something your whole team can use correctly.',
    icon: 'business-ops',
    featured: true,
  },
  {
    slug: 'ecommerce-platforms',
    title: 'E-commerce platforms',
    summary:
      'Product catalogues, cart and checkout, order management and payment integration, built to actually convert rather than just look like a store.',
    icon: 'ecommerce',
    featured: true,
  },
  {
    slug: 'startup-mvp-development',
    title: 'Startup MVP development',
    summary:
      'A focused first version that proves the idea and can scale, not a throwaway prototype that gets rebuilt from zero once it works.',
    icon: 'startup-mvp',
    featured: true,
  },
] as const;

export function getFeaturedSolutions(): readonly Solution[] {
  return solutions.filter((solution) => solution.featured);
}

export function getSolutionBySlug(slug: string): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug);
}
