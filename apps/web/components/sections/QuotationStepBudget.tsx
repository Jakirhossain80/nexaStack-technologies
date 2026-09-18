import { BUDGET_RANGE_OPTIONS } from '@nexastack/shared';
import { Controller } from 'react-hook-form';

import type { QuotationStepProps } from '@/components/sections/QuotationStepClient';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { YesNoToggle } from '@/components/ui/YesNoToggle';

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);
const LABEL_CLASSES = 'block text-label font-medium text-primary';

const MAINTENANCE_TOGGLE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: 'Not sure yet' },
] as const;

/** Step 4 — Budget and timeline. */
export function QuotationStepBudget({ form }: QuotationStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="budgetRange" className={LABEL_CLASSES}>
          Budget range{REQUIRED_MARK}
        </label>
        <Select
          id="budgetRange"
          invalid={Boolean(errors.budgetRange)}
          aria-required="true"
          aria-describedby="budgetRange-error"
          className="mt-2"
          placeholder="Choose a budget range"
          options={BUDGET_RANGE_OPTIONS}
          {...register('budgetRange')}
        />
        <p className="mt-1.5 text-label text-secondary">
          Draft ranges — not final figures. We&rsquo;ll confirm exact pricing after reviewing your request.
        </p>
        <FieldError id="budgetRange-error" message={errors.budgetRange?.message} />
      </div>

      <div>
        <label htmlFor="preferredStartDate" className={LABEL_CLASSES}>
          Preferred start date{REQUIRED_MARK}
        </label>
        <Input
          id="preferredStartDate"
          type="date"
          invalid={Boolean(errors.preferredStartDate)}
          aria-required="true"
          aria-describedby="preferredStartDate-error"
          className="mt-2"
          {...register('preferredStartDate')}
        />
        <FieldError id="preferredStartDate-error" message={errors.preferredStartDate?.message} />
      </div>

      <div>
        <label htmlFor="targetCompletionDate" className={LABEL_CLASSES}>
          Target completion date (optional)
        </label>
        <Input
          id="targetCompletionDate"
          type="date"
          invalid={Boolean(errors.targetCompletionDate)}
          aria-describedby="targetCompletionDate-error"
          className="mt-2"
          {...register('targetCompletionDate')}
        />
        <FieldError id="targetCompletionDate-error" message={errors.targetCompletionDate?.message} />
      </div>

      <Controller
        control={control}
        name="maintenanceRequired"
        render={({ field }) => (
          <YesNoToggle
            legend="Will you need ongoing maintenance?"
            name={field.name}
            options={MAINTENANCE_TOGGLE_OPTIONS}
            value={field.value || undefined}
            onChange={field.onChange}
            onBlur={field.onBlur}
            invalid={Boolean(errors.maintenanceRequired)}
            describedById="maintenanceRequired-error"
            required
          />
        )}
      />
      <FieldError id="maintenanceRequired-error" message={errors.maintenanceRequired?.message} />
    </div>
  );
}
