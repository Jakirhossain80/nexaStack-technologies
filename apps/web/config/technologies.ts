/**
 * Technology stack — the single source of truth for the homepage Technology Stack section and
 * `/technologies`. Every item here must trace to root CLAUDE.md section 5 (the real, pinned
 * stack). Never pad this list with technology that sounds credible but isn't actually used —
 * a stack list is a factual claim, not a mood board.
 */

import type { Project } from './projects';
import { projects } from './projects';
import type { Service } from './services';
import { services } from './services';

export type TechCategoryIcon = 'browser' | 'server' | 'database' | 'shield' | 'palette' | 'terminal';

export interface TechCategory {
  id: string;
  label: string;
  description: string;
  icon: TechCategoryIcon;
  items: readonly string[];
}

export const technologyCategories: readonly TechCategory[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    description: 'The interface layer — server-rendered pages and typed components.',
    icon: 'browser',
    items: ['Next.js', 'React', 'TypeScript'],
  },
  {
    id: 'backend',
    label: 'Backend',
    description: 'The application server handling requests, routing and business logic.',
    icon: 'server',
    items: ['Node.js', 'Express.js'],
  },
  {
    id: 'database',
    label: 'Database',
    description: 'Where content, enquiries and quotations are stored.',
    icon: 'database',
    items: ['MongoDB Atlas', 'Mongoose'],
  },
  {
    id: 'authentication',
    label: 'Authentication',
    description: 'How admin sessions are verified and kept secure.',
    icon: 'shield',
    items: ['JWT', 'bcrypt', 'HTTP-only Cookies'],
  },
  {
    id: 'ui-styling',
    label: 'UI and Styling',
    description: "The design system's building blocks — utility styling, accessible primitives and type.",
    icon: 'palette',
    items: ['Tailwind CSS', 'Radix UI', 'Geist Sans', 'Geist Mono'],
  },
  {
    id: 'dev-tools',
    label: 'Development Tools',
    description: 'The tooling that keeps the codebase consistent and versioned.',
    icon: 'terminal',
    items: ['ESLint', 'Prettier', 'pnpm', 'Git & GitHub'],
  },
] as const;

/**
 * Four categories for the full `/technologies` page only — not rendered by the homepage's
 * bento section, which reads `technologyCategories` above and is unaffected by these
 * additional exports. Kept in the same file as the six above so the stack still has one
 * source of truth, without touching the homepage's existing array or its consumer.
 *
 * Same honesty rule as the six above, with one addition: a category may name a real,
 * installed item as a chip (`items`), or describe an intended-but-not-yet-installed piece
 * of the architecture in `description` prose — never the reverse. Verified directly
 * against `package.json` / the lockfile, not assumed from root CLAUDE.md section 5's
 * stack table, which names some pieces (React Hook Form, @hookform/resolvers, TanStack
 * Query) that are not actually installed anywhere in this repository yet.
 */
export const additionalTechnologyCategories: readonly TechCategory[] = [
  {
    id: 'forms-validation',
    label: 'Forms and Validation',
    description:
      "Form schemas are written once in Zod — installed and real, shared between the web app and the API so client and server validate against the exact same rules. React Hook Form and @hookform/resolvers are the intended client-side form layer per the project's architecture, but neither package is installed in this codebase yet.",
    icon: 'shield',
    items: ['Zod'],
  },
  {
    id: 'state-management',
    label: 'State Management',
    description:
      "No global state library — deliberately. Public pages read data with native fetch in Server Components; filters, pagination and search live in the URL via search params, kept shareable and back-button correct. TanStack Query is the intended layer for admin-side caching and mutations, but it isn't installed yet. Redux, Zustand, Jotai and MobX were evaluated and explicitly ruled out (root CLAUDE.md section 5) — URL state and, eventually, TanStack Query cover the real need without one.",
    icon: 'database',
    items: ['Native fetch', 'URL Search Params'],
  },
  {
    id: 'testing',
    label: 'Testing',
    description:
      'No test runner, test files or accessibility-testing tool are installed in this repository yet — testing here is genuinely unconfigured today, not partially built. The intended practice, once in place, covers unit tests for schemas and service-layer logic, integration tests for auth, contact and quotation endpoints, an end-to-end smoke test of the contact and quotation flows, and axe-core accessibility checks on key pages (root CLAUDE.md section 20).',
    icon: 'terminal',
    items: [],
  },
  {
    id: 'deployment-platforms',
    label: 'Deployment Platforms',
    description: 'Where the site, API, database and media actually run.',
    icon: 'server',
    items: ['Vercel', 'Render', 'MongoDB Atlas', 'Cloudinary'],
  },
] as const;

/** All eleven categories, homepage's six first, in the order `/technologies` renders them. */
export const fullTechnologyCategories: readonly TechCategory[] = [
  ...technologyCategories,
  ...additionalTechnologyCategories,
];

/**
 * Real cross-links for `/technologies`'s "Related services and projects" section — exact
 * string-set intersection against `service.relatedTechnologies` / `project.tags`, the same
 * real fields `/services/[slug]` and `/portfolio/[slug]` already render. No fuzzy matching:
 * a differently-labelled real match (e.g. a project tagged `'MongoDB'` against this file's
 * `'MongoDB Atlas'`) is left out rather than guessed at, so nothing here overstates a
 * connection that isn't actually recorded.
 */
export function getRelatedServicesForCategory(category: TechCategory): readonly Service[] {
  const items = new Set(category.items);
  return services.filter((service) => service.relatedTechnologies?.some((tech) => items.has(tech)));
}

export function getRelatedProjectsForCategory(category: TechCategory): readonly Project[] {
  const items = new Set(category.items);
  return projects.filter((project) => project.tags.some((tag) => items.has(tag)));
}
