import { z } from 'zod';

export const TicketStatusEnum = z.enum([
  'ABERTO',
  'EM_ANDAMENTO',
  'AGUARDANDO',
  'RESOLVIDO',
  'FECHADO',
  'REABERTO',
]);

/**
 * Todos os status exceto FECHADO, derivados do enum — usado pelo card "Críticos" do Dashboard,
 * que conta `status <> 'FECHADO'`. Nunca escrever essa lista à mão: um status novo no workflow
 * precisa entrar aqui automaticamente.
 */
export const STATUS_NAO_FECHADOS = TicketStatusEnum.options.filter((s) => s !== 'FECHADO');

export const NivelUrgenciaEnum = z.enum([
  'BAIXA',
  'MEDIA',
  'ALTA',
  'CRITICA',
]);

/**
 * Tipos de evento da linha do tempo do chamado. Precisa ficar em paridade com o enum
 * `HistoryType` do Prisma e com o `switch` de apresentação do frontend — um valor novo
 * que entre só de um lado aparece sem rótulo na linha do tempo.
 *
 * `EDICAO` é genérico de propósito (campo + valor anterior + valor novo): a edição de
 * outro campo, no futuro, não precisa de mais um valor de enum.
 */
export const HistoryTypeEnum = z.enum([
  'ABERTURA',
  'MENSAGEM',
  'MUDANCA_STATUS',
  'ATRIBUICAO',
  'REATRIBUICAO',
  'FECHAMENTO',
  'REABERTURA',
  'EDICAO',
]);

/**
 * O título não é informado pelo cliente: o servidor o deriva do Tipo de Problema e do
 * local no momento da criação. O `local` chega aqui já aparado — a normalização
 * completa (colapso de espaços e reaproveitamento da grafia existente na Unidade)
 * roda no servidor, em `backend/src/lib/local.ts`.
 */
export const createTicketSchema = z.object({
  local: z
    .string()
    .trim()
    .min(2, 'O local deve ter no mínimo 2 caracteres')
    .max(60, 'O local deve ter no máximo 60 caracteres'),
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

/**
 * Aceita um ou mais status na query string, como lista separada por vírgula
 * (`?status=ABERTO,REABERTO`) ou parâmetro repetido. Valor único segue válido;
 * vazio equivale a ausente; qualquer item fora do enum reprova a validação (400).
 */
const statusListSchema = z.preprocess((value) => {
  const raw = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const items = raw.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean);
  return items.length > 0 ? items : undefined;
}, z.array(TicketStatusEnum).optional());

export const ticketQuerySchema = z.object({
  search: z.string().optional(),
  status: statusListSchema,
  urgencia: NivelUrgenciaEnum.optional(),
  unidadeId: z.coerce.number().int().positive().optional(),
  sectorId: z.coerce.number().int().positive().optional(),
  problemTypeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

/**
 * Correção da localidade de um chamado já aberto. As regras do campo são as mesmas
 * da abertura (`createTicketSchema.local`) — o local é o mesmo campo, corrigido depois.
 */
export const updateTicketLocalSchema = z.object({
  local: createTicketSchema.shape.local,
});
