// `appName` usa `||` e `clientName` usa `??` de propósito: um nome de aplicação
// vazio não identificaria coisa alguma, então a string vazia cai no padrão. Já
// um `CLIENT_NAME` vazio é configuração deliberada — "esta instância não exibe
// nome de cliente" — e não pode ser confundido com a variável ausente.
export const appName = process.env.APP_NAME || 'SOLUTUS';
export const clientName = process.env.CLIENT_NAME ?? 'Instituto Setes';
export const fullName = clientName ? `${appName} — ${clientName}` : appName;

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');

export function brandingSlug(): string {
  return fullName
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
