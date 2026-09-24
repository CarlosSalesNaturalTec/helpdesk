import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { JwtPayload } from '../lib/jwt.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { fullName, brandingSlug } from '../lib/branding.js';

const LOGO_PRINT_PATH = path.join(__dirname, '../../src/assets/logo-print.png');

// Teto de chamados listados no PDF (ver design da change relatorio-pdf-lista-chamados §3)
const PDF_MAX_TICKETS = 1000;
const DISPLAY_TIMEZONE = 'America/Sao_Paulo';
const EMPTY_MARK = '—';
const SEM_DADOS_MSG = 'Não há dados disponíveis para os filtros selecionados';

interface ReportFilters {
  periodo?: string;
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: string | number | null;
  sectorId?: string | number | null;
}

interface MetricsQuery extends ReportFilters {
  periodo: string;
  unidadeId?: string;
  sectorId?: string;
  dimensao: string;
}

interface PdfBody extends ReportFilters {
  chartImage?: string;
  dimensao?: string;
}

interface ReportScope {
  startDate: Date;
  endDate: Date;
  periodoLabel: string;
  targetUnidadeId?: number;
  targetSectorId?: number;
  where: Prisma.TicketWhereInput;
}

interface ReportCards {
  total: number;
  taxaFechamento: number;
  tmaHoras: number;
  satisfacaoMedia: number;
}

const STATUS_LABELS: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
  REABERTO: 'Reaberto',
};

const URGENCIA_LABELS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

function parseOptionalId(value: string | number | null | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const id = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isNaN(id) ? undefined : id;
}

/**
 * Deriva período e escopo por papel a partir dos filtros — ponto único usado tanto pelas
 * métricas quanto pelo PDF, para que os dois nunca divirjam.
 * Unidade: Admin filtra opcionalmente; demais papéis ficam fixados na própria.
 * Tipo de Ocorrência: Gestor é fixado na sua área; Admin e Diretor filtram opcionalmente.
 * Como a Unidade do Diretor é sempre imposta, o filtro de Tipo só estreita o que ele já vê.
 */
function resolveReportScope(user: JwtPayload, filters: ReportFilters): ReportScope | { error: string } {
  const periodo = filters.periodo || '30';
  let startDate = new Date();
  let endDate = new Date();
  let periodoLabel: string;

  if (periodo === 'custom') {
    if (!filters.dataInicio || !filters.dataFim) {
      return { error: 'dataInicio e dataFim são obrigatórios para período customizado' };
    }
    startDate = new Date(filters.dataInicio);
    endDate = new Date(filters.dataFim);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: 'Datas inválidas' };
    }
    endDate.setHours(23, 59, 59, 999);
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    periodoLabel = `De ${fmt(startDate)} até ${fmt(endDate)}`;
  } else {
    const days = parseInt(periodo) || 30;
    startDate.setDate(startDate.getDate() - days);
    periodoLabel = `Últimos ${days} dias`;
  }

  let targetUnidadeId: number | undefined;
  if (user.role === 'ADMIN') {
    targetUnidadeId = parseOptionalId(filters.unidadeId);
  } else {
    targetUnidadeId = user.unidadeId;
  }

  let targetSectorId: number | undefined;
  if (user.role === 'GESTOR') {
    targetSectorId = user.sectorId ?? undefined;
  } else if (user.role === 'ADMIN' || user.role === 'DIRETOR') {
    targetSectorId = parseOptionalId(filters.sectorId);
  }

  const where: Prisma.TicketWhereInput = {
    criadoEm: { gte: startDate, lte: endDate },
  };
  if (targetUnidadeId) where.unidadeId = targetUnidadeId;
  if (targetSectorId) where.sectorId = targetSectorId;

  return { startDate, endDate, periodoLabel, targetUnidadeId, targetSectorId, where };
}

/** Acrescenta ao SQL cru os filtros de Unidade/Tipo do escopo, numerando os parâmetros a partir dos já existentes. */
function appendScopeSql(sql: string, params: any[], scope: ReportScope): string {
  if (scope.targetUnidadeId) {
    params.push(scope.targetUnidadeId);
    sql += ` AND t."unidadeId" = $${params.length}`;
  }
  if (scope.targetSectorId) {
    params.push(scope.targetSectorId);
    sql += ` AND t."sectorId" = $${params.length}`;
  }
  return sql;
}

async function computeCards(scope: ReportScope): Promise<ReportCards> {
  const { where } = scope;

  // 1. Total Tickets e Taxa Fechamento
  const total = await prisma.ticket.count({ where });
  const fechadosCount = await prisma.ticket.count({
    where: {
      ...where,
      status: { in: ['FECHADO', 'RESOLVIDO'] },
    },
  });
  const taxaFechamento = total > 0 ? (fechadosCount / total) * 100 : 0;

  // 2. Satisfação Média
  const satisfactions = await prisma.satisfaction.aggregate({
    _avg: { nota: true },
    where: { ticket: where },
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

  const queryParams: any[] = [scope.startDate, scope.endDate];
  tmaSql = appendScopeSql(tmaSql, queryParams, scope);

  const tmaResult = await prisma.$queryRawUnsafe<{ tma_horas: number | null }[]>(tmaSql, ...queryParams);
  const tmaHoras = Number(tmaResult[0]?.tma_horas) || 0;

  return { total, taxaFechamento, tmaHoras, satisfacaoMedia };
}

interface PdfTicketRow {
  numero: string;
  titulo: string;
  problemType: string;
  status: string;
  urgencia: string;
  solicitante: string;
  tecnico: string;
  abertura: string;
}

interface SectorGroup {
  nome: string;
  tickets: PdfTicketRow[];
}

interface UnidadeGroup {
  nome: string;
  total: number;
  sectors: SectorGroup[];
}

/**
 * Consulta os chamados do escopo (no máximo PDF_MAX_TICKETS, os mais recentes) e os agrupa
 * em Unidade → Tipo de Ocorrência. Cada chamado aparece uma única vez, então os subtotais
 * de Tipo somam o subtotal da Unidade.
 */
async function fetchGroupedTickets(scope: ReportScope): Promise<UnidadeGroup[]> {
  const tickets = await prisma.ticket.findMany({
    where: scope.where,
    orderBy: { criadoEm: 'desc' },
    take: PDF_MAX_TICKETS,
    select: {
      numero: true,
      titulo: true,
      status: true,
      urgencia: true,
      criadoEm: true,
      unidade: { select: { nome: true } },
      sector: { select: { nome: true } },
      problemType: { select: { nome: true } },
      solicitante: { select: { nome: true } },
      tecnico: { select: { nome: true } },
    },
  });

  const unidades = new Map<string, Map<string, PdfTicketRow[]>>();
  for (const t of tickets) {
    const row: PdfTicketRow = {
      numero: t.numero.toString(),
      titulo: t.titulo,
      problemType: t.problemType?.nome ?? EMPTY_MARK,
      status: STATUS_LABELS[t.status] ?? t.status,
      urgencia: URGENCIA_LABELS[t.urgencia] ?? t.urgencia,
      solicitante: t.solicitante?.nome ?? EMPTY_MARK,
      tecnico: t.tecnico?.nome ?? EMPTY_MARK,
      abertura: t.criadoEm.toLocaleDateString('pt-BR', { timeZone: DISPLAY_TIMEZONE }),
    };
    const sectorsMap = unidades.get(t.unidade.nome) ?? new Map<string, PdfTicketRow[]>();
    unidades.set(t.unidade.nome, sectorsMap);
    const rows = sectorsMap.get(t.sector.nome) ?? [];
    sectorsMap.set(t.sector.nome, rows);
    rows.push(row);
  }

  const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  return [...unidades.entries()]
    .sort(([a], [b]) => byName(a, b))
    .map(([nome, sectorsMap]) => {
      const sectors = [...sectorsMap.entries()]
        .sort(([a], [b]) => byName(a, b))
        .map(([sectorNome, rows]) => ({
          nome: sectorNome,
          // Ordem crescente de número dentro do grupo
          tickets: rows.sort((x, y) => (BigInt(x.numero) < BigInt(y.numero) ? -1 : 1)),
        }));
      return { nome, total: sectors.reduce((acc, s) => acc + s.tickets.length, 0), sectors };
    });
}

// Colunas da lista de chamados (largura total = 495, área útil do A4 com margem 50)
const TICKET_COLUMNS: { key: keyof PdfTicketRow; title: string; width: number }[] = [
  { key: 'numero', title: 'Nº', width: 38 },
  { key: 'titulo', title: 'Título', width: 107 },
  { key: 'problemType', title: 'Tipo de Problema', width: 68 },
  { key: 'status', title: 'Status', width: 52 },
  { key: 'urgencia', title: 'Urgência', width: 40 },
  { key: 'solicitante', title: 'Solicitante', width: 66 },
  { key: 'tecnico', title: 'Técnico', width: 66 },
  { key: 'abertura', title: 'Abertura', width: 58 },
];

function drawTicketList(doc: PDFKit.PDFDocument, groups: UnidadeGroup[]) {
  const left = doc.page.margins.left;
  const tableWidth = TICKET_COLUMNS.reduce((acc, c) => acc + c.width, 0);
  const cellPadding = 2;
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 30; // reserva para o rodapé

  const ensureSpace = (height: number): boolean => {
    if (doc.y + height > bottomLimit()) {
      doc.addPage();
      return true;
    }
    return false;
  };

  const rowHeight = (cells: string[], font: string) => {
    doc.font(font).fontSize(7);
    return Math.max(
      ...cells.map((text, i) => doc.heightOfString(text, { width: TICKET_COLUMNS[i].width - cellPadding * 2 })),
    ) + cellPadding * 2;
  };

  const drawRow = (cells: string[], font: string, shaded: boolean) => {
    const h = rowHeight(cells, font);
    const y = doc.y;
    if (shaded) {
      doc.save().rect(left, y, tableWidth, h).fill('#eeeeee').restore();
    }
    let x = left;
    doc.font(font).fontSize(7).fillColor('#000000');
    cells.forEach((text, i) => {
      doc.text(text, x + cellPadding, y + cellPadding, { width: TICKET_COLUMNS[i].width - cellPadding * 2 });
      x += TICKET_COLUMNS[i].width;
    });
    doc.x = left;
    doc.y = y + h;
  };

  const headerCells = TICKET_COLUMNS.map((c) => c.title);
  const drawHeader = () => drawRow(headerCells, 'Helvetica-Bold', true);

  const drawGroupTitle = (text: string, count: number, fontSize: number, indent: number) => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#000000');
    doc.text(text, left + indent, y, { width: tableWidth - indent - 60, lineBreak: false, ellipsis: true });
    doc.text(String(count), left + tableWidth - 60, y, { width: 60, align: 'right' });
    doc.x = left;
    doc.y = y + doc.currentLineHeight() + 4;
  };

  for (const unidade of groups) {
    // Cabeçalho de Unidade nunca fica órfão: exige espaço para ele, o do Tipo, o da tabela e uma linha
    ensureSpace(90);
    doc.moveDown(0.5);
    drawGroupTitle(`Unidade: ${unidade.nome}`, unidade.total, 11, 0);

    for (const sector of unidade.sectors) {
      ensureSpace(60);
      drawGroupTitle(`Tipo de Ocorrência: ${sector.nome}`, sector.tickets.length, 9, 10);
      drawHeader();

      for (const ticket of sector.tickets) {
        const cells = TICKET_COLUMNS.map((c) => ticket[c.key]);
        if (ensureSpace(rowHeight(cells, 'Helvetica'))) {
          drawGroupTitle(`Tipo de Ocorrência: ${sector.nome} (continuação)`, sector.tickets.length, 9, 10);
          drawHeader();
        }
        drawRow(cells, 'Helvetica', false);
        doc.save()
          .moveTo(left, doc.y).lineTo(left + tableWidth, doc.y)
          .lineWidth(0.3).strokeColor('#cccccc').stroke()
          .restore();
      }
      doc.moveDown(0.5);
    }
  }
}

export const reportsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post('/api/reports/pdf', {
    preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR', 'DIRETOR', 'ADMIN'])],
  }, async (request, reply) => {
    const body = (request.body ?? {}) as PdfBody;
    const user = request.user!;

    const scope = resolveReportScope(user, body);
    if ('error' in scope) {
      return reply.status(400).send({ error: scope.error });
    }

    // Cards e lista apurados no servidor a partir do mesmo escopo — o gráfico é o único item vindo do cliente
    const [cards, groups, unidade, sector] = await Promise.all([
      computeCards(scope),
      fetchGroupedTickets(scope),
      scope.targetUnidadeId
        ? prisma.unidade.findUnique({ where: { id: scope.targetUnidadeId }, select: { nome: true } })
        : null,
      scope.targetSectorId
        ? prisma.sector.findUnique({ where: { id: scope.targetSectorId }, select: { nome: true } })
        : null,
    ]);
    const listedCount = groups.reduce((acc, g) => acc + g.total, 0);
    const isSemDados = cards.total === 0;

    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="relatorio_${brandingSlug()}.pdf"`);

    // We can just return the document stream and pipe it to the reply
    reply.send(doc);

    // Cabeçalho
    const logoWidth = 80;
    const headerStartY = doc.y;
    try {
      doc.image(LOGO_PRINT_PATH, doc.page.width / 2 - logoWidth / 2, headerStartY, { width: logoWidth });
      doc.y = headerStartY + logoWidth * (204 / 240) + 10;
    } catch (e) {
      // Ativo indisponível: segue apenas com o cabeçalho textual abaixo
      doc.y = headerStartY;
    }

    doc.fontSize(20).text(`Relatório ${fullName}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12);
    doc.text(`Período: ${scope.periodoLabel}`);
    doc.text(`Unidade: ${unidade?.nome ?? 'Todas'}`);
    doc.text(`Tipo de Ocorrência: ${sector?.nome ?? 'Todos'}`);
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

    doc.x = 50;
    doc.y = startY + 80;

    // Cenário sem dados: mensagem única no lugar do gráfico e da lista, sem grupos vazios
    if (isSemDados) {
      doc.moveDown(2);
      doc.fontSize(14).text(SEM_DADOS_MSG, { align: 'center' });
    } else {
      if (body.chartImage) {
        doc.moveDown(2);
        try {
          const base64Data = body.chartImage.replace(/^data:image\/png;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, 50, doc.y, { width: 495 });
        } catch (e) {
          doc.text('Erro ao carregar o gráfico.', { align: 'center' });
        }
      }

      // Lista de chamados em página própria
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(14).text('Chamados', { align: 'left' });
      doc.font('Helvetica').fontSize(9).text(`${listedCount} chamado(s) listado(s), agrupados por Unidade e Tipo de Ocorrência.`);
      if (cards.total > listedCount) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#b00020').text(
          `Lista truncada: o escopo filtrado tem ${cards.total} chamados, mas apenas os ${listedCount} mais recentes são listados. ` +
          'Refine os filtros (período, Unidade ou Tipo de Ocorrência) para ver a lista completa.',
        );
        doc.fillColor('#000000');
      }
      doc.moveDown(0.5);
      drawTicketList(doc, groups);
    }

    // Rodapé em todas as páginas (escrito abaixo da margem inferior, que é zerada temporariamente)
    const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: DISPLAY_TIMEZONE });
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const originalBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(9).fillColor('#000000').text(
        `Gerado por ${user.nome || 'Usuário'} em ${geradoEm} — página ${i + 1} de ${range.count}`,
        50,
        doc.page.height - 40,
        { width: doc.page.width - 100, align: 'center', lineBreak: false },
      );
      doc.page.margins.bottom = originalBottom;
    }

    doc.end();

    return reply;
  });

  fastify.get<{ Querystring: MetricsQuery }>('/api/reports/metrics', {
    preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR', 'DIRETOR', 'ADMIN'])],
  }, async (request, reply) => {
    const { dimensao } = request.query;
    const user = request.user;

    if (!user || !['GESTOR', 'DIRETOR', 'ADMIN'].includes(user.role)) {
      return reply.status(403).send({ error: 'Acesso negado' });
    }

    const scope = resolveReportScope(user, request.query);
    if ('error' in scope) {
      return reply.status(400).send({ error: scope.error });
    }

    // Gráfico de distribuição
    const DIMENSION_COLUMNS: Record<string, string> = {
      status: 't.status',
      prioridade: 't.urgencia',
      categoria: 'pt.nome',
      satisfacao: 's.nota',
      unidade: 'u.nome',
    };

    if (!DIMENSION_COLUMNS[dimensao]) {
      return reply.status(400).send({ error: 'Dimensão inválida' });
    }
    if (dimensao === 'unidade' && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Dimensão unidade restrita para administradores' });
    }

    const cards = await computeCards(scope);

    const col = DIMENSION_COLUMNS[dimensao];

    let distSql = `
      SELECT ${col} as label, COUNT(t.id)::int as count
      FROM "Ticket" t
    `;

    if (dimensao === 'satisfacao') {
      distSql += ` LEFT JOIN "Satisfaction" s ON s."ticketId" = t.id`;
    } else if (dimensao === 'unidade') {
      distSql += ` JOIN "Unidade" u ON u.id = t."unidadeId"`;
    } else if (dimensao === 'categoria') {
      distSql += ` LEFT JOIN "ProblemType" pt ON pt.id = t."problemTypeId"`;
    }

    distSql += ` WHERE t."criadoEm" >= $1 AND t."criadoEm" <= $2`;

    const distParams: any[] = [scope.startDate, scope.endDate];
    distSql = appendScopeSql(distSql, distParams, scope);

    distSql += ` GROUP BY ${col} ORDER BY count DESC`;

    const distResult = await prisma.$queryRawUnsafe<{ label: string | number | null, count: number }[]>(distSql, ...distParams);

    const distribuicao = distResult.map(r => ({
      label: r.label === null ? (dimensao === 'satisfacao' ? 'Sem nota' : 'Desconhecido') : String(r.label),
      count: r.count
    }));

    return { cards, distribuicao };
  });
};
