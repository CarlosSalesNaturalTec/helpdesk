import { z } from 'zod';

export const RoleEnum = z.enum(['SOLICITANTE', 'TECNICO', 'GESTOR', 'DIRETOR', 'ADMIN']);

export const userSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
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
