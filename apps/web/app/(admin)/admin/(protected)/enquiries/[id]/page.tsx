import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/Badge';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { getEnquiryById } from '@/lib/adminDashboard.server';

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
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

export default async function EnquiryDetailPage({ params }: EnquiryDetailPageProps) {
  const { id } = await params;
  const enquiry = await getEnquiryById(id);
  if (!enquiry) notFound();

  const status = enquiry.status === 'responded' ? 'responded' : 'new';

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-page font-semibold tracking-tight text-primary">{enquiry.subject}</h1>
        <Badge>{enquiry.status}</Badge>
      </div>
      <p className="mt-1 text-label text-secondary">Submitted {formatTimestamp(enquiry.createdAt)}</p>

      <dl className="mt-8 space-y-4 rounded-card border border-default bg-surface p-5">
        <div>
          <dt className="text-label text-secondary">Name</dt>
          <dd className="mt-1 text-body text-primary">{enquiry.fullName}</dd>
        </div>
        <div>
          <dt className="text-label text-secondary">Email</dt>
          <dd className="mt-1 text-body text-primary">{enquiry.email}</dd>
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
            {PREFERRED_CONTACT_LABELS[enquiry.preferredContactMethod] ?? enquiry.preferredContactMethod}
          </dd>
        </div>
        <div>
          <dt className="text-label text-secondary">Message</dt>
          <dd className="mt-1 whitespace-pre-wrap text-body text-primary">{enquiry.message}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <StatusToggle kind="enquiries" id={enquiry.id} currentStatus={status} />
      </div>
    </div>
  );
}
