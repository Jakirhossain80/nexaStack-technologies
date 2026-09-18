import { cn } from '@/lib/cn';

export interface QuotationProgressProps {
  steps: readonly string[];
  currentStep: number;
}

const CheckIcon = (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
  >
    <path d="M5 10.5l3 3 7-7" />
  </svg>
);

/**
 * "Step X of 5" progress indicator (root CLAUDE.md brief 5). Desktop/tablet render the full
 * multi-node stepper; mobile falls back to condensed text plus a slim bar (a wide multi-node
 * stepper wouldn't fit at 375px). `aria-current="step"` marks the active node for assistive
 * technology beyond the visual styling.
 */
export function QuotationProgress({ steps, currentStep }: QuotationProgressProps) {
  const percent = Math.round((currentStep / steps.length) * 100);
  const lineProgress = steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 100;

  return (
    <nav aria-label="Quotation progress" className="mb-8">
      <div className="sm:hidden">
        <p className="text-label font-medium text-secondary">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1]}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background-alt">
          <div
            className="h-full rounded-full bg-primary-blue transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="relative hidden sm:flex sm:justify-between">
        <div aria-hidden="true" className="absolute left-4 right-4 top-4 h-px bg-default" />
        <div
          aria-hidden="true"
          className="absolute left-4 top-4 h-px bg-primary-blue transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `calc(${lineProgress}% - 2rem)` }}
        />
        {steps.map((name, index) => {
          const stepNumber = index + 1;
          const state =
            stepNumber < currentStep ? 'complete' : stepNumber === currentStep ? 'current' : 'upcoming';
          return (
            <li key={name} className="relative flex flex-1 flex-col items-center gap-2 text-center">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-label font-semibold',
                  state === 'upcoming' && 'border-strong bg-surface text-secondary',
                  state === 'current' && 'border-primary-blue bg-primary-blue text-on-primary',
                  state === 'complete' && 'border-primary-blue bg-surface text-primary-blue',
                )}
              >
                {state === 'complete' ? CheckIcon : stepNumber}
              </span>
              <span
                className={cn(
                  'max-w-24 text-label',
                  state === 'current' ? 'font-medium text-primary' : 'text-secondary',
                )}
              >
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
