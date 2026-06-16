import { JwtPayload } from './jwt.js';

/**
 * Retorna true se o usuário tem permissão para interagir com a unidade alvo.
 * Admin tem acesso global. Diretor, Gestor de TI e Técnico têm acesso apenas à sua própria unidade.
 */
export function unitFilter(user: JwtPayload, targetUnidadeId: number): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }
  return user.unidadeId === targetUnidadeId;
}
