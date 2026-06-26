import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { problemTypeSchema } from '@helpdesk/shared';

export async function problemTypeRoutes(fastify: FastifyInstance) {
  // GET /api/problem-types
  fastify.get<{ Querystring: { sectorId?: string } }>(
    '/api/problem-types',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest<{ Querystring: { sectorId?: string } }>, reply: FastifyReply) => {
      const { sectorId } = request.query;
      const where = sectorId ? { sectorId: parseInt(sectorId) } : {};

      const problemTypes = await prisma.problemType.findMany({
        where: where as any,
        orderBy: { nome: 'asc' },
      });
      return reply.send(problemTypes);
    },
  );

  // POST /api/problem-types
  fastify.post(
    '/api/problem-types',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = problemTypeSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, slaMinutes, sectorId, ativo } = parseResult.data;

      // Check if sector exists
      const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
      if (!sector) {
        return reply.status(404).send({ error: 'Setor não encontrado' });
      }

      const novoProblemType = await prisma.problemType.create({
        data: { nome, slaMinutes, sectorId, ativo: ativo ?? true },
      });

      return reply.status(201).send(novoProblemType);
    },
  );

  // PUT /api/problem-types/:id
  fastify.put<{ Params: { id: string } }>(
    '/api/problem-types/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const parseResult = problemTypeSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, slaMinutes, sectorId, ativo } = parseResult.data;

      const target = await prisma.problemType.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Tipo de problema não encontrado' });
      }

      // Check if sector exists
      const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
      if (!sector) {
        return reply.status(404).send({ error: 'Setor não encontrado' });
      }

      const problemTypeAtualizado = await prisma.problemType.update({
        where: { id },
        data: { nome, slaMinutes, sectorId, ativo },
      });

      return reply.send(problemTypeAtualizado);
    },
  );

  // DELETE /api/problem-types/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api/problem-types/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const target = await prisma.problemType.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Tipo de problema não encontrado' });
      }

      const ticketCount = await prisma.ticket.count({
        where: { problemTypeId: id },
      });

      if (ticketCount > 0) {
        return reply.status(400).send({
          error: `Este tipo de problema não pode ser excluído pois está vinculado a ${ticketCount} chamados`,
        });
      }

      await prisma.problemType.delete({
        where: { id },
      });

      return reply.status(204).send();
    },
  );
}
