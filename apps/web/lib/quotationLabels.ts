import {
  BUDGET_RANGE_OPTIONS,
  DESIGN_REQUIREMENTS_OPTIONS,
  MAINTENANCE_OPTIONS,
  NUMBER_OF_PAGES_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  REQUIRED_SERVICE_OPTIONS,
} from '@nexastack/shared';

/**
 * Display labels for the values stored on a quotation request. The database holds the option
 * VALUE ("web-application"); the admin sees the same LABEL the client chose in the wizard. Both
 * come from the `*_OPTIONS` in `@nexastack/shared`, the single source the wizard also reads, so a
 * renamed option changes everywhere at once. An unrecognised stored value is shown as stored
 * rather than hidden.
 */

type Options = readonly { value: string; label: string }[];

export function labelFor(options: Options, value: string | undefined): string {
  if (!value) return '';
  return options.find((option) => option.value === value)?.label ?? value;
}

export const projectTypeLabel = (value: string): string => labelFor(PROJECT_TYPE_OPTIONS, value);
export const serviceLabel = (value: string): string => labelFor(REQUIRED_SERVICE_OPTIONS, value);
export const numberOfPagesLabel = (value: string): string => labelFor(NUMBER_OF_PAGES_OPTIONS, value);
export const designRequirementsLabel = (value: string): string =>
  labelFor(DESIGN_REQUIREMENTS_OPTIONS, value);
export const budgetRangeLabel = (value: string): string => labelFor(BUDGET_RANGE_OPTIONS, value);
export const maintenanceLabel = (value: string): string => labelFor(MAINTENANCE_OPTIONS, value);

export function projectStatusLabel(value: string): string {
  if (value === 'existing') return 'Existing project';
  if (value === 'new') return 'New project';
  return value;
}

/** `1.2 MB`, `340 KB`, `12 B`. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
