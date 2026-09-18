// Public API of @nexastack/shared. Export explicitly; never `export *`.

// Schemas
export { contactFormSchema, contactSchema } from './schemas/contact.js';
export {
  ATTACHMENT_ACCEPTED_EXTENSIONS,
  ATTACHMENT_ACCEPTED_TYPES,
  ATTACHMENT_MAX_FILES,
  ATTACHMENT_MAX_SIZE_BYTES,
  BUDGET_RANGE_OPTIONS,
  DESIGN_REQUIREMENTS_OPTIONS,
  MAINTENANCE_OPTIONS,
  NUMBER_OF_PAGES_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  REQUIRED_SERVICE_OPTIONS,
  quotationSchema,
  quotationStep1Schema,
  quotationStep2Schema,
  quotationStep3Schema,
  quotationStep4Schema,
} from './schemas/quotation.js';

// Types
export type {
  ContactFormValues,
  ContactInput,
  ContactPageFormValues,
  ContactPageInput,
} from './types/contact.js';
export type {
  QuotationFormValues,
  QuotationInput,
  QuotationStep1Input,
  QuotationStep2Input,
  QuotationStep3Input,
  QuotationStep4Input,
} from './types/quotation.js';
export type {
  ApiErrorBody,
  ApiFailure,
  ApiResponse,
  ApiSuccess,
  ValidationIssue,
} from './types/api.js';

// Constants
export { ROLES, roleSchema, type Role } from './constants/roles.js';
export {
  CONTENT_STATUS,
  CONTENT_STATUSES,
  contentStatusSchema,
  type ContentStatus,
} from './constants/contentStatus.js';
export { ERROR_CODES, type ErrorCode } from './constants/errorCodes.js';
export { COUNTRIES } from './constants/countries.js';
