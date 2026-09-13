import type { Metadata } from 'next';

// PLACEHOLDER: stub for individual service pages so nested-route highlighting can be tested. The
// service list is an open decision (root CLAUDE.md 22.10); this page deliberately defines no
// services and does not echo the slug. Replace with generateStaticParams + generateMetadata.

export const metadata: Metadata = {
  title: 'Service details',
  description: 'Details of an individual web development service from NexaStack Technologies.',
  robots: { index: false, follow: false },
};

export default function ServiceDetailPage() {
  return (
    <div className="page-container section-y">
      <h1 className="text-page font-semibold tracking-tight">Service details</h1>
      <p className="mt-4 max-w-prose text-body-lg text-secondary">
        This page will describe an individual service once the service list has been defined.
      </p>
    </div>
  );
}
