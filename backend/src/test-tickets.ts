import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { ticketRoutes } from './routes/tickets.js';
import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

const fastify = Fastify({ logger: false });
// POST /api/tickets é multipart-only (o anexo é opcional, mas o parser não): sem este
// plugin, request.parts() falha e toda criação volta em erro.
fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);
fastify.register(ticketRoutes);

const MULTIPART_BOUNDARY = '----helpdeskTestBoundary';

/** Monta um corpo multipart/form-data só com campos de texto. */
function multipartBody(fields: Record<string, string | number>) {
  const parts = Object.entries(fields).map(
    ([k, v]) =>
      `--${MULTIPART_BOUNDARY}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`
  );
  return {
    payload: parts.join('') + `--${MULTIPART_BOUNDARY}--\r\n`,
    contentType: `multipart/form-data; boundary=${MULTIPART_BOUNDARY}`,
  };
}

async function runTests() {
  console.log('\n==================================================');
  console.log('INICIANDO TESTES INTEGRADOS DOS TICKETS (FASTIFY INJECT)');
  console.log('==================================================\n');

  try {
    // 1. Limpar banco para o teste
    console.log('-> Resetando dados de teste no banco...');
    await prisma.notification.deleteMany({});
    await prisma.satisfaction.deleteMany({});
    await prisma.ticketHistory.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.unidade.deleteMany({});
    await prisma.problemType.deleteMany({});
    await prisma.sector.deleteMany({});

    // 2. Criar Unidades, Tipos de Ocorrência, Tipos de Problema e Usuários de Teste
    const unitCentral = await prisma.unidade.create({ data: { nome: 'Unidade Central' } });
    const unitSecundar = await prisma.unidade.create({ data: { nome: 'Unidade Secundária' } });

    // Dois Tipos de Ocorrência: o segundo existe para exercitar o isolamento por área —
    // é o eixo das sugestões de Razão da Pendência.
    const sectorTec = await prisma.sector.create({ data: { nome: 'Tecnologia' } });
    const sectorMan = await prisma.sector.create({ data: { nome: 'Manutenção' } });

    const ptRede = await prisma.problemType.create({
      data: { nome: 'REDE_INTERNET', sectorId: sectorTec.id, slaMinutes: 240 }
    });
    const ptImpressora = await prisma.problemType.create({
      data: { nome: 'IMPRESSORA', sectorId: sectorTec.id, slaMinutes: 480 }
    });
    const ptHardware = await prisma.problemType.create({
      data: { nome: 'HARDWARE', sectorId: sectorTec.id, slaMinutes: 480 }
    });
    const ptHidraulica = await prisma.problemType.create({
      data: { nome: 'HIDRAULICA', sectorId: sectorMan.id, slaMinutes: 480 }
    });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('senha123', salt);

    const solCentral = await prisma.user.create({
      data: { nome: 'Sol Central', email: 'sol@c.com', senhaHash, role: 'SOLICITANTE', unidadeId: unitCentral.id, passwordResetRequired: false }
    });
    const tecCentral = await prisma.user.create({
      data: { nome: 'Tec Central', email: 'tec@c.com', senhaHash, role: 'TECNICO', unidadeId: unitCentral.id, sectorId: sectorTec.id, passwordResetRequired: false }
    });
    const gesCentral = await prisma.user.create({
      data: { nome: 'Ges Central', email: 'ges@c.com', senhaHash, role: 'GESTOR', unidadeId: unitCentral.id, sectorId: sectorTec.id, passwordResetRequired: false }
    });
    const tecSecundar = await prisma.user.create({
      data: { nome: 'Tec Secundar', email: 'tec@s.com', senhaHash, role: 'TECNICO', unidadeId: unitSecundar.id, sectorId: sectorTec.id, passwordResetRequired: false }
    });
    // Técnico da MESMA Unidade, em OUTRO Tipo de Ocorrência: isola as razões por área.
    const tecCentralMan = await prisma.user.create({
      data: { nome: 'Tec Central Manut', email: 'tecman@c.com', senhaHash, role: 'TECNICO', unidadeId: unitCentral.id, sectorId: sectorMan.id, passwordResetRequired: false }
    });
    // Diretor: escopado por Unidade, mas NÃO por área.
    await prisma.user.create({
      data: { nome: 'Dir Central', email: 'dir@c.com', senhaHash, role: 'DIRETOR', unidadeId: unitCentral.id, passwordResetRequired: false }
    });

    // Login dos usuários para obter tokens JWT
    const getHeaders = async (email: string) => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, senha: 'senha123' }
      });
      const token = JSON.parse(res.body).token;
      return { authorization: `Bearer ${token}` };
    };

    const headersSolC = await getHeaders('sol@c.com');
    const headersTecC = await getHeaders('tec@c.com');
    const headersGesC = await getHeaders('ges@c.com');
    const headersTecS = await getHeaders('tec@s.com');
    const headersTecManC = await getHeaders('tecman@c.com');
    const headersDirC = await getHeaders('dir@c.com');

    // Corpos de criação. O título não é enviado: o servidor o deriva de
    // `Tipo de Problema — Local`, então é o `local` que identifica cada chamado.
    const mpTicket1 = multipartBody({ local: 'Sala de Reuniões', descricao: 'O cabo de rede que conecta à tomada quebrou a trava plástica.', sectorId: sectorTec.id, problemTypeId: ptRede.id, urgencia: 'MEDIA' });
    const mpTicket2 = multipartBody({ local: 'Recepção', descricao: 'Necessita trocar o toner preto.', sectorId: sectorTec.id, problemTypeId: ptImpressora.id, urgencia: 'BAIXA' });
    const mpTicket3 = multipartBody({ local: 'Almoxarifado', descricao: 'Algumas teclas travaram.', sectorId: sectorTec.id, problemTypeId: ptHardware.id, urgencia: 'BAIXA' });
    const mpTicketPend = multipartBody({ local: 'Laboratório', descricao: 'O switch do laboratório reinicia sozinho.', sectorId: sectorTec.id, problemTypeId: ptRede.id, urgencia: 'ALTA' });

    // =========================================================================
    // 15.1 Fluxo completo: Abertura -> Atribuição -> Resolução -> Fechamento/Satisfação
    // =========================================================================
    console.log('-> Testando Fluxo Completo (15.1)...');
    
    // Solicitante abre chamado
    const resOpen = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: { ...headersSolC, 'content-type': mpTicket1.contentType },
      payload: mpTicket1.payload
    });
    console.log(`   [Assert] Criação de chamado retorna 201: ${resOpen.statusCode === 201 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const ticket1 = JSON.parse(resOpen.body);

    // Técnico assume chamado
    const resAssign = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket1.id}/assign`,
      headers: headersTecC
    });
    console.log(`   [Assert] Técnico assume e retorna 200: ${resAssign.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const ticket1Assigned = JSON.parse(resAssign.body);
    console.log(`   [Assert] Status mudou para EM_ANDAMENTO: ${ticket1Assigned.status === 'EM_ANDAMENTO' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Técnico resolve chamado
    const resResolve = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket1.id}/status`,
      headers: headersTecC,
      payload: {
        status: 'RESOLVIDO',
        solucao: 'Crimpado novo conector RJ-45 no cabo de rede.'
      }
    });
    console.log(`   [Assert] Técnico resolve e retorna 200: ${resResolve.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Solicitante avalia e fecha
    const resClose = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket1.id}/close`,
      headers: headersSolC,
      payload: { nota: 5 }
    });
    console.log(`   [Assert] Solicitante avalia e fecha: ${resClose.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    
    const dbSatisfaction = await prisma.satisfaction.findFirst({ where: { ticketId: ticket1.id } });
    console.log(`   [Assert] Avaliação registrada no banco (nota 5): ${dbSatisfaction?.nota === 5 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.2 Fluxo com desvios: Aguardando -> Retorno -> Fechamento -> Reabertura
    // =========================================================================
    console.log('-> Testando Fluxo com Desvios e Reabertura (15.2)...');

    // Abre novo chamado
    const resOpen2 = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: { ...headersSolC, 'content-type': mpTicket2.contentType },
      payload: mpTicket2.payload
    });
    const ticket2 = JSON.parse(resOpen2.body);

    // Assume
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticket2.id}/assign`, headers: headersTecC });

    // Coloca em AGUARDANDO
    const resWait = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket2.id}/status`,
      headers: headersTecC,
      payload: { status: 'AGUARDANDO', mensagem: 'Aguardando entrega do almoxarifado.' }
    });
    console.log(`   [Assert] Transição para AGUARDANDO exige mensagem e retorna 200: ${resWait.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Tentar retomar (retorna para EM_ANDAMENTO)
    const resResume = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket2.id}/status`,
      headers: headersTecC,
      payload: { status: 'EM_ANDAMENTO' }
    });
    console.log(`   [Assert] Retorno para EM_ANDAMENTO retorna 200: ${resResume.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Resolve e Fecha
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticket2.id}/status`, headers: headersTecC, payload: { status: 'RESOLVIDO', solucao: 'Toner trocado.' } });
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticket2.id}/close`, headers: headersSolC, payload: { nota: 4 } });

    // Reabre chamado fechado
    const resReopen = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket2.id}/reopen`,
      headers: headersSolC,
      payload: { motivo: 'Impressora voltou a dar erro de toner vazio.' }
    });
    console.log(`   [Assert] Reabertura de chamado fechado retorna 200: ${resReopen.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const ticket2Reopened = JSON.parse(resReopen.body);
    console.log(`   [Assert] Status do chamado reaberto é REABERTO: ${ticket2Reopened.status === 'REABERTO' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.3 Testar isolamento: Técnico Unidade A não assume da Unidade B
    // =========================================================================
    console.log('-> Testando Isolamento de Chamados entre Unidades (15.3)...');

    // Técnico da Unidade Secundária tenta assumir chamado da Unidade Central
    const resCrossAssign = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket2.id}/assign`,
      headers: headersTecS
    });
    console.log(`   [Assert] Técnico da Unidade B é bloqueado ao assumir chamado da Unidade A (404): ${resCrossAssign.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.4 Testar busca + filtro combinados
    // =========================================================================
    console.log('-> Testando Busca e Filtros Combinados (15.4)...');
    
    const resQuery = await fastify.inject({
      method: 'GET',
      url: '/api/tickets?search=Sala de Reuniões&status=FECHADO',
      headers: headersSolC
    });
    const queryData = JSON.parse(resQuery.body);
    console.log(`   [Assert] Filtro combinou search + status: ${queryData.total === 1 && queryData.data[0].id === ticket1.id ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.5 Testar fechamento administrativo vs fechamento por solicitante
    // =========================================================================
    console.log('-> Testando Fechamento Administrativo (15.5)...');

    // Cria novo chamado e resolve
    const resOpen3 = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: { ...headersSolC, 'content-type': mpTicket3.contentType },
      payload: mpTicket3.payload
    });
    const ticket3 = JSON.parse(resOpen3.body);
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticket3.id}/assign`, headers: headersTecC });
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticket3.id}/status`, headers: headersTecC, payload: { status: 'RESOLVIDO', solucao: 'Substituído.' } });

    // Gestor fecha administrativamente
    const resAdminClose = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket3.id}/admin-close`,
      headers: headersGesC,
      payload: { motivo: 'Sem retorno do usuário.' }
    });
    console.log(`   [Assert] Fechamento administrativo retorna 200: ${resAdminClose.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    
    const satisfactionCount = await prisma.satisfaction.count({ where: { ticketId: ticket3.id } });
    console.log(`   [Assert] Fechamento administrativo NÃO gerou Satisfaction no banco: ${satisfactionCount === 0 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.7 Razões de Pendência: normalização e escopo de GET /razoes-pendencia
    // =========================================================================
    console.log('-> Testando Razões de Pendência e seu escopo (15.7)...');

    // Chamado da Unidade Central / Tecnologia, colocado em Pendente com uma razão nova.
    const resOpenPend = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: { ...headersSolC, 'content-type': mpTicketPend.contentType },
      payload: mpTicketPend.payload
    });
    const ticketPend = JSON.parse(resOpenPend.body);
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticketPend.id}/assign`, headers: headersTecC });

    // Transição sem razão: recusada pelo schema (mínimo 2 caracteres).
    const resSemRazao = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticketPend.id}/status`,
      headers: headersTecC,
      payload: { status: 'AGUARDANDO' }
    });
    console.log(`   [Assert] Pendência sem razão é recusada (400): ${resSemRazao.statusCode === 400 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Espaços internos repetidos são colapsados na gravação.
    await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticketPend.id}/status`,
      headers: headersTecC,
      payload: { status: 'AGUARDANDO', mensagem: 'Aguardando   laudo   técnico' }
    });
    const pendDb = await prisma.ticket.findUnique({ where: { id: ticketPend.id } });
    console.log(`   [Assert] Espaços internos colapsados na coluna: ${pendDb?.pendenciaMotivo === 'Aguardando laudo técnico' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // A grafia já registrada é reaproveitada, ignorando caixa e espaços.
    await fastify.inject({ method: 'PATCH', url: `/api/tickets/${ticketPend.id}/status`, headers: headersTecC, payload: { status: 'EM_ANDAMENTO' } });
    const pendRetomado = await prisma.ticket.findUnique({ where: { id: ticketPend.id } });
    console.log(`   [Assert] Razão zerada na retomada: ${pendRetomado?.pendenciaMotivo === null ? 'Passou ✓' : 'FALHOU ✗'}`);

    await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticketPend.id}/status`,
      headers: headersTecC,
      payload: { status: 'AGUARDANDO', mensagem: '  aguardando   LAUDO técnico  ' }
    });
    const pendReuso = await prisma.ticket.findUnique({ where: { id: ticketPend.id } });
    console.log(`   [Assert] Grafia existente reaproveitada: ${pendReuso?.pendenciaMotivo === 'Aguardando laudo técnico' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Chamado da Unidade Central / MANUTENÇÃO, com razão própria.
    const solMan = await prisma.user.findUnique({ where: { email: 'sol@c.com' } });
    const ticketMan = await prisma.ticket.create({
      data: {
        titulo: 'HIDRAULICA — Banheiro',
        descricao: 'Vazamento na torneira do banheiro social.',
        local: 'Banheiro',
        urgencia: 'MEDIA',
        status: 'AGUARDANDO',
        pendenciaMotivo: 'Aguardando verba de obra',
        solicitanteId: solMan!.id,
        tecnicoId: tecCentralMan.id,
        unidadeId: unitCentral.id,
        sectorId: sectorMan.id,
        problemTypeId: ptHidraulica.id,
      }
    });
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticketMan.id,
        type: 'MUDANCA_STATUS',
        content: { from: 'EM_ANDAMENTO', to: 'AGUARDANDO', mensagem: 'Aguardando verba de obra' },
        authorId: tecCentralMan.id,
      }
    });

    // Chamado da Unidade SECUNDÁRIA / Tecnologia, com razão própria.
    const solS = await prisma.user.create({
      data: { nome: 'Sol Secundar', email: 'sol@s.com', senhaHash, role: 'SOLICITANTE', unidadeId: unitSecundar.id, passwordResetRequired: false }
    });
    const ticketSec = await prisma.ticket.create({
      data: {
        titulo: 'REDE_INTERNET — Secretaria',
        descricao: 'A rede da secretaria está intermitente desde ontem.',
        local: 'Secretaria',
        urgencia: 'MEDIA',
        status: 'AGUARDANDO',
        pendenciaMotivo: 'Aguardando visita da operadora',
        solicitanteId: solS.id,
        tecnicoId: tecSecundar.id,
        unidadeId: unitSecundar.id,
        sectorId: sectorTec.id,
        problemTypeId: ptRede.id,
      }
    });
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticketSec.id,
        type: 'MUDANCA_STATUS',
        content: { from: 'EM_ANDAMENTO', to: 'AGUARDANDO', mensagem: 'Aguardando visita da operadora' },
        authorId: tecSecundar.id,
      }
    });

    const razoes = async (headers: Record<string, string>, query = '') => {
      const res = await fastify.inject({ method: 'GET', url: `/api/tickets/razoes-pendencia${query}`, headers });
      return { statusCode: res.statusCode, body: JSON.parse(res.body) as string[] };
    };

    // A rota fixa precisa casar antes de /:id — se o Fastify casasse :id = "razoes-pendencia",
    // viria 400 ("ID inválido") em vez de 200 com a lista.
    const rTec = await razoes(headersTecC);
    console.log(`   [Assert] GET /razoes-pendencia responde 200 (não casa :id): ${rTec.statusCode === 200 && Array.isArray(rTec.body) ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico de Tecnologia vê a razão da própria área: ${rTec.body.includes('Aguardando laudo técnico') ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico de Tecnologia NÃO vê razão de Manutenção: ${!rTec.body.includes('Aguardando verba de obra') ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico NÃO vê razão de outra Unidade: ${!rTec.body.includes('Aguardando visita da operadora') ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Lista sem repetição: ${new Set(rTec.body).size === rTec.body.length ? 'Passou ✓' : 'FALHOU ✗'}`);

    const rTecMan = await razoes(headersTecManC);
    console.log(`   [Assert] Técnico de Manutenção vê só a razão da sua área: ${rTecMan.body.includes('Aguardando verba de obra') && !rTecMan.body.includes('Aguardando laudo técnico') ? 'Passou ✓' : 'FALHOU ✗'}`);

    const rGes = await razoes(headersGesC);
    console.log(`   [Assert] Gestor é escopado por área como o Técnico: ${rGes.body.includes('Aguardando laudo técnico') && !rGes.body.includes('Aguardando verba de obra') ? 'Passou ✓' : 'FALHOU ✗'}`);

    const rDir = await razoes(headersDirC);
    console.log(`   [Assert] Diretor vê as áreas da própria Unidade: ${rDir.body.includes('Aguardando laudo técnico') && rDir.body.includes('Aguardando verba de obra') ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Diretor NÃO vê razão de outra Unidade: ${!rDir.body.includes('Aguardando visita da operadora') ? 'Passou ✓' : 'FALHOU ✗'}`);

    // O Solicitante não tem escopo de área: scopeWhere() devolveria {} e exporia a rede toda.
    const rSol = await razoes(headersSolC);
    console.log(`   [Assert] Solicitante é recusado (403): ${rSol.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Técnico não estreita por sectorId: o parâmetro é só do Admin.
    const rTecNarrow = await razoes(headersTecC, `?sectorId=${sectorMan.id}`);
    console.log(`   [Assert] ?sectorId não amplia o escopo do Técnico: ${!rTecNarrow.body.includes('Aguardando verba de obra') ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Admin vê todas as áreas e Unidades, e pode estreitar.
    const adminU = await prisma.user.create({
      data: { nome: 'Admin Geral', email: 'adm@g.com', senhaHash, role: 'ADMIN', unidadeId: unitCentral.id, passwordResetRequired: false }
    });
    void adminU;
    const headersAdm = await getHeaders('adm@g.com');
    const rAdm = await razoes(headersAdm);
    console.log(`   [Assert] Admin vê razões de todas as áreas e Unidades: ${rAdm.body.includes('Aguardando laudo técnico') && rAdm.body.includes('Aguardando verba de obra') && rAdm.body.includes('Aguardando visita da operadora') ? 'Passou ✓' : 'FALHOU ✗'}`);
    const rAdmNarrow = await razoes(headersAdm, `?sectorId=${sectorMan.id}`);
    console.log(`   [Assert] Admin estreita com ?sectorId: ${rAdmNarrow.body.length === 1 && rAdmNarrow.body[0] === 'Aguardando verba de obra' ? 'Passou ✓' : 'FALHOU ✗'}`);

    void ticketMan;

    // =========================================================================
    // 15.6 Testar bloqueio de ações em chamado Fechado
    // =========================================================================
    console.log('-> Testando Bloqueio de Ações em Chamado Fechado (15.6)...');

    const resBlockedAction = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket1.id}/assign`,
      headers: headersTecC
    });
    console.log(`   [Assert] Alteração em chamado Fechado sem reabrir é rejeitada (422): ${resBlockedAction.statusCode === 422 ? 'Passou ✓' : 'FALHOU ✗'}`);

    console.log('\n==================================================');
    console.log('TESTES DO CICLO DE VIDA CONCLUÍDOS COM SUCESSO!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('Erro durante execução dos testes integrados de tickets:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
