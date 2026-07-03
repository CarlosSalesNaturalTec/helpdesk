import { Storage } from '@google-cloud/storage';

// Inicializa o client usando Application Default Credentials (ADC)
// Em Cloud Run, as credenciais do service account são providas automaticamente pelo ambiente.
const storage = new Storage();

/**
 * Faz upload de um buffer para o GCS e torna o objeto público.
 * @param bucketName Nome do bucket GCS
 * @param filePath Caminho dentro do bucket (ex: tickets/42/{uuid}-relatorio.pdf)
 * @param buffer Conteúdo do arquivo como Buffer
 * @param mimeType MIME type do arquivo
 * @returns URL pública do arquivo
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(buffer, {
    contentType: mimeType,
    resumable: false,
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

/**
 * Deleta um arquivo do GCS.
 * @param bucketName Nome do bucket GCS
 * @param filePath Caminho do arquivo dentro do bucket
 */
export async function deleteFile(bucketName: string, filePath: string): Promise<void> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  try {
    await file.delete();
  } catch (err: any) {
    // Se o arquivo não existir, ignorar (404)
    if (err?.code !== 404) {
      throw err;
    }
  }
}

/**
 * Extrai o path relativo do bucket a partir de uma URL pública do GCS.
 * Ex: https://storage.googleapis.com/bucket/tickets/42/uuid-file.pdf -> tickets/42/uuid-file.pdf
 */
export function extractGcsPath(publicUrl: string, bucketName: string): string {
  const prefix = `https://storage.googleapis.com/${bucketName}/`;
  return publicUrl.startsWith(prefix) ? publicUrl.slice(prefix.length) : publicUrl;
}
