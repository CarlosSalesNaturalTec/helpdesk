import { z } from 'zod';

export const RoleEnum = z.enum(['SOLICITANTE', 'TECNICO', 'GESTOR', 'DIRETOR', 'ADMIN']);

// CPF: validação apenas de formato, sem conferência de dígitos verificadores —
// decisão registrada na change usuario-cpf-telefone.
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
// Telefone: somente dígitos, com DDD. 10 dígitos cobre fixo, 11 cobre celular.
const TELEFONE_REGEX = /^\d{10,11}$/;

export const userSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().regex(CPF_REGEX, 'CPF deve estar no formato 000.000.000-00'),
  telefone: z
    .string()
    .regex(TELEFONE_REGEX, 'Telefone deve conter apenas dígitos, com DDD (10 ou 11 dígitos)'),
  email: z.string().email('E-mail inválido'),
  role: RoleEnum,
  unidadeId: z.number().int().positive('Unidade inválida'),
  sectorId: z.number().int().positive('Setor inválido').optional().nullable(),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'TECNICO' && !data.sectorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Setor é obrigatório para técnicos',
      path: ['sectorId'],
    });
  }
  if (data.role === 'GESTOR' && !data.sectorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tipo de Ocorrência é obrigatório para gestores',
      path: ['sectorId'],
    });
  }
});
