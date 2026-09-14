/**
 * Technology stack — the single source of truth for the homepage Technology Stack section and
 * `/technologies`. Every item here must trace to root CLAUDE.md section 5 (the real, pinned
 * stack). Never pad this list with technology that sounds credible but isn't actually used —
 * a stack list is a factual claim, not a mood board.
 */

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
