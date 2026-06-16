export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ABERTO: ['EM_ANDAMENTO'],
  EM_ANDAMENTO: ['AGUARDANDO', 'RESOLVIDO'],
  AGUARDANDO: ['EM_ANDAMENTO'],
  RESOLVIDO: ['FECHADO'],
  FECHADO: ['REABERTO'],
  REABERTO: ['EM_ANDAMENTO'],
};

export function validateTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}
