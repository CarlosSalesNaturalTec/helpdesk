import type { z } from 'zod';
import type { RoleEnum } from './schemas/user.js';

type Role = z.infer<typeof RoleEnum>;

/**
 * Matriz "quem gerencia quem" na gestão de usuários.
 *
 * Fonte única compartilhada front↔back, no mesmo espírito dos schemas Zod:
 * o backend valida o payload contra ela e o frontend monta o seletor de papel
 * a partir dela, sem duplicar a regra.
 *
 * A matriz cobre apenas o papel do alvo. As restrições de Unidade e de Tipo de
 * Ocorrência são aplicadas separadamente (ver `canManageUser` em
 * `backend/src/lib/rbac.ts`): o Diretor gerencia apenas a própria Unidade e o
 * Gestor, além da própria Unidade, apenas Técnicos da própria área.
 */
export const MANAGEABLE_ROLES: Record<Role, Role[]> = {
  ADMIN: ['SOLICITANTE', 'TECNICO', 'GESTOR', 'DIRETOR', 'ADMIN'],
  DIRETOR: ['SOLICITANTE', 'TECNICO', 'GESTOR'],
  GESTOR: ['SOLICITANTE', 'TECNICO'],
  TECNICO: [],
  SOLICITANTE: [],
};

/** Retorna true se `role` pode gerenciar usuários com o papel `targetRole`. */
export function canManageRole(role: string, targetRole: string): boolean {
  const allowed = MANAGEABLE_ROLES[role as Role];
  return allowed !== undefined && allowed.includes(targetRole as Role);
}
