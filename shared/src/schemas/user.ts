import { z } from 'zod';

export const RoleEnum = z.enum(['SOLICITANTE', 'TECNICO', 'GESTOR_TI', 'DIRETOR', 'ADMIN']);

export const userSchema = z.object({
  nome: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: RoleEnum,
  unidadeId: z.number().int().positive('Unidade inválida'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional(),
});
