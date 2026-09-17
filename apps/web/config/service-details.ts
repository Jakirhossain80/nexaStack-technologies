/**
 * Long-form detail content for `/services/[slug]` — a companion to `config/services.ts`, not an
 * extension of it. `services.ts` stays a light "card" shape read by the homepage grid, the
 * listing page, and a future navbar dropdown; these 12 fields are only ever read by the detail
 * page, so they live here instead of growing that shared interface with fields most consumers
 * don't need.
 *
 * Honesty rules carried over from `config/faq.ts` and root CLAUDE.md section 22:
 * - No invented timeline (no day/week/month figure anywhere below) — timelines are scoped per
 *   quote, same commitment already made in the homepage FAQ's `project-timeline` entry.
 * - `relatedProjectSlugs` only names a project that is genuinely built with this service — an
 *   empty array is a valid, honest answer, not a gap to fill.
 * - `technologiesUsed` only names technology actually in root CLAUDE.md section 5 / this repo's
 *   `config/technologies.ts`. `performance-seo-audits` is deliberately empty for the same reason
 *   `services.ts` omits `relatedTechnologies` for it: axe-core/Lighthouse-style audit tooling
 *   isn't part of the pinned stack table, so nothing here would be honest to list.
 */

import { services } from './services';

export interface ServiceDetail {
  slug: string;
  introduction: string;
  problemsSolved: readonly string[];
  targetClients: string;
  includedFeatures: readonly string[];
  developmentApproach: string;
  technologiesUsed: readonly string[];
  deliverables: readonly string[];
  /** Slugs from `config/projects.ts`. Empty is valid — see file doc comment. */
  relatedProjectSlugs: readonly string[];
  faqs: readonly { question: string; answer: string }[];
}

export const serviceDetails: readonly ServiceDetail[] = [
  {
    slug: 'business-websites',
    introduction:
      "Company sites, landing pages and marketing websites, built for speed, search visibility and accessibility from the first commit. For a business whose site is often a prospective client's first impression, this covers everything from a single landing page to a multi-page company site, built as a Next.js application so content loads fast without unnecessary client-side JavaScript.",
    problemsSolved: [
      'A slow, unoptimised site that loses visitors before it finishes loading',
      'No clear path for a visitor to get in touch, or a design that reads as outdated',
      'Missing or incomplete SEO metadata — no Open Graph tags, no structured data',
      'A site that is difficult or impossible to use with a keyboard or screen reader',
    ],
    targetClients:
      "A small business or startup that needs a professional web presence, or an existing business whose current site needs rebuilding. This is a founder-led engagement scoped one project at a time, not a package aimed at a large enterprise coordinating a multi-team rollout.",
    includedFeatures: [
      'Responsive design across mobile, tablet and desktop',
      'WCAG 2.1 AA accessibility practices — semantic HTML, keyboard operability, contrast-checked design tokens',
      'SEO metadata, Open Graph and Twitter card data, and JSON-LD structured data',
      'A contact form with server-side validation',
      'Deployment to production with monitoring in place',
    ],
    developmentApproach:
      'Follows the same eight-step process used across every NexaStack project, from consultation through to deployment and maintenance. For a business website, that mostly plays out through the design and content-focused steps, since there is little to no application backend involved.',
    technologiesUsed: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    deliverables: [
      'A fully responsive, deployed website',
      'Source code repository access',
      'A working contact form with server-side validation',
      'A baseline SEO setup — metadata, sitemap and structured data',
    ],
    relatedProjectSlugs: [],
    faqs: [
      {
        question: 'Can you redesign an existing business website instead of building a new one?',
        answer:
          "Yes — this also covers rebuilding an outdated site on the current stack, whether that means a full rebuild or restyling and reorganising existing content.",
      },
      {
        question: 'Do I need to provide my own content and images?',
        answer:
          "You can provide your own copy, images and branding, or work through what's needed together during the consultation — either way, it's confirmed in the written scope before development starts.",
      },
      {
        question: 'Will the site work properly on mobile?',
        answer:
          'Yes — every business website is built mobile-first, tested across multiple breakpoints, and checked for accessibility before launch, not treated as an afterthought.',
      },
    ],
  },
  {
    slug: 'mern-nextjs-applications',
    introduction:
      'Full-stack web applications with React, Node and MongoDB — authentication, dashboards, data-driven interfaces and everything behind them. This is where a project moves beyond static pages into real application logic: user accounts, stored data, and a frontend that talks to a backend API.',
    problemsSolved: [
      'A business idea that needs a working web application, not a set of static pages',
      'Manual processes that could be replaced by a self-serve web interface',
      'The need for user accounts, roles or saved data behind a login',
      'Fragmented tools or spreadsheets that a single purpose-built application could replace',
    ],
    targetClients:
      "A startup building a product around a web application, or an existing business that needs custom application logic beyond what a template or off-the-shelf tool provides — not a replacement for an established engineering team's own in-house platform.",
    includedFeatures: [
      'A React and Next.js frontend, using server and client components deliberately',
      'A Node.js and Express backend with a defined REST API',
      'A MongoDB Atlas database with Mongoose schema validation',
      'Authentication with bcrypt-hashed passwords and a JWT stored in an HTTP-only cookie',
      'Server-side validation on every form and API endpoint',
    ],
    developmentApproach:
      'Follows the same eight-step process as every project, with planning and development carrying more weight here than on a marketing site — the data model, API and auth flow need to be scoped before the interface can be finished.',
    technologiesUsed: [
      'Next.js',
      'React',
      'TypeScript',
      'Node.js',
      'Express.js',
      'MongoDB Atlas',
      'Mongoose',
      'JWT',
    ],
    deliverables: [
      'A fully responsive, deployed web application',
      'Source code repository access for both frontend and backend',
      'A documented REST API',
      'Working authentication and the agreed application features',
    ],
    relatedProjectSlugs: ['careerbridge'],
    faqs: [
      {
        question: 'What kind of application does this cover?',
        answer:
          "Anything from a small internal tool to a customer-facing product — the scope is defined during requirement analysis, based on what you actually need built.",
      },
      {
        question: 'Is hosting for the database included?',
        answer:
          'A MongoDB Atlas database is set up as part of the build; ongoing hosting is discussed as part of scoping, since it depends on how the application is used.',
      },
      {
        question: 'Can this integrate with third-party services, like payments or email?',
        answer:
          "Yes, where needed — required integrations are identified during requirement analysis so they're scoped and quoted upfront rather than discovered midway through development.",
      },
    ],
  },
  {
    slug: 'admin-dashboards',
    introduction:
      "Internal tools and content dashboards with role-based access, so your team can manage the site without touching code. This service covers the admin side of a project — the interface non-technical staff use to manage enquiries, content or other day-to-day data.",
    problemsSolved: [
      'Content changes that currently require a developer for a simple edit',
      'No single place to see or manage form submissions, enquiries or requests',
      'Everyone sharing one login, with no distinction between roles',
      'No record of who changed what inside the admin area',
    ],
    targetClients:
      "A business already running a website or application that needs a team-facing management layer — most often paired with a MERN/Next.js application build, but also relevant for adding admin capability to an existing site. Each dashboard is scoped to the client's actual content and workflows, not a generic off-the-shelf CMS.",
    includedFeatures: [
      'Role-based access control — super admin, admin and content editor roles',
      'JWT-based authentication with HTTP-only cookies, never stored in `localStorage`',
      'Server-side role checks enforced in the API, not just hidden UI elements',
      'TanStack Query for data fetching, caching and optimistic updates',
      'An audit log of significant admin actions',
    ],
    developmentApproach:
      'Follows the standard eight-step process, with particular attention during planning to the roles and permissions needed — an admin dashboard is only as useful as the access model it was built on.',
    technologiesUsed: ['Next.js', 'React', 'TypeScript', 'MongoDB Atlas', 'JWT', 'Tailwind CSS'],
    deliverables: [
      'A deployed admin interface, auth-guarded and role-restricted',
      'Source code repository access',
      'A documented list of roles and what each can access',
      'An audit log of significant admin actions',
    ],
    relatedProjectSlugs: ['careerbridge'],
    faqs: [
      {
        question: 'How many user roles can the dashboard support?',
        answer:
          'As many as the project needs — CareerBridge, for example, distinguishes candidate, employer and admin roles. The exact roles for your project are defined during requirement analysis.',
      },
      {
        question: "Can I manage my website's content from the dashboard?",
        answer:
          'Yes, that’s a typical use — content, enquiries and quotation requests are common examples, scoped to what your project actually needs managed.',
      },
      {
        question: 'Does this have to be built together with a new application, or can it stand alone?',
        answer:
          "It's most commonly paired with a new MERN/Next.js application build, but it can also be added to an existing site or application if the underlying stack supports it.",
      },
    ],
  },
  {
    slug: 'backend-and-apis',
    introduction:
      'REST APIs with validated inputs, proper error handling and documentation — built to be integrated with, not just to work once. This service covers backend work on its own: an API that a frontend, mobile app or another service can rely on, independent of who builds what consumes it.',
    problemsSolved: [
      'No documented API for a frontend or third party to integrate against',
      'Inconsistent error handling or response formats across endpoints',
      'Missing input validation, leaving endpoints exposed to bad or malicious data',
      'A backend that has grown without a clear structure between routing, business logic and data access',
    ],
    targetClients:
      "A business that needs a backend built or improved independently of the frontend — for example, an existing frontend team that needs an API to consume, or a business consolidating backend logic that's become hard to maintain. Typically a smaller-scale engagement than a full application build, since there is no frontend in scope.",
    includedFeatures: [
      'An Express.js REST API with a clear routes/controllers/services/models layering',
      'Zod validation on every request body, params and query',
      'A consistent success/error response format across all endpoints',
      'Helmet security headers, CORS restricted to an explicit origin allowlist, and rate limiting on sensitive routes',
      'Structured logging with Pino',
      'OpenAPI/Swagger documentation',
    ],
    developmentApproach:
      'Follows the standard eight-step process, with requirement analysis focused on the data model and the endpoints a consuming frontend or service actually needs, since there is no interface to design around.',
    technologiesUsed: ['Node.js', 'Express.js', 'MongoDB Atlas', 'Mongoose', 'JWT'],
    deliverables: [
      'A deployed, documented REST API',
      'Source code repository access',
      'OpenAPI/Swagger documentation',
      'Server-side validation and error handling across all endpoints',
    ],
    relatedProjectSlugs: [],
    faqs: [
      {
        question: "Can you build an API for a frontend someone else is developing?",
        answer:
          'Yes — the API is the deliverable here. It’s documented so any frontend, whether built by NexaStack or another team, can integrate against it.',
      },
      {
        question: 'Do you fix or extend an existing API, or only build new ones?',
        answer:
          "Extending an existing API falls under this service if the work is backend-focused, or under maintenance and bug fixing if it's more about resolving specific issues in an existing codebase.",
      },
      {
        question: 'What database does the API use?',
        answer:
          'MongoDB with Mongoose — the same database layer used across every project, so it stays consistent with the rest of the stack.',
      },
    ],
  },
  {
    slug: 'maintenance-and-bug-fixing',
    introduction:
      'Diagnosing and fixing problems in existing codebases, plus ongoing updates, dependency upgrades and monitoring. This service is for a project that already exists and needs to keep working, rather than a new build from scratch.',
    problemsSolved: [
      'A specific bug or broken feature on a live site or application',
      'Dependencies that have fallen out of date and need upgrading safely',
      'No one currently monitoring the site for errors or downtime',
      "A codebase that's grown unclear or difficult to work in over time",
    ],
    targetClients:
      "A business with an existing website or application — whether or not NexaStack originally built it — that needs fixes, upgrades or ongoing upkeep rather than a new project. Equally realistic as a one-off fix or an ongoing arrangement, depending on what's needed.",
    includedFeatures: [
      'Root-cause diagnosis of reported bugs, not just a surface-level patch',
      "Dependency upgrades, checked against the project's existing test suite where one exists",
      'Error monitoring and health-check setup',
      'Structured logging so future issues are easier to diagnose',
    ],
    developmentApproach:
      "Doesn't follow the full eight-step build process, since there's no new product to plan and design — instead scoped around requirement analysis (what's broken or needs updating) and testing, so a fix doesn't introduce a new regression.",
    technologiesUsed: ['ESLint', 'Prettier', 'pnpm', 'Git & GitHub'],
    deliverables: [
      'A written summary of what was diagnosed and fixed',
      'The fix or update deployed to production',
      'Source code repository access reflecting the change',
      'Monitoring or logging improvements, where part of the agreed scope',
    ],
    relatedProjectSlugs: [],
    faqs: [
      {
        question: 'Do you only fix bugs in projects NexaStack originally built?',
        answer:
          'No — this covers existing websites and applications generally, though an unfamiliar codebase may need an initial diagnosis phase before a fix can be scoped.',
      },
      {
        question: 'Is this a one-time fix or an ongoing arrangement?',
        answer:
          'Either — some engagements are a single fix, others are ongoing maintenance and monitoring. Which one fits is agreed upfront as part of the scope.',
      },
      {
        question: 'Can you upgrade outdated dependencies without breaking the site?',
        answer:
          "That's the goal of this service — upgrades are checked against existing functionality, and any existing test suite, before being considered done, rather than applied blind.",
      },
    ],
  },
  {
    slug: 'performance-seo-audits',
    introduction:
      'A concrete report on what is slowing a site down, hurting its ranking or blocking users, with the fixes prioritised. This service is a diagnostic engagement — an audit of an existing site’s performance, search visibility and accessibility, with findings written up rather than assumed.',
    problemsSolved: [
      'A site that feels slow, especially on mobile or a weaker connection',
      "Pages that aren't appearing in search results as expected",
      'Accessibility issues that block some visitors from using the site',
      'Not knowing which of several problems to prioritise fixing first',
    ],
    targetClients:
      "A business with an existing, live website — built by NexaStack or otherwise — that wants to understand what's actually wrong before committing to a fix. Also useful ahead of a bug-fixing or maintenance engagement, to establish what needs attention first.",
    includedFeatures: [
      'A performance review — load time, rendering behaviour, image and asset handling',
      'An SEO review — metadata, structured data, semantic heading structure, sitemap and robots setup',
      'An accessibility review against WCAG 2.1 AA, including axe-core checks',
      'A written report with findings prioritised by impact',
    ],
    developmentApproach:
      "Doesn't follow the eight-step build process, since nothing is being built during the audit itself — it's scoped as its own diagnosis-and-reporting engagement. Any fixes that follow are scoped separately, as their own maintenance or development work.",
    // Deliberately empty — see file doc comment: audit tooling isn't part of the pinned stack
    // table, matching `services.ts`'s own omission of `relatedTechnologies` for this service.
    technologiesUsed: [],
    deliverables: [
      'A written audit report covering performance, SEO and accessibility findings',
      'Findings prioritised by impact, not simply listed',
      'Clear recommendations for what to fix and why',
    ],
    relatedProjectSlugs: [],
    faqs: [
      {
        question: 'Does the audit include fixing the issues it finds?',
        answer:
          'The audit itself is the report and prioritised recommendations — implementing the fixes is scoped separately, whether as a maintenance engagement or a larger piece of work.',
      },
      {
        question: "Can you audit a site NexaStack didn't build?",
        answer: "Yes — this service isn't limited to sites built by NexaStack.",
      },
      {
        question: 'What does the audit actually check?',
        answer:
          "Performance (load time and rendering), SEO (metadata, structured data, semantic structure), and accessibility against WCAG 2.1 AA — see “What's included” above for the full breakdown.",
      },
    ],
  },
] as const;

// Defensive parity check, same spirit as the listing page's `getServices` helper: catches a
// typo or a service added to one file and forgotten in the other at build time, not at runtime
// on a live page.
const serviceSlugs = new Set(services.map((service) => service.slug));
const detailSlugs = new Set(serviceDetails.map((detail) => detail.slug));
if (serviceSlugs.size !== detailSlugs.size || [...serviceSlugs].some((slug) => !detailSlugs.has(slug))) {
  throw new Error('config/service-details.ts is out of sync with config/services.ts slugs.');
}

export function getServiceDetailBySlug(slug: string): ServiceDetail | undefined {
  return serviceDetails.find((detail) => detail.slug === slug);
}
