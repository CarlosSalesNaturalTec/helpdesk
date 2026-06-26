import { z } from 'zod';

export const TicketStatusEnum = z.enum([
  'ABERTO',
  'EM_ANDAMENTO',
  'AGUARDANDO',
  'RESOLVIDO',
  'FECHADO',
  'REABERTO',
]);



export const NivelUrgenciaEnum = z.enum([
  'BAIXA',
  'MEDIA',
  'ALTA',
  'CRITICA',
]);

export const createTicketSchema = z.object({
  titulo: z
    .string()
    .min(5, 'O título deve ter no mínimo 5 caracteres')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  descricao: z
    .string()
    .min(10, 'A descrição deve ter no mínimo 10 caracteres')
    .max(2000, 'A descrição deve ter no máximo 2000 caracteres'),
  sectorId: z.number().int().positive('Setor inválido'),
  problemTypeId: z.number().int().positive('Tipo de problema inválido'),
  urgencia: NivelUrgenciaEnum,
});

export const ticketStatusSchema = z
  .object({
    status: TicketStatusEnum,
    mensagem: z.string().optional(),
    solucao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'AGUARDANDO' && (!data.mensagem || data.mensagem.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A mensagem explicativa é obrigatória para colocar o chamado em aguardo',
        path: ['mensagem'],
      });
    }
    if (data.status === 'RESOLVIDO' && (!data.solucao || data.solucao.trim().length < 10)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A solução é obrigatória e deve ter pelo menos 10 caracteres para resolver o chamado',
        path: ['solucao'],
      });
    }
  });

export const assignTicketSchema = z.object({
  tecnicoId: z.number().int().positive().optional(),
});

export const satisfactionSchema = z.object({
  nota: z
    .number()
    .int()
    .min(1, 'A nota deve ser entre 1 e 5')
    .max(5, 'A nota deve ser entre 1 e 5'),
});

export const ticketQuerySchema = z.object({
  search: z.string().optional(),
  status: TicketStatusEnum.optional(),
  sectorId: z.coerce.number().int().positive().optional(),
  problemTypeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});
