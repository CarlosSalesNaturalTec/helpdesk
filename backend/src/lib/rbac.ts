import { JwtPayload } from './jwt.js';

/**
 * Retorna true se o usuário tem permissão para interagir com a unidade alvo.
 * Admin tem acesso global. Diretor, Gestor e Técnico têm acesso apenas à sua própria unidade.
 */
export function unitFilter(user: JwtPayload, targetUnidadeId: number): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }
  return user.unidadeId === targetUnidadeId;
}

/**
 * Retorna true se o usuário tem permissão para interagir com o Tipo de Ocorrência (setor) alvo.
 * Apenas Técnico e Gestor são escopados por setor; os demais papéis não restringem por área.
 */
export function sectorFilter(user: JwtPayload, targetSectorId: number): boolean {
  if (user.role !== 'TECNICO' && user.role !== 'GESTOR') {
    return true;
  }
  return user.sectorId === targetSectorId;
}

/**
 * Deriva a cláusula de escopo (Unidade e Tipo de Ocorrência) a partir do papel do usuário,
 * para uso em consultas de listagem e métricas agregadas. Solicitante não é coberto aqui —
 * seu escopo (`solicitanteId`) é aplicado separadamente por cada módulo.
 */
export function scopeWhere(user: JwtPayload): { unidadeId?: number; sectorId?: number } {
  if (user.role === 'ADMIN' || user.role === 'SOLICITANTE') {
    return {};
  }
  if (user.role === 'DIRETOR') {
    return { unidadeId: user.unidadeId };
  }
  // TECNICO / GESTOR
  return { unidadeId: user.unidadeId, sectorId: user.sectorId ?? undefined };
}
