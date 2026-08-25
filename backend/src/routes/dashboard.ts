import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/dashboard',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'TECNICO', 'GESTOR', 'DIRETOR'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      let unidadeId: number | null = null;
      
      if (request.user!.role === 'ADMIN') {
        const query = request.query as { unidadeId?: string };
        if (query.unidadeId) {
          const parsed = parseInt(query.unidadeId, 10);
          if (!isNaN(parsed)) {
            unidadeId = parsed;
          }
        }
      } else {
        unidadeId = request.user!.unidadeId;
      }

      let sectorId: number | null = null;
      if (request.user!.role === 'ADMIN') {
        const query = request.query as { sectorId?: string };
        if (query.sectorId) {
          const parsed = parseInt(query.sectorId, 10);
          if (!isNaN(parsed)) {
            sectorId = parsed;
          }
        }
      } else if ((request.user!.role === 'TECNICO' || request.user!.role === 'GESTOR') && request.user!.sectorId) {
        sectorId = request.user!.sectorId;
      }

      const [cards, trend] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT
            COUNT(*) FILTER (WHERE status IN ('ABERTO', 'REABERTO'))::int as abertos,
            COUNT(*) FILTER (WHERE status IN ('EM_ANDAMENTO', 'AGUARDANDO'))::int as em_andamento,
            COUNT(*) FILTER (WHERE status = 'RESOLVIDO')::int as resolvidos,
            COUNT(*) FILTER (WHERE urgencia = 'CRITICA' AND status <> 'FECHADO')::int as criticos
          FROM "Ticket"
          WHERE (${unidadeId}::int IS NULL OR "unidadeId" = ${unidadeId}::int)
            AND (${sectorId}::int IS NULL OR "sectorId" = ${sectorId}::int)
        `,
        prisma.$queryRaw<any[]>`
          WITH days AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '29 days',
              CURRENT_DATE,
              '1 day'::interval
            )::date AS date
          )
          SELECT
            days.date::text AS date,
            COUNT(DISTINCT t_abertos.id)::int AS abertos,
            COUNT(DISTINCT t_fechados.id)::int AS fechados
          FROM days
          LEFT JOIN "Ticket" t_abertos
            ON t_abertos."criadoEm"::date = days.date
            AND (${unidadeId}::int IS NULL OR t_abertos."unidadeId" = ${unidadeId}::int)
            AND (${sectorId}::int IS NULL OR t_abertos."sectorId" = ${sectorId}::int)
          LEFT JOIN "Ticket" t_fechados
            ON t_fechados."atualizadoEm"::date = days.date
            AND t_fechados.status = 'FECHADO'
            AND (${unidadeId}::int IS NULL OR t_fechados."unidadeId" = ${unidadeId}::int)
            AND (${sectorId}::int IS NULL OR t_fechados."sectorId" = ${sectorId}::int)
          GROUP BY days.date
          ORDER BY days.date ASC
        `
      ]);

      const cardsData = cards[0] || { abertos: 0, em_andamento: 0, resolvidos: 0, criticos: 0 };
      const formattedCards = {
        abertos: cardsData.abertos || 0,
        emAndamento: cardsData.em_andamento || 0,
        resolvidos: cardsData.resolvidos || 0,
        criticos: cardsData.criticos || 0,
      };

      return reply.send({
        cards: formattedCards,
        trend: trend.map((t) => ({
          date: t.date,
          abertos: t.abertos || 0,
          fechados: t.fechados || 0,
        })),
      });
    }
  );
}
