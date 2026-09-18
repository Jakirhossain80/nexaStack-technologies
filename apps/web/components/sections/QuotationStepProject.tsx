import { PROJECT_TYPE_OPTIONS, REQUIRED_SERVICE_OPTIONS } from '@nexastack/shared';

import type { QuotationStepProps } from '@/components/sections/QuotationStepClient';
import { FieldError } from '@/components/ui/FieldError';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);
const LABEL_CLASSES = 'block text-label font-medium text-primary';

const PROJECT_STATUS_OPTIONS = [
  { value: 'new', label: 'New project' },
  { value: 'existing', label: 'Existing project' },
] as const;

/** Step 2 — Project information. */
export function QuotationStepProject({ form }: QuotationStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="projectType" className={LABEL_CLASSES}>
          Project type{REQUIRED_MARK}
        </label>
        <Select
          id="projectType"
          invalid={Boolean(errors.projectType)}
          aria-required="true"
          aria-describedby="projectType-error"
          className="mt-2"
          placeholder="Choose a project type"
          options={PROJECT_TYPE_OPTIONS}
          {...register('projectType')}
        />
        <FieldError id="projectType-error" message={errors.projectType?.message} />
      </div>

      <fieldset>
        <legend className={LABEL_CLASSES}>
          Required services{REQUIRED_MARK}
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REQUIRED_SERVICE_OPTIONS.map((service) => (
            <label
              key={service.value}
              className={cn(
                'flex min-h-11 items-start gap-2.5 rounded-field border px-3.5 py-2.5 text-body text-primary has-[:checked]:border-primary-blue has-[:checked]:bg-surface-hover',
                errors.requiredServices ? 'border-error' : 'border-strong',
              )}
            >
              <input
                type="checkbox"
                value={service.value}
                aria-describedby="requiredServices-error"
                className="mt-0.5 size-5 shrink-0 rounded border-strong bg-surface accent-primary-blue focus-ring"
                {...register('requiredServices')}
              />
              {service.label}
            </label>
          ))}
        </div>
        <FieldError id="requiredServices-error" message={errors.requiredServices?.message} />
      </fieldset>

      <div>
        <label htmlFor="businessObjectives" className={LABEL_CLASSES}>
          Business objectives{REQUIRED_MARK}
        </label>
        <Textarea
          id="businessObjectives"
          rows={4}
          placeholder="What should this project achieve for your business?"
          invalid={Boolean(errors.businessObjectives)}
          aria-required="true"
          aria-describedby="businessObjectives-error"
          className="mt-2"
          {...register('businessObjectives')}
        />
        <FieldError id="businessObjectives-error" message={errors.businessObjectives?.message} />
      </div>

      <div>
        <label htmlFor="targetUsers" className={LABEL_CLASSES}>
          Target users{REQUIRED_MARK}
        </label>
        <Textarea
          id="targetUsers"
          rows={3}
          placeholder="Who will use this? e.g. customers, internal staff, job seekers"
          invalid={Boolean(errors.targetUsers)}
          aria-required="true"
          aria-describedby="targetUsers-error"
          className="mt-2"
          {...register('targetUsers')}
        />
        <FieldError id="targetUsers-error" message={errors.targetUsers?.message} />
      </div>

      <fieldset>
        <legend className={LABEL_CLASSES}>
          Is this a new or existing project?{REQUIRED_MARK}
        </legend>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
          {PROJECT_STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="flex min-h-11 items-center gap-2 text-body text-primary">
              <input
                type="radio"
                value={option.value}
                aria-describedby="projectStatus-error"
                className="size-4 accent-primary-blue focus-ring"
                {...register('projectStatus')}
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError id="projectStatus-error" message={errors.projectStatus?.message} />
      </fieldset>
    </div>
  );
}
