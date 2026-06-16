import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { unidadeSchema } from '@helpdesk/shared';

export async function unidadeRoutes(fastify: FastifyInstance) {
  // GET /api/unidades
  fastify.get(
    '/api/unidades',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const unidades = await prisma.unidade.findMany({
        orderBy: { nome: 'asc' },
      });
      return reply.send(unidades);
    },
  );

  // POST /api/unidades
  fastify.post(
    '/api/unidades',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = unidadeSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome } = parseResult.data;

      // Verificar se nome já existe
      const existing = await prisma.unidade.findUnique({
        where: { nome },
      });
      if (existing) {
        return reply.status(400).send({ error: 'Já existe uma unidade com este nome' });
      }

      const novaUnidade = await prisma.unidade.create({
        data: { nome },
      });

      return reply.status(201).send(novaUnidade);
    },
  );

  // PUT /api/unidades/:id
  fastify.put<{ Params: { id: string } }>(
    '/api/unidades/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const parseResult = unidadeSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome } = parseResult.data;

      // Verificar se existe a unidade
      const target = await prisma.unidade.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Unidade não encontrada' });
      }

      // Verificar nome único
      const existing = await prisma.unidade.findUnique({
        where: { nome },
      });
      if (existing && existing.id !== id) {
        return reply.status(400).send({ error: 'Já existe outra unidade com este nome' });
      }

      const unidadeAtualizada = await prisma.unidade.update({
        where: { id },
        data: { nome },
      });

      return reply.send(unidadeAtualizada);
    },
  );

  // DELETE /api/unidades/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api/unidades/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const target = await prisma.unidade.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Unidade não encontrada' });
      }

      // Contar usuários vinculados
      const userCount = await prisma.user.count({
        where: { unidadeId: id },
      });

      // No futuro teremos chamados vinculados. Como agora não temos, assumimos 0 chamados.
      const ticketCount = 0;

      if (userCount > 0 || ticketCount > 0) {
        return reply.status(400).send({
          error: `Esta Unidade não pode ser excluída pois está vinculada a ${userCount} usuários e ${ticketCount} chamados`,
        });
      }

      await prisma.unidade.delete({
        where: { id },
      });

      return reply.status(204).send();
    },
  );
}
