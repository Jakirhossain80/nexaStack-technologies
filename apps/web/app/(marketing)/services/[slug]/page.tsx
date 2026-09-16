import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { getServiceBySlug, services } from '@/config/services';

// STUB: content is real (from config/services.ts) but this page is not designed yet — that is
// separate work. It has the heading structure a fuller page will need (Overview, What's
// Included, Related Technologies), but "What's Included" is a placeholder, not real scope
// copy — writing that is a dedicated task once the real specifics exist. `dynamicParams = false`
// means only the six configured slugs render; anything else correctly 404s. Once designed,
// revisit `robots` below and add canonical/OG/JSON-LD (root CLAUDE.md section 13, `Service` type).

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
      <h1 className="text-page font-semibold tracking-tight text-primary">{service.title}</h1>

      <section aria-labelledby="overview-heading" className="mt-10 max-w-prose">
        <h2 id="overview-heading" className="text-section font-semibold tracking-tight text-primary">
          Overview
        </h2>
        <p className="mt-4 text-body-lg text-secondary">{service.summary}</p>
      </section>

      <section aria-labelledby="included-heading" className="mt-10 max-w-prose">
        <h2 id="included-heading" className="text-section font-semibold tracking-tight text-primary">
          What&rsquo;s Included
        </h2>
        <p className="mt-4 text-body text-secondary">
          Full scope details for this service are coming soon. In the meantime, submit a quote
          request and we&rsquo;ll walk through exactly what&rsquo;s included for your project.
        </p>
      </section>

      <section aria-labelledby="tech-heading" className="mt-10 max-w-prose">
        <h2 id="tech-heading" className="text-section font-semibold tracking-tight text-primary">
          Related Technologies
        </h2>
        {service.relatedTechnologies && service.relatedTechnologies.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {service.relatedTechnologies.map((tech) => (
              <li key={tech}>
                <Badge mono>{tech}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-body text-secondary">To be detailed in a future update.</p>
        )}
      </section>
    </div>
  );
}
