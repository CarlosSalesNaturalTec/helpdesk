import { z } from 'zod';

export const problemTypeSchema = z.object({
  nome: z.string().min(2, 'O nome do tipo de problema deve ter pelo menos 2 caracteres'),
  slaMinutes: z.number().int().min(0, 'O SLA deve ser maior ou igual a 0'),
  sectorId: z.number().int().positive('Setor inválido'),
  ativo: z.boolean().optional(),
});
