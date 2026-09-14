import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getProjectBySlug, projects } from '@/config/projects';

// STUB: content is real (from config/projects.ts) but this page is not designed yet — that is
// separate work, the real case-study build. `dynamicParams = false` means only the configured
// slugs render; anything else correctly 404s. Once designed, revisit `robots` below and add
// canonical/OG/JSON-LD (root CLAUDE.md section 13, `Article`-adjacent type for a project).

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

const NEW_TAB_NOTICE = '(opens in a new tab)';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.summary,
    robots: { index: false, follow: false },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <div className="page-container section-y">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-page font-semibold tracking-tight">{project.title}</h1>
        {project.status === 'in-development' && <Badge>In active development</Badge>}
      </div>

      <p className="mt-4 max-w-prose text-body-lg text-secondary">{project.summary}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li key={tag}>
            <Badge mono>{tag}</Badge>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button href={project.liveUrl} variant="secondary" target="_blank" rel="noopener noreferrer">
          Live Website <span className="sr-only">{NEW_TAB_NOTICE}</span>
        </Button>
        {project.repoUrl && (
          <Button href={project.repoUrl} variant="secondary" target="_blank" rel="noopener noreferrer">
            View on GitHub <span className="sr-only">{NEW_TAB_NOTICE}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
