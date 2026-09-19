import { OBJECT_ID_PATTERN } from '@nexastack/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentEditorHeader } from '@/components/admin/content/ContentEditorHeader';
import { LoadError } from '@/components/admin/content/LoadError';
import { EnquiryNotes } from '@/components/admin/enquiries/EnquiryNotes';
import { ContactClientActions } from '@/components/admin/quotations/ContactClientActions';
import { QuotationArchiveButton } from '@/components/admin/quotations/QuotationArchiveButton';
import { QuotationNoteForm } from '@/components/admin/quotations/QuotationNoteForm';
import { QuotationRequestSummary } from '@/components/admin/quotations/QuotationRequestSummary';
import { QuotationStatusBadge } from '@/components/admin/quotations/QuotationStatusBadge';
import { QuotationStatusControl } from '@/components/admin/quotations/QuotationStatusControl';
import { company } from '@/config/company';
import { getQuotationDetail } from '@/lib/adminQuotations.server';
import { projectTypeLabel } from '@/lib/quotationLabels';

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Quotation request',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: company.hours.timeZone,
  }).format(date);
}

/**
 * One quotation request. Reading it changes nothing (no automatic status change on open).
 *
 * Three visually separate areas, so it is always obvious what the client wrote and what is internal:
 * (1) follow-up: the admin's own controls (status, contact the client, archive); (2) the request
 * exactly as the client submitted it, in the same five groups as the form they filled in, read-only;
 * (3) internal notes, which the client never sees.
 */
export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = await params;
  if (!OBJECT_ID_PATTERN.test(id)) notFound();

  const result = await getQuotationDetail(id);
  if (!result.ok && result.status === 404) notFound();
  if (!result.ok) {
    return <LoadError subject="this quotation request" status={result.status} message={result.message} />;
  }

  const quotation = result.data;
  const projectType = projectTypeLabel(quotation.projectType);

  return (
    <div className="max-w-4xl">
      <ContentEditorHeader
        title={`${quotation.fullName} — ${projectType}`}
        backHref="/admin/quotations"
        backLabel="All quotation requests"
        badges={
          <>
            <QuotationStatusBadge status={quotation.status} />
            {quotation.archived && (
              <span className="text-label font-medium text-secondary">Archived</span>
            )}
          </>
        }
        description={
          <>
            Reference <span className="font-mono">{quotation.referenceNumber}</span> · Submitted{' '}
            {formatTimestamp(quotation.createdAt)}
          </>
        }
      />

      <section aria-labelledby="followup-heading" className="mt-10">
        <h2 id="followup-heading" className="text-card font-semibold text-primary">
          Follow-up
        </h2>
        <div className="mt-4 space-y-6 rounded-card border border-default bg-surface p-5 sm:p-6">
          <QuotationStatusControl quotationId={quotation.id} status={quotation.status} />
          <div className="border-t border-default pt-6">
            <ContactClientActions
              fullName={quotation.fullName}
              email={quotation.email}
              telephone={quotation.telephone}
              country={quotation.country}
              projectTypeLabel={projectType}
              referenceNumber={quotation.referenceNumber}
            />
          </div>
          <div className="border-t border-default pt-6">
            <QuotationArchiveButton quotationId={quotation.id} archived={quotation.archived} />
          </div>
        </div>
      </section>

      <section aria-labelledby="submitted-heading" className="mt-14">
        <h2 id="submitted-heading" className="text-section font-semibold text-primary">
          What the client submitted
        </h2>
        <p className="mt-1 text-label text-secondary">
          Exactly as they sent it, in the order of the form they filled in. Read-only.
        </p>
        <div className="mt-8">
          <QuotationRequestSummary quotation={quotation} />
        </div>
      </section>

      <section
        aria-labelledby="notes-heading"
        className="mt-14 rounded-card border border-dashed border-strong bg-background-alt p-5 sm:p-6"
      >
        <h2 id="notes-heading" className="text-card font-semibold text-primary">
          Internal notes
        </h2>
        <p className="mt-1 text-label text-secondary">
          Internal only. The client never sees these.
        </p>
        <div className="mt-4">
          <EnquiryNotes notes={quotation.notes} />
        </div>
        {/* On a `surface` card: the form's error text (text-error) is a verified pairing on
            surface and background, but not on this section's background-alt. */}
        <div className="mt-6 rounded-field border border-default bg-surface p-4">
          <QuotationNoteForm quotationId={quotation.id} />
        </div>
      </section>
    </div>
  );
}
