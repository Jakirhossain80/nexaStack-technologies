import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getServiceBySlug, services } from '@/config/services';

// STUB: content is real (from config/services.ts) but this page is not designed yet — that is
// separate work. `dynamicParams = false` means only the six configured slugs render; anything
// else correctly 404s. Once designed, revisit `robots` below and add canonical/OG/JSON-LD
// (root CLAUDE.md section 13, `Service` type).

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.summary,
    robots: { index: false, follow: false },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">{service.title}</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">{service.summary}</p>
    </div>
  );
}
