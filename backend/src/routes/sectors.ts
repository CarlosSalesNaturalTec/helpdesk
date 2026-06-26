import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { sectorSchema } from '@helpdesk/shared';

export async function sectorRoutes(fastify: FastifyInstance) {
  // GET /api/sectors
  fastify.get(
    '/api/sectors',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sectors = await prisma.sector.findMany({
        orderBy: { nome: 'asc' },
      });
      return reply.send(sectors);
    },
  );

  // POST /api/sectors
  fastify.post(
    '/api/sectors',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = sectorSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, ativo } = parseResult.data;

      const existing = await prisma.sector.findUnique({
        where: { nome },
      });
      if (existing) {
        return reply.status(400).send({ error: 'Já existe um setor com este nome' });
      }

      const novoSector = await prisma.sector.create({
        data: { nome, ativo: ativo ?? true },
      });

      return reply.status(201).send(novoSector);
    },
  );

  // PUT /api/sectors/:id
  fastify.put<{ Params: { id: string } }>(
    '/api/sectors/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const parseResult = sectorSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, ativo } = parseResult.data;

      const target = await prisma.sector.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Setor não encontrado' });
      }

      const existing = await prisma.sector.findUnique({
        where: { nome },
      });
      if (existing && existing.id !== id) {
        return reply.status(400).send({ error: 'Já existe outro setor com este nome' });
      }

      const sectorAtualizado = await prisma.sector.update({
        where: { id },
        data: { nome, ativo },
      });

      return reply.send(sectorAtualizado);
    },
  );

  // DELETE /api/sectors/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api/sectors/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const target = await prisma.sector.findUnique({
        where: { id },
      });
      if (!target) {
        return reply.status(404).send({ error: 'Setor não encontrado' });
      }

      const userCount = await prisma.user.count({
        where: { sectorId: id },
      });
      
      const ticketCount = await prisma.ticket.count({
        where: { sectorId: id },
      });

      if (userCount > 0 || ticketCount > 0) {
        return reply.status(400).send({
          error: `Este setor não pode ser excluído pois está vinculado a ${userCount} usuários e ${ticketCount} chamados`,
        });
      }

      // Also check problem types? Yes, delete them or prevent deletion
      const problemTypeCount = await prisma.problemType.count({
        where: { sectorId: id },
      });

      if (problemTypeCount > 0) {
        return reply.status(400).send({
          error: `Este setor não pode ser excluído pois possui ${problemTypeCount} tipos de problemas associados`,
        });
      }

      await prisma.sector.delete({
        where: { id },
      });

      return reply.status(204).send();
    },
  );
}
