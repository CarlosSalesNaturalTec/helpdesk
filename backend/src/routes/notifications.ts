import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange } from '../middleware/auth.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // 6.1 GET /api/notifications/unread-count
  fastify.get(
    '/api/notifications/unread-count',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const count = await prisma.notification.count({
        where: {
          userId: user.id,
          lida: false,
        },
      });
      return reply.send({ count });
    }
  );

  // 6.2 GET /api/notifications (paginado, ordenado por lida desc e criadoEm desc)
  fastify.get(
    '/api/notifications',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      
      const querySchema = z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
      });

      const parseResult = querySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { page, limit } = parseResult.data;

      const total = await prisma.notification.count({
        where: { userId: user.id },
      });

      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: [
          { lida: 'asc' }, // false (não lida) vem antes de true (lida)
          { criadoEm: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      });

      return reply.send({
        data: notifications,
        total,
        page,
        limit,
      });
    }
  );

  // 6.3 PATCH /api/notifications/:id/read
  fastify.patch<{ Params: { id: string } }>(
    '/api/notifications/:id/read',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const user = request.user!;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return reply.status(404).send({ error: 'Notificação não encontrada' });
      }

      if (notification.userId !== user.id) {
        return reply.status(403).send({ error: 'Acesso negado. Esta notificação não pertence a você.' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { lida: true },
      });

      return reply.send(updated);
    }
  );

  // 6.4 PATCH /api/notifications/read-all
  fastify.patch(
    '/api/notifications/read-all',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;

      const result = await prisma.notification.updateMany({
        where: {
          userId: user.id,
          lida: false,
        },
        data: { lida: true },
      });

      return reply.send({
        success: true,
        count: result.count,
        message: `${result.count} notificações marcadas como lidas.`,
      });
    }
  );
}
