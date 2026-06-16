import { z } from 'zod';
import { loginSchema, changePasswordSchema } from './schemas/auth.js';
import { userSchema, RoleEnum } from './schemas/user.js';
import { unidadeSchema } from './schemas/unidade.js';

// Re-exporting schemas
export { loginSchema, changePasswordSchema, userSchema, RoleEnum, unidadeSchema };

// Inferring TypeScript types
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UnidadeInput = z.infer<typeof unidadeSchema>;
export type RoleType = z.infer<typeof RoleEnum>;
