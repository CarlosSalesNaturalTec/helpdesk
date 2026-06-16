import { z } from 'zod';

export const unidadeSchema = z.object({
  nome: z
    .string()
    .min(2, 'O nome da unidade deve ter no mínimo 2 caracteres')
    .max(60, 'O nome da unidade deve ter no máximo 60 caracteres'),
});
