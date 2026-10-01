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

/**
 * Rótulos legíveis dos status, em português. Fonte única consumida pelas etiquetas da
 * listagem, dos cartões e dos detalhes, pela linha do tempo, pelo filtro de status e pelo
 * relatório em PDF — nenhuma dessas superfícies deve imprimir o valor cru do enum.
 *
 * `AGUARDANDO` é apresentado como "Pendente": a renomeação é da camada de texto, como em
 * `Sector` → "Tipo de Ocorrência". O identificador do enum não muda.
 *
 * Sendo um `Record<TicketStatusType, string>`, um status novo sem rótulo aqui quebra o
 * build em vez de aparecer em maiúsculas na tela.
 */
export const STATUS_LABELS: Record<z.infer<typeof TicketStatusEnum>, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Pendente',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  REABERTO: 'Reaberto',
};

/**
 * Classe CSS da etiqueta de cada status. Mesma duplicação que os rótulos tinham: as três
 * funções `getStatusBadgeClass` do frontend liam daqui.
 *
 * `badge-aguardando` é identificador de código (classe CSS) e permanece como está — só o
 * rótulo foi renomeado para "Pendente".
 */
export const STATUS_BADGE_CLASSES: Record<z.infer<typeof TicketStatusEnum>, string> = {
  ABERTO: 'badge-aberto',
  EM_ANDAMENTO: 'badge-andamento',
  AGUARDANDO: 'badge-aguardando',
  RESOLVIDO: 'badge-resolvido',
  FECHADO: 'badge-fechado',
  REABERTO: 'badge-reaberto',
};

/**
 * Rótulo de um status que chega como texto solto — o caso da linha do tempo, cujo
 * `TicketHistory.content` é JSON e portanto não é tipado pelo enum. Um valor fora do
 * enum devolve a si mesmo, para que a tela nunca fique em branco.
 */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status as z.infer<typeof TicketStatusEnum>] ?? status;
}

/** Contraparte de `statusLabel` para a classe da etiqueta. */
export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status as z.infer<typeof TicketStatusEnum>] ?? 'badge-secondary';
}

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

/** Tetos da Razão da Pendência, compartilhados com o campo da interface. */
export const MIN_PENDENCIA_MOTIVO_LENGTH = 2;
export const MAX_PENDENCIA_MOTIVO_LENGTH = 100;

/**
 * Transição de status. Ao entrar em pendência (`AGUARDANDO`), `mensagem` carrega a Razão da
 * Pendência — texto curto escolhido da lista de razões já registradas no Tipo de Ocorrência
 * ou digitado livremente. O campo chega aqui apenas aparado: a normalização completa
 * (colapso de espaços e reaproveitamento da grafia existente no Sector) roda no servidor,
 * em `backend/src/lib/pendencia.ts`.
 */
export const ticketStatusSchema = z
  .object({
    status: TicketStatusEnum,
    mensagem: z.string().optional(),
    solucao: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'AGUARDANDO') {
      const razao = data.mensagem?.trim() ?? '';
      if (razao.length < MIN_PENDENCIA_MOTIVO_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A Razão da Pendência é obrigatória e deve ter no mínimo ${MIN_PENDENCIA_MOTIVO_LENGTH} caracteres`,
          path: ['mensagem'],
        });
      } else if (razao.length > MAX_PENDENCIA_MOTIVO_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A Razão da Pendência deve ter no máximo ${MAX_PENDENCIA_MOTIVO_LENGTH} caracteres`,
          path: ['mensagem'],
        });
      }
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
