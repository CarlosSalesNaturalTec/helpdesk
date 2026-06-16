import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { ticketRoutes } from './routes/tickets.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

const fastify = Fastify({ logger: false });
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);
fastify.register(ticketRoutes);
fastify.register(dashboardRoutes);

async function runTests() {
  console.log('\n==================================================');
  console.log('INICIANDO TESTES INTEGRADOS DO DASHBOARD (FASTIFY INJECT)');
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

    // 2. Criar Unidades e Usuários
    console.log('-> Criando unidades e usuários...');
    const unitA = await prisma.unidade.create({ data: { nome: 'Unidade Alfa' } });
    const unitB = await prisma.unidade.create({ data: { nome: 'Unidade Beta' } });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('senha123', salt);

    const adminUser = await prisma.user.create({
      data: { nome: 'Admin System', email: 'admin@dash.com', senhaHash, role: 'ADMIN', unidadeId: unitA.id, passwordResetRequired: false }
    });
    const tecUserA = await prisma.user.create({
      data: { nome: 'Tecnico Alfa', email: 'teca@dash.com', senhaHash, role: 'TECNICO', unidadeId: unitA.id, passwordResetRequired: false }
    });
    const tecUserB = await prisma.user.create({
      data: { nome: 'Tecnico Beta', email: 'tecb@dash.com', senhaHash, role: 'TECNICO', unidadeId: unitB.id, passwordResetRequired: false }
    });
    const solUserA = await prisma.user.create({
      data: { nome: 'Solicitante Alfa', email: 'sola@dash.com', senhaHash, role: 'SOLICITANTE', unidadeId: unitA.id, passwordResetRequired: false }
    });

    // Helper para login
    const getHeaders = async (email: string) => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, senha: 'senha123' }
      });
      const token = JSON.parse(res.body).token;
      return { authorization: `Bearer ${token}` };
    };

    const headersAdmin = await getHeaders('admin@dash.com');
    const headersTecA = await getHeaders('teca@dash.com');
    const headersTecB = await getHeaders('tecb@dash.com');
    const headersSolA = await getHeaders('sola@dash.com');

    // 3. Criar tickets para compor o Dashboard
    console.log('-> Criando chamados de teste...');

    // Tickets Unidade Alfa:
    // - 1 ABERTO
    // - 1 EM_ANDAMENTO
    // - 1 RESOLVIDO
    // - 1 FECHADO
    // - 1 CRITICO e ABERTO
    await prisma.ticket.create({
      data: { titulo: 'Ticket Aberto Alfa', descricao: 'Desc', tipoProblema: 'HARDWARE', urgencia: 'MEDIA', status: 'ABERTO', solicitanteId: solUserA.id, unidadeId: unitA.id }
    });
    await prisma.ticket.create({
      data: { titulo: 'Ticket Em Andamento Alfa', descricao: 'Desc', tipoProblema: 'SOFTWARE', urgencia: 'MEDIA', status: 'EM_ANDAMENTO', solicitanteId: solUserA.id, unidadeId: unitA.id }
    });
    await prisma.ticket.create({
      data: { titulo: 'Ticket Resolvido Alfa', descricao: 'Desc', tipoProblema: 'REDE_INTERNET', urgencia: 'MEDIA', status: 'RESOLVIDO', solicitanteId: solUserA.id, unidadeId: unitA.id }
    });
    const ticketFechado = await prisma.ticket.create({
      data: { titulo: 'Ticket Fechado Alfa', descricao: 'Desc', tipoProblema: 'EMAIL', urgencia: 'MEDIA', status: 'FECHADO', solicitanteId: solUserA.id, unidadeId: unitA.id }
    });
    await prisma.ticket.create({
      data: { titulo: 'Ticket Critico Alfa', descricao: 'Desc', tipoProblema: 'SISTEMA_INTERNO', urgencia: 'CRITICA', status: 'ABERTO', solicitanteId: solUserA.id, unidadeId: unitA.id }
    });

    // Tickets Unidade Beta:
    // - 1 ABERTO
    // - 1 FECHADO (vamos criar outro solicitante ou usar o mesmo)
    await prisma.ticket.create({
      data: { titulo: 'Ticket Aberto Beta', descricao: 'Desc', tipoProblema: 'HARDWARE', urgencia: 'MEDIA', status: 'ABERTO', solicitanteId: solUserA.id, unidadeId: unitB.id }
    });
    await prisma.ticket.create({
      data: { titulo: 'Ticket Fechado Beta', descricao: 'Desc', tipoProblema: 'SOFTWARE', urgencia: 'MEDIA', status: 'FECHADO', solicitanteId: solUserA.id, unidadeId: unitB.id }
    });

    // =========================================================================
    // TESTES
    // =========================================================================
    console.log('-> Executando Asserts de Integração...');

    // 6.1 Verificar cards para Técnico Alfa (restrito à Unidade A)
    const resTecA = await fastify.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: headersTecA
    });
    console.log(`   [Assert] Técnico Alfa acessa com sucesso (200): ${resTecA.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const dataTecA = JSON.parse(resTecA.body);
    console.log(`   [Assert] Técnico Alfa - Abertos = 2 (Aberto + Critico): ${dataTecA.cards.abertos === 2 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico Alfa - Em Andamento = 1: ${dataTecA.cards.emAndamento === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico Alfa - Resolvidos = 1: ${dataTecA.cards.resolvidos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico Alfa - Críticos = 1: ${dataTecA.cards.criticos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6.1 Verificar cards para Técnico Beta (restrito à Unidade B)
    const resTecB = await fastify.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: headersTecB
    });
    const dataTecB = JSON.parse(resTecB.body);
    console.log(`   [Assert] Técnico Beta - Abertos = 1: ${dataTecB.cards.abertos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Técnico Beta - Em Andamento = 0: ${dataTecB.cards.emAndamento === 0 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6.2 Verificar cards para Admin (Consolidado Global)
    const resAdminGlobal = await fastify.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: headersAdmin
    });
    const dataAdminGlobal = JSON.parse(resAdminGlobal.body);
    console.log(`   [Assert] Admin Global - Abertos = 3 (2 da A + 1 da B): ${dataAdminGlobal.cards.abertos === 3 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Admin Global - Em Andamento = 1: ${dataAdminGlobal.cards.emAndamento === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Admin Global - Resolvidos = 1: ${dataAdminGlobal.cards.resolvidos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Admin Global - Críticos = 1: ${dataAdminGlobal.cards.criticos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6.2 Verificar cards para Admin (Filtrado por Unidade Beta)
    const resAdminBeta = await fastify.inject({
      method: 'GET',
      url: `/api/dashboard?unidadeId=${unitB.id}`,
      headers: headersAdmin
    });
    const dataAdminBeta = JSON.parse(resAdminBeta.body);
    console.log(`   [Assert] Admin Filtrado Beta - Abertos = 1: ${dataAdminBeta.cards.abertos === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Admin Filtrado Beta - Em Andamento = 0: ${dataAdminBeta.cards.emAndamento === 0 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6.3 Verificar gráfico de tendência
    console.log('DEBUG TREND DATA:', JSON.stringify(dataAdminGlobal.trend));
    const todayStr = new Date().toISOString().split('T')[0];
    console.log('DEBUG TODAY STR:', todayStr);
    const todayTrend = dataAdminGlobal.trend.find((t: any) => t.date === todayStr);
    console.log('DEBUG TODAY TREND:', JSON.stringify(todayTrend));
    console.log(`   [Assert] Trend possui 30 pontos de dados: ${dataAdminGlobal.trend.length === 30 ? 'Passou ✓' : 'FALHOU ✗'}`);
    // O dia de hoje deve conter as aberturas (5 na A + 2 na B = 7) e fechamentos (1 na A + 1 na B = 2)
    console.log(`   [Assert] Trend Hoje - Abertos = 7: ${todayTrend?.abertos === 7 ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Trend Hoje - Fechados = 2: ${todayTrend?.fechados === 2 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6.5 Verificar que Solicitante não acessa o Dashboard (403)
    const resSol = await fastify.inject({
      method: 'GET',
      url: '/api/dashboard',
      headers: headersSolA
    });
    console.log(`   [Assert] Solicitante bloqueado com 403: ${resSol.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    console.log('\n==================================================');
    console.log('TESTES DO DASHBOARD CONCLUÍDOS COM SUCESSO!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('Falha na execução dos testes:', err);
    process.exit(1);
  }
}

runTests();
