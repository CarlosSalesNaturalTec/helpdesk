import { z } from 'zod';

export const sectorSchema = z.object({
  nome: z.string().min(2, 'O nome do setor deve ter pelo menos 2 caracteres'),
  ativo: z.boolean().optional(),
});
