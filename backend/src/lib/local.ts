/**
 * Normalização do local do chamado e composição do título derivado.
 *
 * O Solicitante não escreve mais o título: ele é composto pelo servidor como
 * `Tipo de Problema — Local`. Esta é a única fórmula da composição — os dois
 * caminhos de criação de chamado (com e sem anexo) chamam daqui.
 */

import { prisma } from './prisma.js';

/** Teto da coluna `Ticket.titulo` no banco. */
export const MAX_TITULO_LENGTH = 100;

/** Separador entre o Tipo de Problema e o local no título composto. */
const TITULO_SEPARATOR = ' — ';

/** Marca de corte aplicada quando a composição não cabe no teto. */
const TRUNCATION_MARK = '…';

/**
 * Apara as extremidades e colapsa espaços internos repetidos, de modo que
 * "  Sala   de Medicação  " e "Sala de Medicação" sejam o mesmo local.
 */
export function normalizeLocal(valor: string): string {
  return valor.replace(/\s+/g, ' ').trim();
}

/**
 * Resolve o local a gravar: se a Unidade já registrou um local que case sem
 * diferenciar maiúsculas de minúsculas, devolve a grafia já existente; senão,
 * devolve o valor normalizado.
 *
 * Isso impede que "Recepção", "recepção" e "Recepção " virem três sugestões
 * distintas no `<datalist>` do formulário de abertura.
 */
export async function resolveLocal(valor: string, unidadeId: number): Promise<string> {
  const normalizado = normalizeLocal(valor);
  if (normalizado === '') {
    return normalizado;
  }

  const existente = await prisma.ticket.findFirst({
    where: {
      unidadeId,
      local: { equals: normalizado, mode: 'insensitive' },
    },
    select: { local: true },
    orderBy: { criadoEm: 'asc' },
  });

  return existente?.local ?? normalizado;
}

/**
 * Compõe o título do chamado como `Tipo de Problema — Local`, respeitando o
 * teto de 100 caracteres da coluna.
 *
 * Quando a composição estoura, o nome do Tipo de Problema é preservado por
 * inteiro e o local é encurtado com marca de corte: o tipo é vocabulário
 * controlado (curto e previsível) e o local é texto livre. Se o tipo sozinho
 * já estourar — nem `ProblemType.nome` nem `Sector.nome` têm teto no schema —
 * o conjunto é truncado, também com marca de corte.
 */
export function buildTicketTitulo(problemTypeNome: string, local: string): string {
  const tipo = normalizeLocal(problemTypeNome);
  const localNormalizado = normalizeLocal(local);
  const base = `${tipo}${TITULO_SEPARATOR}${localNormalizado}`;

  if (base.length <= MAX_TITULO_LENGTH) {
    return base;
  }

  // Espaço que sobra para o local depois do tipo, do separador e da marca de corte.
  const espacoParaLocal =
    MAX_TITULO_LENGTH - tipo.length - TITULO_SEPARATOR.length - TRUNCATION_MARK.length;

  if (espacoParaLocal >= 1) {
    return `${tipo}${TITULO_SEPARATOR}${localNormalizado.slice(0, espacoParaLocal)}${TRUNCATION_MARK}`;
  }

  // O tipo sozinho (ou com o separador) já não cabe: trunca o conjunto.
  return `${base.slice(0, MAX_TITULO_LENGTH - TRUNCATION_MARK.length)}${TRUNCATION_MARK}`;
}
