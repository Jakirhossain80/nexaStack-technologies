/**
 * Long-form detail content for `/solutions/[slug]` — a companion to `config/solutions.ts`, same
 * pattern as `config/service-details.ts` for Services.
 *
 * Honesty rule specific to this page (stricter than Services): an industries page implicitly
 * claims domain familiarity, and NexaStack hasn't done real client work in most of these yet.
 * Every field below is written as capability — how the real stack and process in root CLAUDE.md
 * section 5 would approach this kind of business — never as track record. No "years of
 * experience," "we've helped," "specialise in," or any implied client history that isn't real.
 * General industry knowledge (typical challenges, typical features) is fine to state as common
 * domain knowledge; it isn't a claim about NexaStack specifically.
 *
 * `relatedCaseStudySlugs` only names a project that is genuinely relevant — empty is a valid,
 * honest answer. `recruitment-job-portals` is the one exception: `config/solutions.ts` already
 * flags CareerBridge as the same domain in its own comment.
 */

import { solutions } from './solutions';

export interface SolutionDetail {
  slug: string;
  introduction: string;
  businessChallenges: readonly string[];
  recommendedSolutions: string;
  importantFeatures: readonly string[];
  /** Slugs from `config/services.ts`. */
  applicableServices: readonly string[];
  /** Names from `config/technologies.ts`. */
  recommendedTechnologies: readonly string[];
  /** Slugs from `config/projects.ts`. Empty is valid — see file doc comment. */
  relatedCaseStudySlugs: readonly string[];
}

export const solutionDetails: readonly SolutionDetail[] = [
  {
    slug: 'recruitment-job-portals',
    introduction:
      "Recruitment platforms connect two distinct user types — candidates and employers — around a shared set of job listings, and need search, filtering and application tracking to stay usable as that content grows. This is the same domain as NexaStack's own CareerBridge project, built to handle separate candidate, employer and admin experiences under one platform.",
    businessChallenges: [
      'Managing two very different user journeys — candidate and employer — without either feeling like an afterthought',
      'Job listings and applications becoming hard to search or filter as volume grows',
      "No clear way for either side to track an application's status",
      'Admin oversight of postings and users often bolted on late rather than designed in from the start',
    ],
    recommendedSolutions:
      'A recruitment platform built as a MERN/Next.js application, with role-based accounts for candidates, employers and admins established from the data model up, so search, filtering and application tracking are core features rather than retrofits.',
    importantFeatures: [
      'Candidate and employer account types with distinct dashboards',
      'Job listing search and filtering',
      'Application submission and status tracking',
      'Admin tools for managing postings and users',
    ],
    applicableServices: ['mern-nextjs-applications', 'admin-dashboards'],
    recommendedTechnologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB Atlas', 'JWT'],
    relatedCaseStudySlugs: ['careerbridge'],
  },
  {
    slug: 'shipping-logistics-systems',
    introduction:
      'Logistics and shipping operations typically involve several parties — suppliers, agents and internal staff — coordinating around a shipment as it moves through stages that need approval and documentation at each step.',
    businessChallenges: [
      'Shipment status scattered across emails, spreadsheets or disconnected tools',
      'Manual document handling and approval steps that are easy to lose track of',
      'Coordinating suppliers and agents who each need different visibility into the same shipment',
      'Reconciling records between internal systems and external parties',
    ],
    recommendedSolutions:
      'A logistics system built around a central data model for shipments, with role-based access so suppliers, agents and internal staff each see what’s relevant to them, and a documented backend API so it can be extended or integrated with other systems over time.',
    importantFeatures: [
      'Shipment tracking with status updates at each stage',
      'Document upload and approval workflows',
      'Role-based views for suppliers, agents and internal staff',
      'Records structured for reconciliation between systems',
    ],
    applicableServices: ['mern-nextjs-applications', 'backend-and-apis', 'admin-dashboards'],
    recommendedTechnologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Mongoose'],
    relatedCaseStudySlugs: [],
  },
  {
    slug: 'business-management-apps',
    introduction:
      'Many businesses run core operations — inventory, customer records, scheduling — on spreadsheets that started simple and grew unreliable once more people needed to use them at once. A purpose-built internal tool replaces that with something the whole team can use correctly.',
    businessChallenges: [
      'Spreadsheets that break or produce inconsistent numbers once multiple people edit them',
      'No access control — everyone can see and change everything, or nobody can see enough',
      "Manual processes for things like inventory counts or scheduling that don't scale with the business",
      'No audit trail for who changed what',
    ],
    recommendedSolutions:
      "An internal application with a proper database and role-based access in place of a shared spreadsheet, scoped during requirement analysis around the specific records and workflows the business actually runs — not a generic off-the-shelf tool retrofitted to fit.",
    importantFeatures: [
      'Structured records for inventory, customers or scheduling, depending on what the business runs',
      "Role-based access so staff see only what's relevant to their role",
      'Search and filtering across records as they grow',
      'An audit trail of changes',
    ],
    applicableServices: ['mern-nextjs-applications', 'admin-dashboards'],
    recommendedTechnologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB Atlas'],
    relatedCaseStudySlugs: [],
  },
  {
    slug: 'ecommerce-platforms',
    introduction:
      "An e-commerce platform has to do more than list products — catalogue management, cart and checkout, order management and payment integration all need to work together reliably, since a broken step anywhere in that chain costs a sale.",
    businessChallenges: [
      "A product catalogue that's hard to update or doesn't scale as inventory grows",
      'Cart and checkout flows that lose customers partway through',
      'No clear order management view once orders start coming in',
      'Payment integration that needs to be secure and handle failure cases gracefully',
    ],
    recommendedSolutions:
      'An e-commerce build on the same MERN/Next.js stack as every project, with the product catalogue, cart, checkout and order management modelled as one connected system from the start, and a backend API structured to integrate with a payment provider securely.',
    importantFeatures: [
      'Product catalogue with categories and search',
      'Cart and checkout flow',
      'Order management for tracking and fulfilling orders',
      'Payment integration',
    ],
    applicableServices: ['mern-nextjs-applications', 'backend-and-apis', 'admin-dashboards'],
    recommendedTechnologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB Atlas', 'JWT'],
    relatedCaseStudySlugs: [],
  },
  {
    slug: 'startup-mvp-development',
    introduction:
      "An MVP has one job: prove the idea works with real users, without so much scope that it takes months to find out. The line that matters is between a focused first version and a throwaway prototype that has to be rebuilt from zero once it succeeds.",
    businessChallenges: [
      'Too much scope in a first version, delaying the point where real feedback is possible',
      "A prototype built in a way that can't be extended once it needs to grow",
      'Uncertainty about which features actually matter before real users weigh in',
      'Technical decisions made purely for speed that become a liability if the product succeeds',
    ],
    recommendedSolutions:
      'An MVP built on the same production-grade stack as a full application — Next.js, a proper backend and a real database — scoped down to the smallest feature set that tests the core idea, so a successful MVP becomes the foundation to build on rather than something to throw away.',
    importantFeatures: [
      'A focused core feature set, scoped to test the idea rather than cover every future case',
      'Authentication and a real database from the start, not stubbed out',
      'A structure that can be extended once real usage data comes in',
      'Deployment to a real, monitored environment rather than a local demo',
    ],
    applicableServices: ['mern-nextjs-applications', 'backend-and-apis'],
    recommendedTechnologies: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB Atlas'],
    relatedCaseStudySlugs: [],
  },
] as const;

// Defensive parity check, same as `config/service-details.ts` — catches a slug added to one
// file and forgotten in the other at build time.
const solutionSlugs = new Set(solutions.map((solution) => solution.slug));
const detailSlugs = new Set(solutionDetails.map((detail) => detail.slug));
if (
  solutionSlugs.size !== detailSlugs.size ||
  [...solutionSlugs].some((slug) => !detailSlugs.has(slug))
) {
  throw new Error('config/solution-details.ts is out of sync with config/solutions.ts slugs.');
}

export function getSolutionDetailBySlug(slug: string): SolutionDetail | undefined {
  return solutionDetails.find((detail) => detail.slug === slug);
}
