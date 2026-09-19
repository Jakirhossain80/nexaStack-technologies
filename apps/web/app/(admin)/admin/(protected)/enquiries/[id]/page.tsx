import { OBJECT_ID_PATTERN } from '@nexastack/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContentEditorHeader } from '@/components/admin/content/ContentEditorHeader';
import { LoadError } from '@/components/admin/content/LoadError';
import { EnquiryArchiveButton } from '@/components/admin/enquiries/EnquiryArchiveButton';
import { EnquiryNoteForm } from '@/components/admin/enquiries/EnquiryNoteForm';
import { EnquiryNotes } from '@/components/admin/enquiries/EnquiryNotes';
import { EnquiryStatusBadge } from '@/components/admin/enquiries/EnquiryStatusBadge';
import { EnquiryStatusControl } from '@/components/admin/enquiries/EnquiryStatusControl';
import { company } from '@/config/company';
import { getEnquiryDetail } from '@/lib/adminEnquiries.server';

interface EnquiryDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Enquiry detail',
};

const PREFERRED_CONTACT_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
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
 * One enquiry. Fetching it is what marks a `new` enquiry `read` (done by the API, once, audited),
 * so the badge below already shows the post-open status.
 *
 * Three visually separate areas, so it is always obvious what is the sender's own words and what is
 * internal commentary: (1) the client's original message, read-only; (2) the reply-workflow
 * controls; (3) internal notes, which the sender never sees.
 */
export default async function EnquiryDetailPage({ params }: EnquiryDetailPageProps) {
  const { id } = await params;
  if (!OBJECT_ID_PATTERN.test(id)) notFound();

  const result = await getEnquiryDetail(id);
  if (!result.ok && result.status === 404) notFound();
  if (!result.ok) {
    return <LoadError subject="this enquiry" status={result.status} message={result.message} />;
  }

  const enquiry = result.data;

  return (
    <div className="max-w-3xl">
      <ContentEditorHeader
        title={enquiry.subject}
        backHref="/admin/enquiries"
        backLabel="All enquiries"
        badges={
          <>
            <EnquiryStatusBadge status={enquiry.status} />
            {enquiry.archived && (
              <span className="text-label font-medium text-secondary">Archived</span>
            )}
          </>
        }
        description={`Submitted ${formatTimestamp(enquiry.createdAt)}`}
      />

      <section aria-labelledby="original-heading" className="mt-8">
        <h2 id="original-heading" className="text-card font-semibold text-primary">
          Client&rsquo;s original message
        </h2>
        <p className="mt-1 text-label text-secondary">Exactly as they sent it. Read-only.</p>
        <dl className="mt-4 space-y-4 rounded-card border border-default bg-surface p-5">
          <div>
            <dt className="text-label text-secondary">Name</dt>
            <dd className="mt-1 text-body text-primary">{enquiry.fullName}</dd>
          </div>
          <div>
            <dt className="text-label text-secondary">Email</dt>
            <dd className="mt-1 break-all text-body text-primary">{enquiry.email}</dd>
          </div>
          {enquiry.phone && (
            <div>
              <dt className="text-label text-secondary">Phone</dt>
              <dd className="mt-1 text-body text-primary">{enquiry.phone}</dd>
            </div>
          )}
          {enquiry.companyName && (
            <div>
              <dt className="text-label text-secondary">Company</dt>
              <dd className="mt-1 text-body text-primary">{enquiry.companyName}</dd>
            </div>
          )}
          <div>
            <dt className="text-label text-secondary">Preferred contact method</dt>
            <dd className="mt-1 text-body text-primary">
              {PREFERRED_CONTACT_LABELS[enquiry.preferredContactMethod] ??
                enquiry.preferredContactMethod}
            </dd>
          </div>
          <div>
            <dt className="text-label text-secondary">Message</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-body text-primary">
              {enquiry.message}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="workflow-heading" className="mt-10">
        <h2 id="workflow-heading" className="text-card font-semibold text-primary">
          Follow-up
        </h2>
        <div className="mt-4 space-y-6 rounded-card border border-default bg-surface p-5">
          <EnquiryStatusControl enquiryId={enquiry.id} status={enquiry.status} />
          <div className="border-t border-default pt-6">
            <EnquiryArchiveButton enquiryId={enquiry.id} archived={enquiry.archived} />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="notes-heading"
        className="mt-10 rounded-card border border-dashed border-strong bg-background-alt p-5"
      >
        <h2 id="notes-heading" className="text-card font-semibold text-primary">
          Internal notes
        </h2>
        <p className="mt-1 text-label text-secondary">
          Internal only. The person who wrote in never sees these.
        </p>
        <div className="mt-4">
          <EnquiryNotes notes={enquiry.notes} />
        </div>
        {/* On a `surface` card: the form's error text (text-error) is a verified pairing on
            surface and background, but not on this section's background-alt. */}
        <div className="mt-6 rounded-field border border-default bg-surface p-4">
          <EnquiryNoteForm enquiryId={enquiry.id} />
        </div>
      </section>
    </div>
  );
}
