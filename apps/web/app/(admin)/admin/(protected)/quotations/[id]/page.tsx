import {
  BUDGET_RANGE_OPTIONS,
  DESIGN_REQUIREMENTS_OPTIONS,
  MAINTENANCE_OPTIONS,
  NUMBER_OF_PAGES_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  REQUIRED_SERVICE_OPTIONS,
} from '@nexastack/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { getQuotationById } from '@/lib/adminDashboard.server';

// Same label lookup the public wizard's own Step 5 review uses (QuotationStepFinal.tsx) —
// stored values are the raw option value (e.g. "new-website"), not the human-readable label.
function labelFor(options: readonly { value: string; label: string }[], value: string | undefined): string {
  return options.find((option) => option.value === value)?.label ?? (value || '—');
}

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Quotation request detail',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function Field({ label, value }: { label: string; value: string | number | boolean | undefined }) {
  if (value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
  return (
    <div>
      <dt className="text-label text-secondary">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-body text-primary">{display}</dd>
    </div>
  );
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = await params;
  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  const status = quotation.status === 'responded' ? 'responded' : 'new';

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-page font-semibold tracking-tight text-primary">
          {quotation.fullName} — {labelFor(PROJECT_TYPE_OPTIONS, quotation.projectType)}
        </h1>
        <Badge>{quotation.status}</Badge>
      </div>
      <p className="mt-1 text-label text-secondary">
        Reference {quotation.referenceNumber} · Submitted {formatTimestamp(quotation.createdAt)}
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-card border border-default bg-surface p-5">
          <h2 className="text-card font-semibold text-primary">Client information</h2>
          <dl className="mt-4 space-y-4">
            <Field label="Name" value={quotation.fullName} />
            <Field label="Email" value={quotation.email} />
            <Field label="Telephone" value={quotation.telephone} />
            <Field label="Company" value={quotation.companyName} />
            <Field label="Country" value={quotation.country} />
          </dl>
        </section>

        <section className="rounded-card border border-default bg-surface p-5">
          <h2 className="text-card font-semibold text-primary">Project information</h2>
          <dl className="mt-4 space-y-4">
            <Field label="Project type" value={labelFor(PROJECT_TYPE_OPTIONS, quotation.projectType)} />
            <Field
              label="Required services"
              value={quotation.requiredServices.map((v) => labelFor(REQUIRED_SERVICE_OPTIONS, v)).join(', ')}
            />
            <Field label="Business objectives" value={quotation.businessObjectives} />
            <Field label="Target users" value={quotation.targetUsers} />
            <Field
              label="Project status"
              value={quotation.projectStatus === 'existing' ? 'Existing project' : 'New project'}
            />
          </dl>
        </section>

        <section className="rounded-card border border-default bg-surface p-5">
          <h2 className="text-card font-semibold text-primary">Project requirements</h2>
          <dl className="mt-4 space-y-4">
            <Field label="Required features" value={quotation.requiredFeatures} />
            <Field label="Number of pages" value={labelFor(NUMBER_OF_PAGES_OPTIONS, quotation.numberOfPages)} />
            <Field
              label="Design requirements"
              value={labelFor(DESIGN_REQUIREMENTS_OPTIONS, quotation.designRequirements)}
            />
            <Field label="Needs an admin dashboard" value={quotation.needsAdminDashboard} />
            <Field label="Needs authentication" value={quotation.needsAuthentication} />
            <Field label="Integrations" value={quotation.integrations} />
            <Field label="Reference websites" value={quotation.referenceWebsites?.join(', ')} />
          </dl>
        </section>

        <section className="rounded-card border border-default bg-surface p-5">
          <h2 className="text-card font-semibold text-primary">Budget and timeline</h2>
          <dl className="mt-4 space-y-4">
            <Field label="Budget range" value={labelFor(BUDGET_RANGE_OPTIONS, quotation.budgetRange)} />
            <Field label="Preferred start date" value={quotation.preferredStartDate} />
            <Field label="Target completion date" value={quotation.targetCompletionDate} />
            <Field
              label="Maintenance required"
              value={labelFor(MAINTENANCE_OPTIONS, quotation.maintenanceRequired)}
            />
          </dl>
        </section>

        <section className="rounded-card border border-default bg-surface p-5">
          <h2 className="text-card font-semibold text-primary">Final submission</h2>
          <dl className="mt-4 space-y-4">
            <Field label="Attachments" value={quotation.attachments?.join(', ')} />
            <Field label="Additional message" value={quotation.additionalMessage} />
          </dl>
        </section>
      </div>

      <div className="mt-6">
        <StatusToggle kind="quotations" id={quotation.id} currentStatus={status} />
      </div>
    </div>
  );
}
