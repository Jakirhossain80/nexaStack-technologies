import { COUNTRIES, type QuotationInput } from '@nexastack/shared';
import type { UseFormReturn } from 'react-hook-form';

import type { QuotationFormFields } from '@/components/sections/QuotationWizard';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const COUNTRY_OPTIONS = COUNTRIES.map((name) => ({ value: name, label: name }));

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);
const LABEL_CLASSES = 'block text-label font-medium text-primary';

export interface QuotationStepProps {
  form: UseFormReturn<QuotationFormFields, unknown, QuotationInput>;
}

/** Step 1 — Client information. */
export function QuotationStepClient({ form }: QuotationStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="fullName" className={LABEL_CLASSES}>
          Full name{REQUIRED_MARK}
        </label>
        <Input
          id="fullName"
          autoComplete="name"
          invalid={Boolean(errors.fullName)}
          aria-required="true"
          aria-describedby="fullName-error"
          className="mt-2"
          {...register('fullName')}
        />
        <FieldError id="fullName-error" message={errors.fullName?.message} />
      </div>

      <div>
        <label htmlFor="email" className={LABEL_CLASSES}>
          Email address{REQUIRED_MARK}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={Boolean(errors.email)}
          aria-required="true"
          aria-describedby="email-error"
          className="mt-2"
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="telephone" className={LABEL_CLASSES}>
          Telephone{REQUIRED_MARK}
        </label>
        <Input
          id="telephone"
          type="tel"
          autoComplete="tel"
          invalid={Boolean(errors.telephone)}
          aria-required="true"
          aria-describedby="telephone-error"
          className="mt-2"
          {...register('telephone')}
        />
        <FieldError id="telephone-error" message={errors.telephone?.message} />
      </div>

      <div>
        <label htmlFor="companyName" className={LABEL_CLASSES}>
          Company name (optional)
        </label>
        <Input
          id="companyName"
          autoComplete="organization"
          invalid={Boolean(errors.companyName)}
          aria-describedby="companyName-error"
          className="mt-2"
          {...register('companyName')}
        />
        <FieldError id="companyName-error" message={errors.companyName?.message} />
      </div>

      <div>
        <label htmlFor="country" className={LABEL_CLASSES}>
          Country{REQUIRED_MARK}
        </label>
        <Select
          id="country"
          autoComplete="country-name"
          invalid={Boolean(errors.country)}
          aria-required="true"
          aria-describedby="country-error"
          className="mt-2"
          placeholder="Choose your country"
          options={COUNTRY_OPTIONS}
          {...register('country')}
        />
        <FieldError id="country-error" message={errors.country?.message} />
      </div>
    </div>
  );
}
