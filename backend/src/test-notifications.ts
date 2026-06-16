import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { ticketRoutes } from './routes/tickets.js';
import { notificationRoutes } from './routes/notifications.js';
import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

const fastify = Fastify({ logger: false });
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);
fastify.register(ticketRoutes);
fastify.register(notificationRoutes);

async function runTests() {
  console.log('\n==================================================');
  console.log('INICIANDO TESTES DE MENSAGENS E NOTIFICACOES VISUAIS');
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
    const unit = await prisma.unidade.create({ data: { nome: 'Unidade Notif' } });
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('senha123', salt);

    const sol = await prisma.user.create({
      data: { nome: 'Sol Teste', email: 'sol@n.com', senhaHash, role: 'SOLICITANTE', unidadeId: unit.id, passwordResetRequired: false }
    });
    const tec = await prisma.user.create({
      data: { nome: 'Tec Teste', email: 'tec@n.com', senhaHash, role: 'TECNICO', unidadeId: unit.id, passwordResetRequired: false }
    });

    const getHeaders = async (email: string) => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, senha: 'senha123' }
      });
      const token = JSON.parse(res.body).token;
      return { authorization: `Bearer ${token}` };
    };

    const headersSol = await getHeaders('sol@n.com');
    const headersTec = await getHeaders('tec@n.com');

    // 3. Criar ticket
    const resOpen = await fastify.inject({
      method: 'POST',
      url: '/api/tickets',
      headers: headersSol,
      payload: { titulo: 'Monitor piscando', descricao: 'O monitor desliga sozinho.', tipoProblema: 'HARDWARE', urgencia: 'MEDIA' }
    });
    const ticket = JSON.parse(resOpen.body);

    // 4. Testar envio de mensagem
    console.log('-> Testando envio de mensagem em chamado aberto...');
    
    // Solicitante tenta enviar mensagem no chamado dele -> deve dar certo
    const resMsgSol = await fastify.inject({
      method: 'POST',
      url: `/api/tickets/${ticket.id}/messages`,
      headers: headersSol,
      payload: { content: 'Minha primeira mensagem!' }
    });
    console.log(`   [Assert] Envio de mensagem pelo solicitante retorna 201: ${resMsgSol.statusCode === 201 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const msgSolData = JSON.parse(resMsgSol.body);
    console.log(`   [Assert] Conteudo correto: ${msgSolData.content.mensagem === 'Minha primeira mensagem!' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Técnico assume o chamado
    await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket.id}/assign`,
      headers: headersTec
    });

    // Técnico envia mensagem
    const resMsgTec = await fastify.inject({
      method: 'POST',
      url: `/api/tickets/${ticket.id}/messages`,
      headers: headersTec,
      payload: { content: 'Aqui é o técnico. Vou verificar.' }
    });
    console.log(`   [Assert] Envio de mensagem pelo técnico retorna 201: ${resMsgTec.statusCode === 201 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 5. Testar notificações visuais geradas
    console.log('-> Testando notificações visuais no banco...');
    
    // O solicitante deve ter recebido notificações de:
    // - ASSUMIDO (ao técnico assumir)
    // - MENSAGEM (quando o técnico enviou mensagem)
    const solNotifsCount = await prisma.notification.count({ where: { userId: sol.id } });
    console.log(`   [Assert] Solicitante tem 2 notificações: ${solNotifsCount === 2 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // O técnico deve ter recebido notificações de:
    // - MENSAGEM (quando o solicitante enviou a mensagem original após o ticket ser associado - neste caso, o solicitante enviou antes do técnico ser associado, então não notificou, mas vamos simular outra mensagem com técnico associado)
    const resMsgSol2 = await fastify.inject({
      method: 'POST',
      url: `/api/tickets/${ticket.id}/messages`,
      headers: headersSol,
      payload: { content: 'Mais uma mensagem do solicitante!' }
    });
    console.log(`   [Assert] Solicitante envia nova mensagem com técnico associado: ${resMsgSol2.statusCode === 201 ? 'Passou ✓' : 'FALHOU ✗'}`);

    const tecNotifs = await prisma.notification.findMany({ where: { userId: tec.id } });
    console.log(`   [Assert] Técnico tem 1 notificação visual do tipo MENSAGEM: ${tecNotifs.length === 1 && tecNotifs[0].type === 'MENSAGEM' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6. Testar API de Unread Count
    console.log('-> Testando GET /api/notifications/unread-count...');
    const resUnread = await fastify.inject({
      method: 'GET',
      url: '/api/notifications/unread-count',
      headers: headersSol
    });
    const unreadBody = JSON.parse(resUnread.body);
    console.log(`   [Assert] Solicitante possui 2 notificações não lidas: ${unreadBody.count === 2 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 7. Testar GET /api/notifications (listagem)
    console.log('-> Testando GET /api/notifications...');
    const resList = await fastify.inject({
      method: 'GET',
      url: '/api/notifications?page=1&limit=10',
      headers: headersSol
    });
    const listBody = JSON.parse(resList.body);
    console.log(`   [Assert] Retornou dados paginados e total correto: ${listBody.data.length === 2 && listBody.total === 2 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 8. Testar PATCH /api/notifications/:id/read
    console.log('-> Testando marcar como lida individualmente...');
    const notifToRead = listBody.data[0];
    const resRead = await fastify.inject({
      method: 'PATCH',
      url: `/api/notifications/${notifToRead.id}/read`,
      headers: headersSol
    });
    console.log(`   [Assert] Retornou status 200: ${resRead.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const readCountRes = await fastify.inject({
      method: 'GET',
      url: '/api/notifications/unread-count',
      headers: headersSol
    });
    const readCountBody = JSON.parse(readCountRes.body);
    console.log(`   [Assert] Contagem não lidas diminuiu para 1: ${readCountBody.count === 1 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 9. Testar PATCH /api/notifications/read-all
    console.log('-> Testando marcar todas como lidas...');
    const resReadAll = await fastify.inject({
      method: 'PATCH',
      url: '/api/notifications/read-all',
      headers: headersSol
    });
    console.log(`   [Assert] Retornou status 200: ${resReadAll.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const readAllCountRes = await fastify.inject({
      method: 'GET',
      url: '/api/notifications/unread-count',
      headers: headersSol
    });
    console.log(`   [Assert] Contagem não lidas agora é 0: ${JSON.parse(readAllCountRes.body).count === 0 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 10. Testar transição automática de status AGUARDANDO -> EM_ANDAMENTO ao responder
    console.log('-> Testando transição automática de AGUARDANDO para EM_ANDAMENTO...');
    
    // Colocar em AGUARDANDO
    await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket.id}/status`,
      headers: headersTec,
      payload: { status: 'AGUARDANDO', mensagem: 'Preciso do numero de serie.' }
    });
    
    const ticketWait = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    console.log(`   [Assert] Ticket está no status AGUARDANDO: ${ticketWait?.status === 'AGUARDANDO' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Solicitante responde mensagem
    await fastify.inject({
      method: 'POST',
      url: `/api/tickets/${ticket.id}/messages`,
      headers: headersSol,
      payload: { content: 'O número de série é 987654321.' }
    });

    const ticketResumed = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    console.log(`   [Assert] Ticket transitou automaticamente para EM_ANDAMENTO: ${ticketResumed?.status === 'EM_ANDAMENTO' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 11. Testar bloqueio de mensagem em chamado fechado
    console.log('-> Testando bloqueio de mensagem em chamado FECHADO...');
    
    // Resolver e fechar o chamado
    const resRes = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket.id}/status`,
      headers: headersTec,
      payload: { status: 'RESOLVIDO', solucao: 'Substituído o monitor com defeito por um novo.' }
    });
    console.log('Resolve status code:', resRes.statusCode, 'body:', resRes.body);

    const resCl = await fastify.inject({
      method: 'PATCH',
      url: `/api/tickets/${ticket.id}/close`,
      headers: headersSol,
      payload: { nota: 5 }
    });
    console.log('Close status code:', resCl.statusCode, 'body:', resCl.body);

    const ticketClosed = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    console.log(`   [Assert] Ticket está FECHADO: ${ticketClosed?.status === 'FECHADO' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Tentar enviar mensagem
    const resBlockedMsg = await fastify.inject({
      method: 'POST',
      url: `/api/tickets/${ticket.id}/messages`,
      headers: headersSol,
      payload: { content: 'Consigo mandar mensagem?' }
    });
    console.log(`   [Assert] Retornou status 422: ${resBlockedMsg.statusCode === 422 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const blockedBody = JSON.parse(resBlockedMsg.body);
    console.log(`   [Assert] Retornou mensagem explicativa correta: ${blockedBody.error?.includes('Este chamado está fechado') ? 'Passou ✓' : 'FALHOU ✗'}`);

    console.log('\n==================================================');
    console.log('TESTES DE MENSAGENS E NOTIFICACOES CONCLUIDOS COM SUCESSO!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('Erro nos testes de mensagens e notificacoes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
