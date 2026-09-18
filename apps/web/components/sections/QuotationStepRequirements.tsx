import { DESIGN_REQUIREMENTS_OPTIONS, NUMBER_OF_PAGES_OPTIONS } from '@nexastack/shared';
import { Controller } from 'react-hook-form';

import type { QuotationStepProps } from '@/components/sections/QuotationStepClient';
import { FieldError } from '@/components/ui/FieldError';
import { RepeatableUrlField } from '@/components/ui/RepeatableUrlField';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { YesNoToggle } from '@/components/ui/YesNoToggle';

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);
const LABEL_CLASSES = 'block text-label font-medium text-primary';

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

/** Step 3 — Project requirements. */
export function QuotationStepRequirements({ form }: QuotationStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="requiredFeatures" className={LABEL_CLASSES}>
          Required features{REQUIRED_MARK}
        </label>
        <Textarea
          id="requiredFeatures"
          rows={5}
          placeholder="Describe the features and functionality you need — every project's needs are different, so tell us in your own words."
          invalid={Boolean(errors.requiredFeatures)}
          aria-required="true"
          aria-describedby="requiredFeatures-error"
          className="mt-2"
          {...register('requiredFeatures')}
        />
        <FieldError id="requiredFeatures-error" message={errors.requiredFeatures?.message} />
      </div>

      <div>
        <label htmlFor="numberOfPages" className={LABEL_CLASSES}>
          Number of pages{REQUIRED_MARK}
        </label>
        <Select
          id="numberOfPages"
          invalid={Boolean(errors.numberOfPages)}
          aria-required="true"
          aria-describedby="numberOfPages-error"
          className="mt-2"
          placeholder="Choose an approximate range"
          options={NUMBER_OF_PAGES_OPTIONS}
          {...register('numberOfPages')}
        />
        <FieldError id="numberOfPages-error" message={errors.numberOfPages?.message} />
      </div>

      <fieldset>
        <legend className={LABEL_CLASSES}>
          Design requirements{REQUIRED_MARK}
        </legend>
        <div className="mt-3 space-y-2">
          {DESIGN_REQUIREMENTS_OPTIONS.map((option) => (
            <label key={option.value} className="flex min-h-11 items-center gap-2 text-body text-primary">
              <input
                type="radio"
                value={option.value}
                aria-describedby="designRequirements-error"
                className="size-4 shrink-0 accent-primary-blue focus-ring"
                {...register('designRequirements')}
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError id="designRequirements-error" message={errors.designRequirements?.message} />
      </fieldset>

      <Controller
        control={control}
        name="needsAdminDashboard"
        render={({ field }) => (
          <YesNoToggle
            legend="Do you need an admin dashboard?"
            name={field.name}
            options={YES_NO_OPTIONS}
            value={field.value === true ? 'yes' : field.value === false ? 'no' : undefined}
            onChange={(value) => field.onChange(value === 'yes')}
            onBlur={field.onBlur}
            invalid={Boolean(errors.needsAdminDashboard)}
            describedById="needsAdminDashboard-error"
            required
          />
        )}
      />
      <FieldError id="needsAdminDashboard-error" message={errors.needsAdminDashboard?.message} />

      <Controller
        control={control}
        name="needsAuthentication"
        render={({ field }) => (
          <YesNoToggle
            legend="Do you need user accounts / authentication?"
            name={field.name}
            options={YES_NO_OPTIONS}
            value={field.value === true ? 'yes' : field.value === false ? 'no' : undefined}
            onChange={(value) => field.onChange(value === 'yes')}
            onBlur={field.onBlur}
            invalid={Boolean(errors.needsAuthentication)}
            describedById="needsAuthentication-error"
            required
          />
        )}
      />
      <FieldError id="needsAuthentication-error" message={errors.needsAuthentication?.message} />

      <div>
        <label htmlFor="integrations" className={LABEL_CLASSES}>
          Integrations (optional)
        </label>
        <Textarea
          id="integrations"
          rows={3}
          placeholder="e.g. payment gateway, CRM, email marketing tool"
          invalid={Boolean(errors.integrations)}
          aria-describedby="integrations-error"
          className="mt-2"
          {...register('integrations')}
        />
        <FieldError id="integrations-error" message={errors.integrations?.message} />
      </div>

      <Controller
        control={control}
        name="referenceWebsites"
        render={({ field }) => (
          <RepeatableUrlField
            id="referenceWebsites"
            label="Reference websites"
            values={field.value ?? []}
            onChange={field.onChange}
            max={5}
            invalid={Boolean(errors.referenceWebsites)}
            describedById="referenceWebsites-error"
          />
        )}
      />
      <FieldError id="referenceWebsites-error" message={errors.referenceWebsites?.message} />
    </div>
  );
}
