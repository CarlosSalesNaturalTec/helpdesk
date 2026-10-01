/**
 * Normalização e vocabulário da Razão da Pendência.
 *
 * Irmão de `lib/local.ts`, não um genérico parametrizado: as duas normalizações são
 * análogas, não idênticas — `resolveLocal()` resolve por `unidadeId` e participa da
 * composição do título do chamado, enquanto a razão resolve por `sectorId` ("Tipo de
 * Ocorrência") e não compõe nada.
 *
 * A diferença que importa é a fonte do vocabulário. `Ticket.local` nunca é apagado, então
 * a coluna basta como lista de sugestões. `Ticket.pendenciaMotivo` é zerada na retomada
 * (ela responde "por que está parado agora"), de modo que a coluna esqueceria a grafia
 * assim que o chamado voltasse a andar — e a próxima pendência acumularia uma variação
 * quase idêntica. O vocabulário vem, portanto, da trilha durável: os eventos
 * `MUDANCA_STATUS` com destino `AGUARDANDO` no `TicketHistory`.
 */

import { prisma } from './prisma.js';

/**
 * Apara as extremidades e colapsa espaços internos repetidos, de modo que
 * "Aguardando   material " e "Aguardando material" sejam a mesma razão.
 */
export function normalizePendenciaMotivo(valor: string): string {
  return valor.replace(/\s+/g, ' ').trim();
}

/**
 * Razões já registradas no escopo informado, sem repetição e em ordem alfabética.
 *
 * `scope` é a mesma cláusula derivada do papel que a listagem de chamados aplica
 * (`scopeWhere()`), acrescida do `sectorId` opcional do Admin — o join até `Ticket`
 * existe justamente para que o isolamento entre Unidades continue valendo aqui.
 */
export async function listPendenciaMotivos(scope: {
  unidadeId?: number;
  sectorId?: number;
}): Promise<string[]> {
  const rows = await prisma.ticketHistory.findMany({
    where: {
      type: 'MUDANCA_STATUS',
      ticket: scope,
    },
    select: { content: true },
    orderBy: { criadoEm: 'asc' },
  });

  // O destino da transição e a razão vivem no JSON do evento, que o Prisma não filtra
  // por caminho de forma portável — a seleção fina fica aqui, sobre um conjunto já
  // reduzido pelo escopo.
  const vistas = new Map<string, string>();
  for (const row of rows) {
    const content = row.content as { to?: unknown; mensagem?: unknown } | null;
    if (!content || content.to !== 'AGUARDANDO' || typeof content.mensagem !== 'string') {
      continue;
    }
    const razao = normalizePendenciaMotivo(content.mensagem);
    if (razao === '') continue;
    // Primeira grafia vista ganha, para que a lista não ofereça duas variações da
    // mesma razão; a ordem `criadoEm: 'asc'` faz dessa a mais antiga.
    const chave = razao.toLowerCase();
    if (!vistas.has(chave)) {
      vistas.set(chave, razao);
    }
  }

  return [...vistas.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Resolve a razão a gravar: se o Tipo de Ocorrência já registrou uma razão que case sem
 * diferenciar maiúsculas de minúsculas, devolve a grafia já existente; senão, devolve o
 * valor normalizado.
 *
 * É o que impede que "Aguardando material", "aguardando material" e "Aguardando  material"
 * virem três sugestões distintas no `<datalist>` do modal de pendência.
 */
export async function resolvePendenciaMotivo(valor: string, sectorId: number): Promise<string> {
  const normalizado = normalizePendenciaMotivo(valor);
  if (normalizado === '') {
    return normalizado;
  }

  const registradas = await listPendenciaMotivos({ sectorId });
  const existente = registradas.find(
    (r) => r.toLowerCase() === normalizado.toLowerCase()
  );

  return existente ?? normalizado;
}
