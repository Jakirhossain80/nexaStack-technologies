import Link from 'next/link';
import type { Metadata } from 'next';

import { services } from '@/config/services';

// STUB: content is real (from config/services.ts) but this page is not designed yet — that is
// separate work. Once designed, revisit `robots` below (currently noindex, matching the detail
// stubs) and give this page a real canonical/OG/JSON-LD per root CLAUDE.md section 13.

export const metadata: Metadata = {
  title: 'Services',
  description: 'The web development services offered by NexaStack Technologies.',
  robots: { index: false, follow: false },
};

export default function ServicesPage() {
  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">Services</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        The web development services NexaStack Technologies offers.
      </p>

      <ul className="mt-8 max-w-prose space-y-6">
        {services.map((service) => (
          <li key={service.slug}>
            <Link href={`/services/${service.slug}`} className="rounded-field focus-ring">
              <span className="text-card font-semibold text-primary-blue">{service.title}</span>
            </Link>
            <p className="mt-1 text-body text-secondary">{service.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
