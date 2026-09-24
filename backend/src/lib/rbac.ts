import { JwtPayload } from './jwt.js';
import { MANAGEABLE_ROLES, canManageRole, type RoleType } from '@helpdesk/shared';

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

/**
 * Alvo de uma operação de gestão de usuários: o estado atual do usuário alvo,
 * ou o estado proposto por um payload de criação/edição.
 */
export interface ManageableTarget {
  role: string;
  unidadeId: number;
  sectorId?: number | null;
}

/**
 * Retorna true se `user` pode gerenciar (listar, criar, editar ou desativar)
 * um usuário no estado descrito por `target`.
 *
 * Combina três regras, nesta ordem:
 *  1. o papel do alvo precisa constar em MANAGEABLE_ROLES[user.role];
 *  2. a Unidade do alvo precisa passar por unitFilter();
 *  3. para o Gestor com alvo TECNICO, a área do alvo precisa ser a sua.
 *
 * A mesma função avalia o alvo atual (existe e está no escopo?) e o alvo
 * proposto (estado final da edição), de modo que promoções e mudanças de área
 * caem na mesma regra, sem casos especiais por rota.
 */
export function canManageUser(user: JwtPayload, target: ManageableTarget): boolean {
  if (!canManageRole(user.role, target.role)) {
    return false;
  }
  if (!unitFilter(user, target.unidadeId)) {
    return false;
  }
  // O Gestor é escopado por área ao gerenciar Técnicos. Solicitantes não têm
  // área, então para eles basta a Unidade.
  if (user.role === 'GESTOR' && target.role === 'TECNICO') {
    return user.sectorId != null && user.sectorId === target.sectorId;
  }
  return true;
}

/**
 * Cláusula Prisma equivalente a canManageUser() para a listagem de usuários,
 * derivada da mesma matriz. Admin não restringe nada; Diretor restringe por
 * Unidade e papel; Gestor restringe por Unidade, papel e — para Técnicos —
 * também por área.
 *
 * Papéis sem nenhum alvo gerenciável recebem uma cláusula impossível, para que
 * a listagem volte vazia em vez de irrestrita.
 */
export function manageableUsersWhere(user: JwtPayload): Record<string, unknown> {
  const roles = MANAGEABLE_ROLES[user.role as RoleType] ?? [];
  if (roles.length === 0) {
    return { id: -1 };
  }

  if (user.role === 'ADMIN') {
    return { role: { in: roles } };
  }

  if (user.role === 'GESTOR') {
    // unidade + (SOLICITANTE | TECNICO da própria área)
    return {
      unidadeId: user.unidadeId,
      OR: [
        { role: 'SOLICITANTE' as const },
        { role: 'TECNICO' as const, sectorId: user.sectorId ?? -1 },
      ],
    };
  }

  // DIRETOR
  return { unidadeId: user.unidadeId, role: { in: roles } };
}
