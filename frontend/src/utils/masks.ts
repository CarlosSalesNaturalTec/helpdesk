/**
 * Máscaras de entrada aplicadas somente na interface — o contrato da API não
 * muda (design D1 da change usuarios-mascaras-reativar-excluir):
 * o CPF trafega formatado (`000.000.000-00`, o formato do schema compartilhado)
 * e o telefone trafega apenas com dígitos.
 *
 * As funções são puras e idempotentes: aplicá-las sobre um valor já formatado
 * devolve o mesmo valor, então colar `(71) 99965-5578` e digitar `71999655578`
 * produzem o mesmo resultado.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata progressivamente como `529`, `529.9`, `529.982.2`, `529.982.247-25`. */
export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Formata `(71) 3333-4444` (fixo, 10 dígitos) ou `(71) 99965-5578` (celular,
 * 11 dígitos). Durante a digitação o formato de fixo vale até o 10º dígito e o
 * 11º move o hífen uma casa para a direita.
 */
export function maskTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const corte = d.length <= 10 ? 6 : 7;
  if (d.length <= corte) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}
