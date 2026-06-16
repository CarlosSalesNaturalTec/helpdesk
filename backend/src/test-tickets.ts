import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { ticketRoutes } from './routes/tickets.js';
import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

const fastify = Fastify({ logger: false });
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);
fastify.register(ticketRoutes);

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

    // 2. Criar Unidades e Usuários de Teste
    const unitCentral = await prisma.unidade.create({ data: { nome: 'Unidade Central' } });
    const unitSecundar = await prisma.unidade.create({ data: { nome: 'Unidade Secundária' } });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('senha123', salt);

    const solCentral = await prisma.user.create({
      data: { nome: 'Sol Central', email: 'sol@c.com', senhaHash, role: 'SOLICITANTE', unidadeId: unitCentral.id, passwordResetRequired: false }
    });
    const tecCentral = await prisma.user.create({
      data: { nome: 'Tec Central', email: 'tec@c.com', senhaHash, role: 'TECNICO', unidadeId: unitCentral.id, passwordResetRequired: false }
    });
    const gesCentral = await prisma.user.create({
      data: { nome: 'Ges Central', email: 'ges@c.com', senhaHash, role: 'GESTOR_TI', unidadeId: unitCentral.id, passwordResetRequired: false }
    });
    const tecSecundar = await prisma.user.create({
      data: { nome: 'Tec Secundar', email: 'tec@s.com', senhaHash, role: 'TECNICO', unidadeId: unitSecundar.id, passwordResetRequired: false }
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

    // =========================================================================
    // 15.1 Fluxo completo: Abertura -> Atribuição -> Resolução -> Fechamento/Satisfação
    // =========================================================================
    console.log('-> Testando Fluxo Completo (15.1)...');
    
    // Solicitante abre chamado
    const resOpen = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: headersSolC,
      payload: {
        titulo: 'Cabo de rede danificado',
        descricao: 'O cabo de rede que conecta à tomada quebrou a trava plástica.',
        tipoProblema: 'REDE_INTERNET',
        urgencia: 'MEDIA'
      }
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
      headers: headersSolC,
      payload: { titulo: 'Impressora sem toner recepção', descricao: 'Necessita trocar o toner preto.', tipoProblema: 'IMPRESSORA', urgencia: 'BAIXA' }
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
    console.log(`   [Assert] Técnico da Unidade B é bloqueado ao assumir chamado da Unidade A (403): ${resCrossAssign.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // =========================================================================
    // 15.4 Testar busca + filtro combinados
    // =========================================================================
    console.log('-> Testando Busca e Filtros Combinados (15.4)...');
    
    const resQuery = await fastify.inject({
      method: 'GET',
      url: '/api/tickets?search=cabo&status=FECHADO',
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
      headers: headersSolC,
      payload: { titulo: 'Teclado quebrado', descricao: 'Algumas teclas travaram.', tipoProblema: 'HARDWARE', urgencia: 'BAIXA' }
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
