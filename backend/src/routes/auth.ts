import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';
import { authRequired } from '../middleware/auth.js';
import { loginSchema, changePasswordSchema } from '@helpdesk/shared';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: parseResult.error.format() });
    }

    const { email, senha } = parseResult.data;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    const now = new Date();

    // Se o usuário existe e está bloqueado
    if (user && user.lockedUntil && user.lockedUntil > now) {
      return reply.status(429).send({
        error: 'Muitas tentativas falhas. Tente novamente em 15 minutos.',
      });
    }

    if (!user) {
      // Se não existe, retorna credenciais inválidas para evitar enumeração
      return reply.status(401).send({ error: 'E-mail ou senha inválidos' });
    }

    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const isLocking = attempts >= 5;
      const lockedUntil = isLocking ? new Date(now.getTime() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      if (isLocking) {
        return reply.status(429).send({
          error: 'Muitas tentativas falhas. Tente novamente em 15 minutos.',
        });
      }

      return reply.status(401).send({ error: 'E-mail ou senha inválidos' });
    }

    // Se o usuário está desativado
    if (!user.ativo) {
      return reply.status(403).send({
        error: 'Usuário desativado. Entre em contato com o administrador.',
      });
    }

    // Credenciais válidas, resetar tentativas falhas
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Assinar Token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      unidadeId: user.unidadeId,
      sectorId: user.sectorId,
      mustChangePassword: user.passwordResetRequired,
      nome: user.nome,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        unidadeId: user.unidadeId,
        sectorId: user.sectorId,
        passwordResetRequired: user.passwordResetRequired,
      },
    });
  });

  // GET /api/auth/me
  fastify.get(
    '/api/auth/me',
    { preHandler: [authRequired] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Não autenticado' });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: { unidade: true, sector: true },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      if (!user.ativo) {
        return reply.status(403).send({ error: 'Usuário desativado' });
      }

      return reply.send({
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          unidadeId: user.unidadeId,
          sectorId: user.sectorId,
          unidadeNome: user.unidade.nome,
          sectorNome: user.sector?.nome,
          passwordResetRequired: user.passwordResetRequired,
        },
      });
    },
  );

  // POST /api/auth/change-password
  fastify.post(
    '/api/auth/change-password',
    { preHandler: [authRequired] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Não autenticado' });
      }

      const parseResult = changePasswordSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { senhaAtual, novaSenha } = parseResult.data;

      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
      });

      if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Validar senha atual
      const isPasswordValid = await bcrypt.compare(senhaAtual, user.senhaHash);
      if (!isPasswordValid) {
        return reply.status(400).send({ error: 'Senha atual incorreta' });
      }

      // Gerar hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

      // Atualizar no banco e remover flag
      await prisma.user.update({
        where: { id: user.id },
        data: {
          senhaHash: novaSenhaHash,
          passwordResetRequired: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      return reply.send({ message: 'Senha alterada com sucesso' });
    },
  );
}
