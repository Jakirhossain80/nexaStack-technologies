import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSolutionBySlug, solutions } from '@/config/solutions';

// STUB: content is real (from config/solutions.ts) but this page is not designed yet — that is
// separate work. `dynamicParams = false` means only the five configured slugs render; anything
// else correctly 404s. Once designed, revisit `robots` below and add canonical/OG/JSON-LD
// (root CLAUDE.md section 13, `Service` type).

interface SolutionDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: SolutionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);
  if (!solution) return {};

  return {
    title: solution.title,
    description: solution.summary,
    robots: { index: false, follow: false },
  };
}

export default async function SolutionDetailPage({ params }: SolutionDetailPageProps) {
  const { slug } = await params;
  const solution = getSolutionBySlug(slug);
  if (!solution) notFound();

  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">{solution.title}</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">{solution.summary}</p>
    </div>
  );
}
