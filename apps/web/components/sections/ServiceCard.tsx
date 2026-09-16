import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import type { Service } from '@/config/services';

export interface ServiceCardProps {
  service: Service;
  /** 2–4 tags, reusing `Badge` (also used by Featured Portfolio and Technology Stack). Omitted → no chip row, so the homepage's existing card is unaffected. */
  relatedTechnologies?: readonly string[];
  /** Visible text on the stretched-link affordance row. */
  ctaLabel?: string;
}

/**
 * Flat Design 2.0 card (root CLAUDE.md 8): solid surface, 1px border, card shadow, elevates on
 * hover. The whole card is the link target via the stretched-link pattern — the real `<Link>`
 * wraps only the title (so its accessible name is the title alone), and an absolutely
 * positioned `::before` on that link covers the card. Tailwind's preflight already sets
 * `content: ''` on every `::before`/`::after` (see `NavLink.tsx`, which relies on the same
 * thing), so no arbitrary `content-['']` utility is needed.
 *
 * The global `:focus-visible` rule would otherwise ring only the anchor's own small box (the
 * title text). `outline-none` cancels that for this link specifically — a Tailwind utility,
 * which wins over the plain `@layer base` selector regardless of specificity — and the ring is
 * drawn on the `::before` overlay instead, so it traces the whole card.
 */
export function ServiceCard({ service, relatedTechnologies, ctaLabel = 'Learn more' }: ServiceCardProps) {
  return (
    <div className="group relative flex h-full flex-col rounded-card border border-default bg-surface p-6 shadow-card transition duration-150 ease-out hover:border-default-hover hover:shadow-card-hover">
      <span className="inline-flex size-11 items-center justify-center rounded-field bg-background-alt">
        <ServiceIcon icon={service.icon} gradientId={service.slug} className="size-6" />
      </span>

      <h3 className="mt-4 text-card font-semibold text-primary">
        <Link
          href={`/services/${service.slug}`}
          className="outline-none before:absolute before:inset-0 focus-visible:before:rounded-card focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-primary-blue"
        >
          {service.title}
        </Link>
      </h3>

      <p className="mt-2 flex-1 text-body text-secondary">{service.summary}</p>

      {relatedTechnologies && relatedTechnologies.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {relatedTechnologies.map((tech) => (
            <li key={tech}>
              <Badge mono>{tech}</Badge>
            </li>
          ))}
        </ul>
      )}

      <span
        aria-hidden="true"
        className="mt-4 inline-flex items-center gap-1 text-body font-semibold text-primary-blue"
      >
        {ctaLabel}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-1"
        >
          <path d="M4 10h12M11 5l5 5-5 5" />
        </svg>
      </span>
    </div>
  );
}
