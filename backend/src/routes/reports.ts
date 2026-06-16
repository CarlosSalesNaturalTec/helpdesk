import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';

interface MetricsQuery {
  periodo: string;
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: string;
  dimensao: string;
}

export const reportsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/api/reports/pdf', {
    preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR_TI', 'DIRETOR', 'ADMIN'])],
  }, async (request, reply) => {
    const { cards, chartImage, dimensao, periodoLabel, unidadeLabel } = request.body as any;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="relatorio_helpdesk.pdf"');
    
    // We can just return the document stream and pipe it to the reply
    reply.send(doc);

    const isSemDados = cards.total === 0;

    // Cabeçalho
    doc.fontSize(20).text('Relatório HelpDesk', { align: 'center' });
    doc.moveDown(1);
    
    doc.fontSize(12);
    doc.text(`Período: ${periodoLabel || 'Não informado'}`);
    if (unidadeLabel) {
      doc.text(`Unidade: ${unidadeLabel}`);
    }
    doc.moveDown(2);

    // Cards
    const startY = doc.y;
    const cardWidth = 110;
    const spacing = 15;
    const positions = [
      50,
      50 + cardWidth + spacing,
      50 + (cardWidth + spacing) * 2,
      50 + (cardWidth + spacing) * 3
    ];

    const drawCard = (x: number, y: number, title: string, value: string) => {
      doc.rect(x, y, cardWidth, 60).stroke();
      doc.fontSize(10).text(title, x + 5, y + 10, { width: cardWidth - 10, align: 'center' });
      doc.fontSize(14).text(value, x + 5, y + 35, { width: cardWidth - 10, align: 'center' });
    };

    drawCard(positions[0], startY, 'Total', String(cards.total));
    drawCard(positions[1], startY, 'Taxa Fechamento', `${Number(cards.taxaFechamento).toFixed(1)}%`);
    drawCard(positions[2], startY, 'TMA', `${Number(cards.tmaHoras).toFixed(1)}h`);
    drawCard(positions[3], startY, 'Satisfação Média', Number(cards.satisfacaoMedia).toFixed(1));

    doc.y = startY + 80;

    // Cenário sem dados ou com gráfico
    if (isSemDados) {
      doc.moveDown(2);
      doc.fontSize(14).text('Não há dados disponíveis para os filtros selecionados', { align: 'center' });
    } else if (chartImage) {
      doc.moveDown(2);
      try {
        const base64Data = chartImage.replace(/^data:image\/png;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, 50, doc.y, { width: 495 });
      } catch (e) {
        doc.text('Erro ao carregar o gráfico.', { align: 'center' });
      }
    }

    // Rodapé
    const bottomY = doc.page.height - 100;
    doc.fontSize(10).text(`Gerado por ${request.user?.nome || 'Usuário'} em ${new Date().toLocaleString('pt-BR')}`, 50, bottomY, { align: 'center' });

    doc.end();
  });

  fastify.get<{ Querystring: MetricsQuery }>('/api/reports/metrics', {
    preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR_TI', 'DIRETOR', 'ADMIN'])],
  }, async (request, reply) => {
    const { periodo, dataInicio, dataFim, unidadeId, dimensao } = request.query;
    const user = request.user;

    if (!user || !['GESTOR_TI', 'DIRETOR', 'ADMIN'].includes(user.role)) {
      return reply.status(403).send({ error: 'Acesso negado' });
    }

    // Calcular datas
    let startDate = new Date();
    let endDate = new Date();
    if (periodo === 'custom') {
      if (!dataInicio || !dataFim) {
        return reply.status(400).send({ error: 'dataInicio e dataFim são obrigatórios para período customizado' });
      }
      startDate = new Date(dataInicio);
      endDate = new Date(dataFim);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const days = parseInt(periodo) || 30;
      startDate.setDate(startDate.getDate() - days);
    }

    // Escopo de unidade
    let targetUnidadeId: number | undefined;
    if (user.role === 'ADMIN') {
      if (unidadeId) {
        targetUnidadeId = parseInt(unidadeId);
      }
    } else {
      targetUnidadeId = user.unidadeId;
    }

    const whereClause: Prisma.TicketWhereInput = {
      criadoEm: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (targetUnidadeId) {
      whereClause.unidadeId = targetUnidadeId;
    }

    // 1. Total Tickets e Taxa Fechamento
    const totalTickets = await prisma.ticket.count({ where: whereClause });
    const fechadosCount = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: { in: ['FECHADO', 'RESOLVIDO'] },
      },
    });
    const taxaFechamento = totalTickets > 0 ? (fechadosCount / totalTickets) * 100 : 0;

    // 2. Satisfação Média
    const satisfactions = await prisma.satisfaction.aggregate({
      _avg: {
        nota: true,
      },
      where: {
        ticket: whereClause,
      },
    });
    const satisfacaoMedia = satisfactions._avg.nota || 0;

    // 3. TMA com SQL Raw
    let tmaSql = `
      WITH resolvido_times AS (
        SELECT "ticketId", MIN("criadoEm") as resolvido_em
        FROM "TicketHistory"
        WHERE "type" = 'MUDANCA_STATUS' AND "content"->>'to' = 'RESOLVIDO'
        GROUP BY "ticketId"
      ),
      status_times AS (
        SELECT
          "ticketId",
          "criadoEm",
          CASE 
            WHEN "type" = 'ABERTURA' THEN 'ABERTO'
            WHEN "type" = 'MUDANCA_STATUS' THEN "content"->>'to'
          END AS status,
          LAG("criadoEm") OVER (PARTITION BY "ticketId" ORDER BY "criadoEm") AS prev_time,
          LAG(
            CASE 
              WHEN "type" = 'ABERTURA' THEN 'ABERTO'
              WHEN "type" = 'MUDANCA_STATUS' THEN "content"->>'to'
            END
          ) OVER (PARTITION BY "ticketId" ORDER BY "criadoEm") AS prev_status
        FROM "TicketHistory"
        WHERE "type" IN ('ABERTURA', 'MUDANCA_STATUS')
      ),
      aguardando_time AS (
        SELECT
          st."ticketId",
          SUM(
            EXTRACT(EPOCH FROM (
              LEAST(st."criadoEm", rt.resolvido_em) - st.prev_time
            )) / 3600.0
          ) FILTER (WHERE st.prev_status = 'AGUARDANDO') AS horas_aguardando
        FROM status_times st
        JOIN resolvido_times rt ON rt."ticketId" = st."ticketId"
        WHERE st.prev_time IS NOT NULL AND st.prev_time <= rt.resolvido_em
        GROUP BY st."ticketId"
      )
      SELECT AVG(
        EXTRACT(EPOCH FROM (rt.resolvido_em - t."criadoEm")) / 3600.0
        - COALESCE(a.horas_aguardando, 0)
      ) AS tma_horas
      FROM "Ticket" t
      JOIN resolvido_times rt ON rt."ticketId" = t.id
      LEFT JOIN aguardando_time a ON a."ticketId" = t.id
      WHERE t.status IN ('RESOLVIDO', 'FECHADO')
        AND t."criadoEm" >= $1
        AND t."criadoEm" <= $2
    `;

    const queryParams: any[] = [startDate, endDate];
    if (targetUnidadeId) {
      tmaSql += ` AND t."unidadeId" = $3`;
      queryParams.push(targetUnidadeId);
    }

    const tmaResult = await prisma.$queryRawUnsafe<{ tma_horas: number | null }[]>(tmaSql, ...queryParams);
    const tmaHoras = tmaResult[0]?.tma_horas || 0;

    // 4. Gráfico de distribuição
    const DIMENSION_COLUMNS: Record<string, string> = {
      status: 't.status',
      prioridade: 't.urgencia',
      categoria: 't."tipoProblema"',
      satisfacao: 's.nota',
      unidade: 'u.nome',
    };

    if (!DIMENSION_COLUMNS[dimensao]) {
      return reply.status(400).send({ error: 'Dimensão inválida' });
    }
    if (dimensao === 'unidade' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Dimensão unidade restrita para administradores' });
    }

    const col = DIMENSION_COLUMNS[dimensao];
    
    let distSql = `
      SELECT ${col} as label, COUNT(t.id)::int as count
      FROM "Ticket" t
    `;
    
    if (dimensao === 'satisfacao') {
      distSql += ` LEFT JOIN "Satisfaction" s ON s."ticketId" = t.id`;
    } else if (dimensao === 'unidade') {
      distSql += ` JOIN "Unidade" u ON u.id = t."unidadeId"`;
    }

    distSql += ` WHERE t."criadoEm" >= $1 AND t."criadoEm" <= $2`;
    
    const distParams: any[] = [startDate, endDate];
    if (targetUnidadeId) {
      distSql += ` AND t."unidadeId" = $3`;
      distParams.push(targetUnidadeId);
    }

    distSql += ` GROUP BY ${col} ORDER BY count DESC`;

    const distResult = await prisma.$queryRawUnsafe<{ label: string | number | null, count: number }[]>(distSql, ...distParams);
    
    const distribuicao = distResult.map(r => ({
      label: r.label === null ? (dimensao === 'satisfacao' ? 'Sem nota' : 'Desconhecido') : String(r.label),
      count: r.count
    }));

    return {
      cards: {
        total: totalTickets,
        taxaFechamento,
        tmaHoras,
        satisfacaoMedia,
      },
      distribuicao,
    };
  });
};
