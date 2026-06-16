import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authRequired(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token de autenticação ausente ou inválido' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}

export async function requirePasswordChange(request: FastifyRequest, reply: FastifyReply) {
  // Ignora na rota de mudança de senha para evitar loop
  if (request.url === '/api/auth/change-password' || request.url.startsWith('/api/auth/change-password')) {
    return;
  }

  if (request.user && request.user.mustChangePassword) {
    return reply.status(403).send({
      code: 'PASSWORD_CHANGE_REQUIRED',
      error: 'Alteração de senha obrigatória no primeiro login',
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Usuário não autenticado' });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Acesso negado. Permissão insuficiente.' });
    }
  };
}
