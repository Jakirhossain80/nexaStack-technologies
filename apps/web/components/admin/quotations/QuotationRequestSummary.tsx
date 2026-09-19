import type { QuotationAdminDetail } from '@nexastack/shared';
import type { ReactNode } from 'react';

import { QuotationAttachmentList } from '@/components/admin/quotations/QuotationAttachmentList';
import {
  budgetRangeLabel,
  designRequirementsLabel,
  maintenanceLabel,
  numberOfPagesLabel,
  projectStatusLabel,
  projectTypeLabel,
  serviceLabel,
} from '@/lib/quotationLabels';

export interface QuotationRequestSummaryProps {
  quotation: QuotationAdminDetail;
}

/**
 * The request as the client experienced it: the same five groups, in the same order, as the
 * `/quotation` wizard. The wizard's own review summary is not reusable here (its group and item
 * components are private to that file and wired to form state, and the wizard must not be
 * modified), so this renders from the persisted record instead, taking every label from the same
 * `*_OPTIONS` in `@nexastack/shared` that the wizard uses. The first four titles repeat the
 * wizard's `STEP_NAMES` (that constant lives in a client module a Server Component cannot read).
 *
 * Read-only: this is what the client wrote. The admin's own commentary lives in the notes below.
 */
export function QuotationRequestSummary({ quotation }: QuotationRequestSummaryProps) {
  const q = quotation;

  return (
    <div className="space-y-12">
      <Group id="group-client" step={1} title="Client information">
        <Field label="Full name">{q.fullName}</Field>
        <Field label="Email">
          <span className="break-all">{q.email}</span>
        </Field>
        <Field label="Telephone">{q.telephone}</Field>
        <Field label="Company">{q.companyName}</Field>
        <Field label="Country">{q.country}</Field>
      </Group>

      <Group id="group-project" step={2} title="Project information">
        <Field label="Project type">{projectTypeLabel(q.projectType)}</Field>
        <Field label="Required services">
          {q.requiredServices.length > 0 ? (
            <ul className="list-inside list-disc">
              {q.requiredServices.map((service) => (
                <li key={service}>{serviceLabel(service)}</li>
              ))}
            </ul>
          ) : undefined}
        </Field>
        <Field label="Business objectives">{q.businessObjectives}</Field>
        <Field label="Target users">{q.targetUsers}</Field>
        <Field label="Project status">{projectStatusLabel(q.projectStatus)}</Field>
      </Group>

      <Group id="group-requirements" step={3} title="Project requirements">
        <Field label="Required features">{q.requiredFeatures}</Field>
        <Field label="Number of pages">{numberOfPagesLabel(q.numberOfPages)}</Field>
        <Field label="Design requirements">{designRequirementsLabel(q.designRequirements)}</Field>
        <Field label="Admin dashboard needed">{yesNo(q.needsAdminDashboard)}</Field>
        <Field label="Authentication needed">{yesNo(q.needsAuthentication)}</Field>
        <Field label="Integrations">{q.integrations}</Field>
        <Field label="Reference websites">
          {q.referenceWebsites.length > 0 ? (
            <ul className="space-y-1">
              {q.referenceWebsites.map((site) => (
                <li key={site}>
                  <ReferenceSite value={site} />
                </li>
              ))}
            </ul>
          ) : undefined}
        </Field>
      </Group>

      <Group id="group-budget" step={4} title="Budget and timeline">
        <Field label="Budget range">{budgetRangeLabel(q.budgetRange)}</Field>
        <Field label="Preferred start date">{q.preferredStartDate}</Field>
        <Field label="Target completion date">{q.targetCompletionDate}</Field>
        <Field label="Maintenance required">{maintenanceLabel(q.maintenanceRequired)}</Field>
      </Group>

      <Group
        id="group-final"
        step={5}
        title="Message and attachments"
        after={
          <div className="mt-6 border-t border-default pt-6">
            <h3 className="text-label text-secondary">Attachments</h3>
            <div className="mt-2">
              <QuotationAttachmentList quotationId={q.id} attachments={q.attachments} />
            </div>
          </div>
        }
      >
        <Field label="Additional message">{q.additionalMessage}</Field>
      </Group>
    </div>
  );
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Reference sites are typed by an anonymous submitter and the shared schema accepts any URL scheme
 * (`javascript:` included), so only http(s) addresses become links. Anything else is shown as
 * plain text and never made clickable.
 */
function ReferenceSite({ value }: { value: string }) {
  let href: string | null = null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') href = url.href;
  } catch {
    href = null;
  }

  if (!href) {
    return (
      <span className="break-all">
        {value} <span className="text-secondary">(not a web link, so not clickable)</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="break-all rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover"
    >
      {value}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

interface GroupProps {
  id: string;
  step: number;
  title: string;
  /** The group's `Field`s, rendered as a description list. */
  children: ReactNode;
  /** Content that is not a label/value pair, rendered inside the same card below the list. */
  after?: ReactNode;
}

function Group({ id, step, title, children, after }: GroupProps) {
  return (
    <section aria-labelledby={id}>
      <p className="text-label font-medium text-secondary">Step {step} of 5</p>
      <h2 id={id} className="mt-1 text-card font-semibold text-primary">
        {title}
      </h2>
      <div className="mt-4 rounded-card border border-default bg-surface p-5 sm:p-6">
        <dl className="space-y-5">{children}</dl>
        {after}
      </div>
    </section>
  );
}

/** One label/value pair. Stacked on mobile, label-left/value-right from `sm`. */
function Field({ label, children }: { label: string; children?: ReactNode }) {
  const empty = children === undefined || children === null || children === '' || children === false;
  return (
    <div className="sm:grid sm:grid-cols-3 sm:gap-x-6">
      <dt className="text-label text-secondary sm:col-span-1">{label}</dt>
      <dd className="mt-1 text-body break-words whitespace-pre-wrap text-primary sm:col-span-2 sm:mt-0">
        {empty ? <span className="text-secondary">Not provided</span> : children}
      </dd>
    </div>
  );
}
