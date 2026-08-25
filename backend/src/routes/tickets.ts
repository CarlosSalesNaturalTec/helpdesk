import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { unitFilter, sectorFilter, scopeWhere } from '../lib/rbac.js';
import { validateTransition } from '../lib/workflow.js';
import { NotificationService } from '../services/notification.js';
import { uploadFile, deleteFile, extractGcsPath } from '../lib/storage.js';
import { validateAttachment } from '../lib/attachment.js';
import {
  createTicketSchema,
  ticketStatusSchema,
  assignTicketSchema,
  satisfactionSchema,
  ticketQuerySchema,
} from '@helpdesk/shared';


export async function ticketRoutes(fastify: FastifyInstance) {
  // 1. Criar Chamado (multipart/form-data com anexo opcional)
  fastify.post(
    '/api/tickets',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const bucketName = process.env.GCS_BUCKET_NAME;

      // Parsear multipart/form-data
      const parts = request.parts();
      const fields: Record<string, string> = {};
      let fileBuffer: Buffer | null = null;
      let fileName = '';
      let fileMime = '';
      let fileSize = 0;

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          fileSize = fileBuffer.length;
          fileName = part.filename || '';
          fileMime = part.mimetype || '';
        } else {
          fields[part.fieldname] = part.value as string;
        }
      }

      // Converter campos numéricos
      const rawData = {
        titulo: fields['titulo'],
        descricao: fields['descricao'],
        sectorId: fields['sectorId'] ? parseInt(fields['sectorId'], 10) : undefined,
        problemTypeId: fields['problemTypeId'] ? parseInt(fields['problemTypeId'], 10) : undefined,
        urgencia: fields['urgencia'],
      };

      // Validar campos via Zod (schema compartilhado)
      const parseResult = createTicketSchema.safeParse(rawData);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { titulo, descricao, sectorId, problemTypeId, urgencia } = parseResult.data;

      // Validar e fazer upload do anexo (se fornecido)
      let anexoUrl: string | null = null;
      let anexoNome: string | null = null;
      let anexoTipo: string | null = null;
      let anexoTamanho: number | null = null;

      if (fileBuffer && fileBuffer.length > 0) {
        // Validar tipo e tamanho
        const validation = validateAttachment(fileName, fileMime, fileSize);
        if (!validation.valid) {
          return reply.status(400).send({ error: validation.error });
        }

        if (!bucketName) {
          return reply.status(500).send({ error: 'Configuração de armazenamento ausente (GCS_BUCKET_NAME).' });
        }

        // Criar ticket provisoriamente para obter o ID (necessário para o path do GCS)
        // Usamos uma transação: criar ticket, fazer upload, atualizar campos de anexo
        const tempTicket = await prisma.ticket.create({
          data: {
            titulo,
            descricao,
            sectorId,
            problemTypeId,
            urgencia,
            solicitanteId: user.id,
            unidadeId: user.unidadeId,
            status: 'ABERTO',
          },
        });

        const uuid = randomUUID();
        const filePath = `tickets/${tempTicket.id}/${uuid}-${fileName}`;

        try {
          anexoUrl = await uploadFile(bucketName, filePath, fileBuffer, fileMime);
          anexoNome = fileName;
          anexoTipo = fileMime;
          anexoTamanho = fileSize;
        } catch (uploadErr) {
          // Se o upload falhar, desfazer a criação do ticket
          await prisma.ticket.delete({ where: { id: tempTicket.id } });
          fastify.log.error(uploadErr);
          return reply.status(502).send({ error: 'Falha ao fazer upload do anexo. Tente novamente.' });
        }

        // Atualizar ticket com campos de anexo
        const ticket = await prisma.ticket.update({
          where: { id: tempTicket.id },
          data: { anexoUrl, anexoNome, anexoTipo, anexoTamanho },
        });

        // Registrar no histórico
        await prisma.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            type: 'ABERTURA',
            content: { titulo, descricao, sectorId, problemTypeId, urgencia },
            authorId: user.id,
          },
        });

        return reply.status(201).send({
          id: ticket.id,
          numero: ticket.numero.toString(),
          status: ticket.status,
          criadoEm: ticket.criadoEm,
          message: 'Chamado criado com sucesso!',
        });
      }

      // Sem anexo — fluxo original
      const ticket = await prisma.ticket.create({
        data: {
          titulo,
          descricao,
          sectorId,
          problemTypeId,
          urgencia,
          solicitanteId: user.id,
          unidadeId: user.unidadeId,
          status: 'ABERTO',
        },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          type: 'ABERTURA',
          content: { titulo, descricao, sectorId, problemTypeId, urgencia },
          authorId: user.id,
        },
      });

      return reply.status(201).send({
        id: ticket.id,
        numero: ticket.numero.toString(),
        status: ticket.status,
        criadoEm: ticket.criadoEm,
        message: 'Chamado criado com sucesso!',
      });
    }
  );

  // 2. Listar Chamados (com busca, filtro e escopo)
  fastify.get(
    '/api/tickets',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const queryParse = ticketQuerySchema.safeParse(request.query);
      if (!queryParse.success) {
        return reply.status(400).send({ error: queryParse.error.format() });
      }

      const { search, status, page, limit, sectorId, problemTypeId } = queryParse.data;
      const user = request.user!;

      let whereClause: any = {};

      // Aplicar escopo por papel
      if (user.role === 'SOLICITANTE') {
        whereClause.solicitanteId = user.id;
      } else {
        Object.assign(whereClause, scopeWhere(user));
      }

      // Aplicar filtro de status
      if (status) {
        whereClause.status = status;
      }

      // Filtros adicionais
      if (sectorId) {
        whereClause.sectorId = sectorId;
      }
      if (problemTypeId) {
        whereClause.problemTypeId = problemTypeId;
      }

      // Aplicar busca textual (titulo, solicitante.nome, unidade.nome)
      if (search) {
        whereClause.AND = [
          ...(whereClause.AND || []),
          {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' } },
              { solicitante: { nome: { contains: search, mode: 'insensitive' } } },
              { unidade: { nome: { contains: search, mode: 'insensitive' } } },
            ],
          },
        ];
      }

      const total = await prisma.ticket.count({ where: whereClause });
      const tickets = await prisma.ticket.findMany({
        where: whereClause,
        include: {
          solicitante: {
            select: { id: true, nome: true, email: true },
          },
          tecnico: {
            select: { id: true, nome: true, email: true },
          },
          unidade: {
            select: { id: true, nome: true },
          },
          sector: {
            select: { id: true, nome: true },
          },
          problemType: {
            select: { id: true, nome: true },
          },
          _count: {
            select: { history: true },
          },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedData = tickets.map((t) => ({
        ...t,
        numero: t.numero.toString(),
      }));

      reply.header('X-Total-Count', total.toString());
      return reply.send({
        data: formattedData,
        total,
        page,
        limit,
      });
    }
  );



  // 3. Endpoints de Apoio (devem ficar antes das rotas com parâmetro :id para evitar conflito)
  fastify.get(
    '/api/tickets/niveis-urgencia',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const niveis = [
        { label: 'Baixa', value: 'BAIXA' },
        { label: 'Média', value: 'MEDIA' },
        { label: 'Alta', value: 'ALTA' },
        { label: 'Crítica', value: 'CRITICA' },
      ];
      return reply.send(niveis);
    }
  );

  // 4. Obter Detalhes do Chamado
  fastify.get<{ Params: { id: string } }>(
    '/api/tickets/:id',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          solicitante: {
            select: { id: true, nome: true, email: true },
          },
          tecnico: {
            select: { id: true, nome: true, email: true },
          },
          unidade: {
            select: { id: true, nome: true },
          },
          sector: {
            select: { id: true, nome: true },
          },
          problemType: {
            select: { id: true, nome: true },
          },
          _count: {
            select: { history: true },
          },
        },
      });

      if (!ticket) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Validar escopo de visualização
      const user = request.user!;
      if (user.role === 'SOLICITANTE' && ticket.solicitanteId !== user.id) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }
      if (user.role !== 'SOLICITANTE' && (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId))) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      return reply.send({
        ...ticket,
        numero: ticket.numero.toString(),
      });
    }
  );

  // 5. Obter Histórico do Chamado
  fastify.get<{ Params: { id: string } }>(
    '/api/tickets/:id/history',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id },
      });

      if (!ticket) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Validar escopo de visualização
      const user = request.user!;
      if (user.role === 'SOLICITANTE' && ticket.solicitanteId !== user.id) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }
      if (user.role !== 'SOLICITANTE' && (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId))) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      const history = await prisma.ticketHistory.findMany({
        where: { ticketId: id },
        include: {
          author: {
            select: { id: true, nome: true, role: true },
          },
        },
        orderBy: { criadoEm: 'asc' },
      });

      return reply.send(history);
    }
  );

  // 5b. Substituir Anexo (PATCH /api/tickets/:id/anexo)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/anexo',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const user = request.user!;
      const bucketName = process.env.GCS_BUCKET_NAME;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Apenas o solicitante pode substituir o anexo
      if (ticket.solicitanteId !== user.id) {
        return reply.status(403).send({ error: 'Apenas o solicitante pode alterar o anexo' });
      }

      if (!bucketName) {
        return reply.status(500).send({ error: 'Configuração de armazenamento ausente (GCS_BUCKET_NAME).' });
      }

      // Parsear arquivo do multipart
      const parts = request.parts();
      let fileBuffer: Buffer | null = null;
      let fileName = '';
      let fileMime = '';
      let fileSize = 0;

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          fileBuffer = Buffer.concat(chunks);
          fileSize = fileBuffer.length;
          fileName = part.filename || '';
          fileMime = part.mimetype || '';
        }
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.status(400).send({ error: 'Nenhum arquivo enviado.' });
      }

      const validation = validateAttachment(fileName, fileMime, fileSize);
      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error });
      }

      // Deletar arquivo antigo do GCS (se existir)
      if (ticket.anexoUrl) {
        const oldPath = extractGcsPath(ticket.anexoUrl, bucketName);
        await deleteFile(bucketName, oldPath);
      }

      // Upload do novo arquivo
      const uuid = randomUUID();
      const filePath = `tickets/${id}/${uuid}-${fileName}`;
      const anexoUrl = await uploadFile(bucketName, filePath, fileBuffer, fileMime);

      const updated = await prisma.ticket.update({
        where: { id },
        data: {
          anexoUrl,
          anexoNome: fileName,
          anexoTipo: fileMime,
          anexoTamanho: fileSize,
        },
      });

      return reply.send({
        id: updated.id,
        anexoUrl: updated.anexoUrl,
        anexoNome: updated.anexoNome,
        anexoTipo: updated.anexoTipo,
        anexoTamanho: updated.anexoTamanho,
        message: 'Anexo substituído com sucesso!',
      });
    }
  );

  // 5c. Remover Anexo (DELETE /api/tickets/:id/anexo)
  fastify.delete<{ Params: { id: string } }>(
    '/api/tickets/:id/anexo',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const user = request.user!;
      const bucketName = process.env.GCS_BUCKET_NAME;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Apenas o solicitante pode remover o anexo
      if (ticket.solicitanteId !== user.id) {
        return reply.status(403).send({ error: 'Apenas o solicitante pode alterar o anexo' });
      }

      if (!ticket.anexoUrl) {
        return reply.status(404).send({ error: 'Este chamado não possui anexo' });
      }

      // Deletar do GCS
      if (bucketName) {
        const filePath = extractGcsPath(ticket.anexoUrl, bucketName);
        await deleteFile(bucketName, filePath);
      }

      // Limpar campos no banco
      await prisma.ticket.update({
        where: { id },
        data: {
          anexoUrl: null,
          anexoNome: null,
          anexoTipo: null,
          anexoTamanho: null,
        },
      });

      return reply.send({ message: 'Anexo removido com sucesso!' });
    }
  );

  // 6. Auto-atribuição de Chamado (Técnico assume)

  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/assign',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['TECNICO', 'GESTOR', 'DIRETOR'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      const user = request.user!;
      // Validar escopo de Unidade e Setor (Gestor/Técnico só assumem chamados da sua área)
      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Bloqueio de chamados fechados (Tarefa 6.5)
      if (ticket.status === 'FECHADO') {
        return reply.status(422).send({ error: 'Não é possível modificar um chamado que já está fechado. Reabra-o primeiro.' });
      }

      if (ticket.status !== 'ABERTO' && ticket.status !== 'REABERTO') {
        return reply.status(400).send({ error: 'Apenas chamados nos status Aberto ou Reaberto podem ser assumidos.' });
      }

      const currentStatus = ticket.status;
      const nextStatus = 'EM_ANDAMENTO';

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          tecnicoId: user.id,
          status: nextStatus,
        },
      });

      // Registrar histórico de atribuição e mudança de status
      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          type: 'ATRIBUICAO',
          content: {
            tecnicoId: user.id,
            tecnicoNome: user.nome,
          },
          authorId: user.id,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          type: 'MUDANCA_STATUS',
          content: {
            from: currentStatus,
            to: nextStatus,
          },
          authorId: user.id,
        },
      });

      await NotificationService.notifyAssigned(updatedTicket).catch(err => fastify.log.error(err));

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        tecnicoId: updatedTicket.tecnicoId,
        message: 'Chamado atribuído a você com sucesso!',
      });
    }
  );

  // 7. Reatribuição de Chamado (Gestor/Diretor)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/reassign',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR', 'DIRETOR', 'ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const parseResult = assignTicketSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { tecnicoId } = parseResult.data;
      if (!tecnicoId) {
        return reply.status(400).send({ error: 'O técnico de destino (tecnicoId) é obrigatório.' });
      }

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (ticket.status === 'FECHADO') {
        return reply.status(422).send({ error: 'Não é possível reatribuir um chamado fechado.' });
      }

      const user = request.user!;
      // Validar escopo de Unidade e Setor (Gestor só reatribui chamados da sua própria área)
      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Validar se o técnico de destino existe e pertence à mesma Unidade
      const tecnicoDestino = await prisma.user.findUnique({ where: { id: tecnicoId } });
      if (!tecnicoDestino || (tecnicoDestino.role !== 'TECNICO' && tecnicoDestino.role !== 'GESTOR')) {
        return reply.status(400).send({ error: 'O usuário destino deve possuir o papel de Técnico ou Gestor.' });
      }

      if (tecnicoDestino.unidadeId !== ticket.unidadeId) {
        return reply.status(400).send({ error: 'O Técnico destino deve pertencer à mesma Unidade do chamado.' });
      }

      if (tecnicoDestino.sectorId !== ticket.sectorId) {
        return reply.status(400).send({ error: 'O destinatário não pertence ao Tipo de Ocorrência do chamado.' });
      }

      const currentStatus = ticket.status;
      let nextStatus = currentStatus;
      // Se estiver Aberto ou Reaberto, atribuição coloca Em Andamento
      if (currentStatus === 'ABERTO' || currentStatus === 'REABERTO') {
        nextStatus = 'EM_ANDAMENTO';
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          tecnicoId,
          status: nextStatus,
        },
      });

      // Registrar reatribuição no histórico
      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          type: 'REATRIBUICAO',
          content: {
            tecnicoId,
            tecnicoNome: tecnicoDestino.nome,
            atribuidoPor: user.nome,
          },
          authorId: user.id,
        },
      });

      if (nextStatus !== currentStatus) {
        await prisma.ticketHistory.create({
          data: {
            ticketId: id,
            type: 'MUDANCA_STATUS',
            content: {
              from: currentStatus,
              to: nextStatus,
            },
            authorId: user.id,
          },
        });
      }

      await NotificationService.notifyReassignment(updatedTicket, tecnicoId).catch(err => fastify.log.error(err));

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        tecnicoId: updatedTicket.tecnicoId,
        message: `Chamado reatribuído com sucesso para ${tecnicoDestino.nome}!`,
      });
    }
  );

  // 8. Transição Geral de Status (Máquina de Estados)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/status',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['TECNICO', 'GESTOR', 'DIRETOR', 'ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const parseResult = ticketStatusSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { status: newStatus, mensagem, solucao } = parseResult.data;

      // Bloquear caminhos que possuam endpoints dedicados
      if (newStatus === 'FECHADO' || newStatus === 'REABERTO') {
        return reply.status(400).send({
          error: 'Utilize os endpoints dedicados para as ações de fechamento (/close, /admin-close) ou reabertura (/reopen).',
        });
      }

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (ticket.status === 'FECHADO') {
        return reply.status(422).send({ error: 'Não é possível alterar o status de um chamado fechado. Reabra-o primeiro.' });
      }

      const user = request.user!;
      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      // Validar transição na máquina de estados (Tarefa 6.1)
      if (!validateTransition(ticket.status, newStatus)) {
        return reply.status(400).send({
          error: `Transição inválida: de ${ticket.status} para ${newStatus}.`,
        });
      }

      // Validar que possui técnico antes de mover para EM_ANDAMENTO
      if (newStatus === 'EM_ANDAMENTO' && !ticket.tecnicoId) {
        return reply.status(400).send({ error: 'O chamado deve possuir um Técnico atribuído para ser colocado Em Andamento.' });
      }

      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: { status: newStatus },
      });

      // Registrar mudança no histórico (com os dados condicionais exigidos na Tarefa 6.3)
      await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          type: 'MUDANCA_STATUS',
          content: {
            from: ticket.status,
            to: newStatus,
            mensagem: newStatus === 'AGUARDANDO' ? mensagem : undefined,
            solucao: newStatus === 'RESOLVIDO' ? solucao : undefined,
          },
          authorId: user.id,
        },
      });

      if (newStatus === 'AGUARDANDO') {
        await NotificationService.notifyAguardando(updatedTicket, mensagem || '').catch(err => fastify.log.error(err));
      } else if (newStatus === 'RESOLVIDO') {
        await NotificationService.notifyResolved(updatedTicket).catch(err => fastify.log.error(err));
      }

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        message: `Status atualizado com sucesso para ${newStatus}!`,
      });
    }
  );

  // 9. Fechar Chamado com Avaliação (Pelo Solicitante)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/close',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const parseResult = satisfactionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nota } = parseResult.data;

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      const user = request.user!;
      // Validar que apenas o Solicitante do chamado pode fechar e avaliar (Tarefa 8.1)
      if (ticket.solicitanteId !== user.id) {
        return reply.status(403).send({ error: 'Apenas o solicitante deste chamado pode fechá-lo e avaliá-lo.' });
      }

      if (ticket.status !== 'RESOLVIDO') {
        return reply.status(400).send({ error: 'Apenas chamados no status Resolvido podem ser fechados pelo solicitante.' });
      }

      const [updatedTicket] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: { status: 'FECHADO' },
        }),
        prisma.satisfaction.create({
          data: {
            ticketId: id,
            nota,
          },
        }),
        prisma.ticketHistory.create({
          data: {
            ticketId: id,
            type: 'FECHAMENTO',
            content: {
              nota,
              fechadoPor: user.nome,
            },
            authorId: user.id,
          },
        }),
      ]);

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        message: 'Chamado fechado e avaliado com sucesso!',
      });
    }
  );

  // 10. Fechamento Administrativo (Gestor/Diretor)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/admin-close',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['GESTOR', 'DIRETOR', 'ADMIN'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      const user = request.user!;
      if (!unitFilter(user, ticket.unidadeId) || !sectorFilter(user, ticket.sectorId)) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      if (ticket.status !== 'RESOLVIDO') {
        return reply.status(400).send({ error: 'Apenas chamados no status Resolvido podem ser fechados.' });
      }

      const { motivo } = (request.body as { motivo?: string }) || {};

      const [updatedTicket] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: { status: 'FECHADO' },
        }),
        prisma.ticketHistory.create({
          data: {
            ticketId: id,
            type: 'FECHAMENTO',
            content: {
              adminClose: true,
              motivo: motivo || 'Fechamento administrativo.',
              fechadoPor: user.nome,
            },
            authorId: user.id,
          },
        }),
      ]);

      // Nota: Tarefa 8.3 garante que chamados fechados administrativamente NÃO geram registro em Satisfaction

      await NotificationService.notifyAdminClose(updatedTicket).catch(err => fastify.log.error(err));

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        message: 'Chamado fechado administrativamente com sucesso.',
      });
    }
  );

  // 11. Reabrir Chamado (Solicitante / Técnico / Gestor / Diretor)
  fastify.patch<{ Params: { id: string } }>(
    '/api/tickets/:id/reopen',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const { motivo } = (request.body as { motivo?: string }) || {};
      if (!motivo || motivo.trim().length < 10) {
        return reply.status(400).send({ error: 'O motivo da reabertura é obrigatório (mínimo 10 caracteres).' });
      }

      const ticket = await prisma.ticket.findUnique({ where: { id } });
      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (ticket.status !== 'FECHADO') {
        return reply.status(400).send({ error: 'Apenas chamados no status Fechado podem ser reabertos.' });
      }

      const user = request.user!;
      const isSolicitante = ticket.solicitanteId === user.id;
      const isUnidadeStaff = ['TECNICO', 'GESTOR', 'DIRETOR'].includes(user.role)
        && unitFilter(user, ticket.unidadeId)
        && sectorFilter(user, ticket.sectorId);
      const isAdmin = user.role === 'ADMIN';

      if (!isSolicitante && !isUnidadeStaff && !isAdmin) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      const [updatedTicket] = await prisma.$transaction([
        prisma.ticket.update({
          where: { id },
          data: { status: 'REABERTO' },
        }),
        prisma.ticketHistory.create({
          data: {
            ticketId: id,
            type: 'REABERTURA',
            content: {
              motivo,
              reabertoPor: user.nome,
            },
            authorId: user.id,
          },
        }),
      ]);

      await NotificationService.notifyReopened(updatedTicket, motivo || '').catch(err => fastify.log.error(err));

      return reply.send({
        id: updatedTicket.id,
        numero: updatedTicket.numero.toString(),
        status: updatedTicket.status,
        message: 'Chamado reaberto com sucesso!',
      });
    }
  );

  // 12. Enviar Mensagem no Chamado
  fastify.post<{ Params: { id: string } }>(
    '/api/tickets/:id/messages',
    { preHandler: [authRequired, requirePasswordChange] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

      const zMessageSchema = z.object({
        content: z.string().min(1).max(2000),
      });

      const parseResult = zMessageSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { content } = parseResult.data;

      const ticket = await prisma.ticket.findUnique({
        where: { id },
      });

      if (!ticket) return reply.status(404).send({ error: 'Chamado não encontrado' });

      if (ticket.status === 'FECHADO') {
        return reply.status(422).send({
          error: "Este chamado está fechado. Para continuar, utilize a opção 'Reabrir Chamado'.",
        });
      }

      const user = request.user!;
      const isSolicitante = ticket.solicitanteId === user.id;
      const isStaff = ['TECNICO', 'GESTOR', 'DIRETOR'].includes(user.role)
        && unitFilter(user, ticket.unidadeId)
        && sectorFilter(user, ticket.sectorId);
      const isAdmin = user.role === 'ADMIN';

      if (!isSolicitante && !isStaff && !isAdmin) {
        return reply.status(404).send({ error: 'Chamado não encontrado' });
      }

      const originalStatus = ticket.status;
      let currentStatus = originalStatus;

      // Se status é AGUARDANDO e autor é Solicitante, transitar para EM_ANDAMENTO
      if (originalStatus === 'AGUARDANDO' && isSolicitante) {
        currentStatus = 'EM_ANDAMENTO';
        await prisma.ticket.update({
          where: { id },
          data: { status: 'EM_ANDAMENTO' },
        });

        // Registrar a mudança de status no histórico
        await prisma.ticketHistory.create({
          data: {
            ticketId: id,
            type: 'MUDANCA_STATUS',
            content: {
              from: 'AGUARDANDO',
              to: 'EM_ANDAMENTO',
              mensagem: 'Retornado para Em Andamento por mensagem do solicitante.',
            },
            authorId: user.id,
          },
        });
      }

      // Registrar mensagem no histórico
      const historyRecord = await prisma.ticketHistory.create({
        data: {
          ticketId: id,
          type: 'MENSAGEM',
          content: {
            mensagem: content,
          },
          authorId: user.id,
        },
      });

      // Disparar notificações
      if (isSolicitante) {
        if (originalStatus === 'AGUARDANDO') {
          // E-mail + Visual no Aguardando
          await NotificationService.notifyMessageInAguardando(ticket.id, content).catch(err => fastify.log.error(err));
        } else if (ticket.tecnicoId) {
          // Notificação apenas visual para o técnico em mensagens normais
          await NotificationService.create(
            ticket.tecnicoId,
            ticket.id,
            'MENSAGEM',
            `Nova mensagem no chamado #${ticket.numero} pelo solicitante`
          ).catch(err => fastify.log.error(err));
        }
      } else {
        // Técnico/Gestor/Diretor/Admin enviou mensagem -> notificar o Solicitante (apenas visual para mensagens comuns)
        await NotificationService.create(
          ticket.solicitanteId,
          ticket.id,
          'MENSAGEM',
          `Nova mensagem no chamado #${ticket.numero} pelo técnico`
        ).catch(err => fastify.log.error(err));
      }

      return reply.status(201).send({
        id: historyRecord.id,
        content: historyRecord.content,
        type: historyRecord.type,
        criadoEm: historyRecord.criadoEm,
        author: {
          id: user.id,
          nome: user.nome,
          role: user.role,
        },
        status: currentStatus,
      });
    }
  );
}
