import { z } from 'zod';
import { loginSchema, changePasswordSchema } from './schemas/auth.js';
import { userSchema, RoleEnum } from './schemas/user.js';
import { unidadeSchema } from './schemas/unidade.js';
import { sectorSchema } from './schemas/sector.js';
import { problemTypeSchema } from './schemas/problem-type.js';
import {
  createTicketSchema,
  ticketStatusSchema,
  assignTicketSchema,
  satisfactionSchema,
  ticketQuerySchema,
  TicketStatusEnum,
  NivelUrgenciaEnum,
} from './schemas/ticket.js';

// Re-exporting schemas
export {
  loginSchema,
  changePasswordSchema,
  userSchema,
  RoleEnum,
  unidadeSchema,
  sectorSchema,
  problemTypeSchema,
  createTicketSchema,
  ticketStatusSchema,
  assignTicketSchema,
  satisfactionSchema,
  ticketQuerySchema,
  TicketStatusEnum,
  NivelUrgenciaEnum,
};

// Inferring TypeScript types
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UnidadeInput = z.infer<typeof unidadeSchema>;
export type SectorInput = z.infer<typeof sectorSchema>;
export type ProblemTypeInput = z.infer<typeof problemTypeSchema>;
export type RoleType = z.infer<typeof RoleEnum>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketStatusInput = z.infer<typeof ticketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type SatisfactionInput = z.infer<typeof satisfactionSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;
export type TicketStatusType = z.infer<typeof TicketStatusEnum>;
export type NivelUrgenciaType = z.infer<typeof NivelUrgenciaEnum>;
