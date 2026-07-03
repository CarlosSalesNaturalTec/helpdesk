/**
 * Constantes e funções de validação de anexos de chamados.
 */

/** Tipos MIME permitidos para upload */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/** Rótulos amigáveis dos tipos permitidos */
export const ALLOWED_TYPES_LABEL = 'JPG, PNG, PDF, DOCX';

/** Tamanho máximo em bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface AttachmentMetadata {
  nome: string;
  tipo: string;
  tamanho: number;
}

export interface AttachmentValidationError {
  error: string;
}

export type AttachmentValidationResult =
  | { valid: true; metadata: AttachmentMetadata }
  | { valid: false; error: string };

/**
 * Valida um arquivo de anexo quanto ao tipo MIME e tamanho.
 * @param nome Nome original do arquivo
 * @param tipo MIME type do arquivo
 * @param tamanho Tamanho em bytes
 * @returns Objeto com `valid: true` e metadados, ou `valid: false` e mensagem de erro
 */
export function validateAttachment(
  nome: string,
  tipo: string,
  tamanho: number
): AttachmentValidationResult {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(tipo)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_TYPES_LABEL}`,
    };
  }

  if (tamanho > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'O arquivo excede o tamanho máximo de 5 MB',
    };
  }

  return {
    valid: true,
    metadata: { nome, tipo, tamanho },
  };
}
