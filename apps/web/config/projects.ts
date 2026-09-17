/**
 * Portfolio projects — the single source of truth. Read by the homepage Featured Portfolio
 * section, `/portfolio` and `/portfolio/[slug]`. Never hardcode a project in a component.
 *
 * Only real, shipped-or-in-progress work belongs here. No placeholder or "coming soon"
 * entries — a fake project card is fabricated social proof, same as a fake testimonial.
 */

export type ProjectStatus = 'live' | 'in-development';

export interface Project {
  slug: string;
  title: string;
  summary: string;
  /** Path to a real screenshot. Not wired up yet — `ProjectCard` renders a mockup frame until one exists. */
  image: string;
  tags: readonly string[];
  status: ProjectStatus;
  liveUrl: string;
  repoUrl?: string;
  caseStudyHref: `/${string}`;
  /** Shown in the homepage section. A future project can be added here without appearing there. */
  featured: boolean;
}

export const projects: readonly Project[] = [
  {
    slug: 'careerbridge',
    title: 'CareerBridge',
    summary:
      'A full-stack job portal with separate candidate, employer and admin experiences — job listings, applications, and role-based dashboards.',
    image: '/images/portfolio/careerbridge.png',
    tags: [
      'Next.js',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Express',
      'MongoDB',
      'Firebase Authentication',
      'JWT',
    ],
    // Known bugs: authentication/redirect flow issues, incomplete RBAC enforcement. Flip to
    // 'live' once those are fixed — nothing else needs to change.
    status: 'in-development',
    liveUrl: 'https://careerbridge-client.vercel.app',
    repoUrl: 'https://github.com/Jakirhossain80/careerbridge',
    caseStudyHref: '/portfolio/careerbridge',
    featured: true,
  },
] as const;

export function getFeaturedProjects(): readonly Project[] {
  return projects.filter((project) => project.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
