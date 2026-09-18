import type { QuotationInput } from '@nexastack/shared';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import type { QuotationFormFields } from '@/components/sections/QuotationWizard';
import { Button } from '@/components/ui/Button';

export interface QuotationConfirmationProps {
  referenceNumber: string;
  form: UseFormReturn<QuotationFormFields, unknown, QuotationInput>;
}

/**
 * Replaces the wizard after a successful submit. The reference number is the one the API
 * returned, derived from the real persisted MongoDB document's `_id` (see
 * `apps/web/app/api/quotation/route.ts`) — never a value generated only for display.
 */
export function QuotationConfirmation({ referenceNumber, form }: QuotationConfirmationProps) {
  const { email, telephone } = useWatch({ control: form.control });

  return (
    <div role="status" className="mx-auto max-w-2xl rounded-card border border-default bg-surface p-8 text-center">
      <h2 className="text-card font-semibold tracking-tight text-primary">Request received</h2>

      <p className="mt-4 text-body-lg text-secondary">Your reference number is</p>
      <p className="mt-1 font-mono text-page font-semibold tracking-tight text-primary-blue">
        {referenceNumber}
      </p>

      <p className="mx-auto mt-6 max-w-prose text-body text-secondary">
        We&rsquo;ll review your request and reach out at {email || 'the email address you provided'}
        {telephone ? ` or ${telephone}` : ''} soon. Keep this reference number for your records.
      </p>

      <div className="mt-8">
        <Button href="/">Back to homepage</Button>
      </div>
    </div>
  );
}
