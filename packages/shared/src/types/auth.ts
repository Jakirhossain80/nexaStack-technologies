import type { z } from 'zod';

import type { loginSchema, passwordResetConfirmSchema, passwordResetRequestSchema } from '../schemas/auth.js';

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
