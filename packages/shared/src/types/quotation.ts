import type { z } from 'zod';

import type {
  quotationSchema,
  quotationStep1Schema,
  quotationStep2Schema,
  quotationStep3Schema,
  quotationStep4Schema,
} from '../schemas/quotation.js';

/** `/quotation` full request as entered (before trimming). */
export type QuotationFormValues = z.input<typeof quotationSchema>;

/** `/quotation` full request after validation — the shape persisted to MongoDB. */
export type QuotationInput = z.infer<typeof quotationSchema>;

export type QuotationStep1Input = z.infer<typeof quotationStep1Schema>;
export type QuotationStep2Input = z.infer<typeof quotationStep2Schema>;
export type QuotationStep3Input = z.infer<typeof quotationStep3Schema>;
export type QuotationStep4Input = z.infer<typeof quotationStep4Schema>;
