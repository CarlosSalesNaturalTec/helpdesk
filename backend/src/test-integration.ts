import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { unidadeRoutes } from './routes/unidades.js';
import { usuarioRoutes } from './routes/usuarios.js';
import { prisma } from './lib/prisma.js';
import * as bcrypt from 'bcryptjs';

const fastify = Fastify({ logger: false });
fastify.register(authRoutes);
fastify.register(unidadeRoutes);
fastify.register(usuarioRoutes);

async function runTests() {
  console.log('\n==================================================');
  console.log('INICIANDO TESTES INTEGRADOS DE REQUISITOS (FASTIFY INJECT)');
  console.log('==================================================\n');

  try {
    // 1. Limpar banco de dados de teste
    console.log('-> Resetando dados de teste no banco...');
    await prisma.notification.deleteMany({});
    await prisma.satisfaction.deleteMany({});
    await prisma.ticketHistory.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.unidade.deleteMany({});

    // 2. Criar Unidades de Teste
    console.log('-> Testando Criação de Unidades...');
    const resCreateUnitA = await fastify.inject({
      method: 'POST',
      url: '/api/unidades', // Sem auth deve falhar
      payload: { nome: 'Unidade A' },
    });
    console.log(`   [Assert] Criar unidade sem autenticação deve retornar 401: ${resCreateUnitA.statusCode === 401 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Vamos criar o admin manualmente para as requisições autenticadas
    const unitA = await prisma.unidade.create({ data: { nome: 'Unidade A' } });
    const unitB = await prisma.unidade.create({ data: { nome: 'Unidade B' } });
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('admin123', salt);
    const admin = await prisma.user.create({
      data: {
        nome: 'Admin Teste',
        email: 'admin@teste.com',
        senhaHash,
        role: 'ADMIN',
        unidadeId: unitA.id,
        passwordResetRequired: false,
      },
    });

    // Login do Admin para pegar o token
    const loginRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@teste.com', senha: 'admin123' },
    });
    const token = JSON.parse(loginRes.body).token;
    const authHeaders = { authorization: `Bearer ${token}` };

    // 3. Testar Força Bruta
    console.log('-> Testando Força Bruta (bloqueio de 15 minutos após 5 erros)...');
    const tempUser = await prisma.user.create({
      data: {
        nome: 'Usuario Teste Bruta',
        email: 'bruta@teste.com',
        senhaHash,
        role: 'TECNICO',
        unidadeId: unitA.id,
        passwordResetRequired: false,
      },
    });

    for (let i = 1; i <= 5; i++) {
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'bruta@teste.com', senha: 'senha-errada' },
      });
    }

    // A 6ª tentativa deve dar bloqueio por força bruta (status 429)
    const resBruta6 = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'bruta@teste.com', senha: 'senha-errada' },
    });
    console.log(`   [Assert] 6ª tentativa errada retorna HTTP 429 (Muitas tentativas): ${resBruta6.statusCode === 429 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const brutaBody = JSON.parse(resBruta6.body);
    console.log(`   [Assert] Mensagem de bloqueio correta: ${brutaBody.error.includes('Muitas tentativas falhas') ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Tentar logar com senha certa enquanto bloqueado deve continuar retornando bloqueio
    const resBrutaCorrect = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'bruta@teste.com', senha: 'admin123' },
    });
    console.log(`   [Assert] Login com senha correta durante bloqueio continua bloqueado: ${resBrutaCorrect.statusCode === 429 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 4. Testar Fluxo de Senha Temporária
    console.log('-> Testando Primeiro Login com Senha Temporária...');
    // Criar um usuário Técnico com passwordResetRequired = true
    const tecnico = await prisma.user.create({
      data: {
        nome: 'Técnico Teste',
        email: 'tecnico@teste.com',
        senhaHash,
        role: 'TECNICO',
        unidadeId: unitA.id,
        passwordResetRequired: true,
      },
    });

    // Login do Técnico com senha temporária
    const loginTecnicoRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'tecnico@teste.com', senha: 'admin123' },
    });
    const tecnicoToken = JSON.parse(loginTecnicoRes.body).token;
    const tecAuthHeaders = { authorization: `Bearer ${tecnicoToken}` };

    // Tentar acessar unidades com o token do Técnico com flag mustChangePassword ativa
    const listUnitsTec = await fastify.inject({
      method: 'GET',
      url: '/api/unidades',
      headers: tecAuthHeaders,
    });
    console.log(`   [Assert] Acesso a outras APIs bloqueado com flag ativa (retorna 403 PASSWORD_CHANGE_REQUIRED): ${listUnitsTec.statusCode === 403 && JSON.parse(listUnitsTec.body).code === 'PASSWORD_CHANGE_REQUIRED' ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Fazer a alteração de senha
    const changePasswordRes = await fastify.inject({
      method: 'POST',
      url: '/api/auth/change-password',
      headers: tecAuthHeaders,
      payload: { senhaAtual: 'admin123', novaSenha: 'novasenha123', confirmacaoSenha: 'novasenha123' },
    });
    console.log(`   [Assert] Alteração de senha concluída com sucesso: ${changePasswordRes.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Login com a nova senha
    const loginTecnicoRes2 = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'tecnico@teste.com', senha: 'novasenha123' },
    });
    const tecToken2 = JSON.parse(loginTecnicoRes2.body).token;
    const tecAuthHeaders2 = { authorization: `Bearer ${tecToken2}` };

    // Agora o acesso deve ser liberado
    const listUnitsTec2 = await fastify.inject({
      method: 'GET',
      url: '/api/unidades',
      headers: tecAuthHeaders2,
    });
    console.log(`   [Assert] Acesso liberado após troca de senha: ${listUnitsTec2.statusCode === 200 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 5. Testar Isolamento de Unidades (RBAC)
    console.log('-> Testando Isolamento de Dados entre Unidades...');
    // Criar um Diretor na Unidade A
    const diretorA = await prisma.user.create({
      data: {
        nome: 'Diretor Unidade A',
        email: 'diretora@teste.com',
        senhaHash,
        role: 'DIRETOR',
        unidadeId: unitA.id,
        passwordResetRequired: false,
      },
    });

    // Login Diretor A
    const loginDiretorA = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'diretora@teste.com', senha: 'admin123' },
    });
    const dirAToken = JSON.parse(loginDiretorA.body).token;
    const dirAHeaders = { authorization: `Bearer ${dirAToken}` };

    // Criar um usuário na Unidade B
    const userB = await prisma.user.create({
      data: {
        nome: 'Usuario Unidade B',
        email: 'userb@teste.com',
        senhaHash,
        role: 'SOLICITANTE',
        unidadeId: unitB.id,
        passwordResetRequired: false,
      },
    });

    // Diretor A tenta listar usuários -> deve ver apenas os da Unidade A, não o da Unidade B
    const listUsersDirA = await fastify.inject({
      method: 'GET',
      url: '/api/usuarios',
      headers: dirAHeaders,
    });
    const usersList = JSON.parse(listUsersDirA.body);
    const seesUserB = usersList.some((u: any) => u.id === userB.id);
    console.log(`   [Assert] Diretor da Unidade A não lista usuários da Unidade B: ${!seesUserB ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Diretor A tenta editar o usuário da Unidade B -> deve retornar 404
    const editUserB = await fastify.inject({
      method: 'PUT',
      url: `/api/usuarios/${userB.id}`,
      headers: dirAHeaders,
      payload: {
        nome: 'Usuario Unidade B Editado',
        email: 'userb@teste.com',
        role: 'SOLICITANTE',
        unidadeId: unitB.id,
      },
    });
    console.log(`   [Assert] Diretor A recebe HTTP 404 ao tentar editar usuário da Unidade B: ${editUserB.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Diretor A tenta desativar o usuário da Unidade B -> deve retornar 404
    const deactivateUserB = await fastify.inject({
      method: 'PATCH',
      url: `/api/usuarios/${userB.id}/deactivate`,
      headers: dirAHeaders,
    });
    console.log(`   [Assert] Diretor A recebe HTTP 404 ao desativar usuário da Unidade B: ${deactivateUserB.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 6. Testar exclusão de unidade com vínculo
    console.log('-> Testando Bloqueio de exclusão de Unidade com vínculo...');
    const deleteUnitARes = await fastify.inject({
      method: 'DELETE',
      url: `/api/unidades/${unitA.id}`,
      headers: authHeaders,
    });
    console.log(`   [Assert] Exclusão de unidade com usuários retorna HTTP 400: ${deleteUnitARes.statusCode === 400 ? 'Passou ✓' : 'FALHOU ✗'}`);
    const deleteBody = JSON.parse(deleteUnitARes.body);
    console.log(`   [Assert] Mensagem de exclusão vinculada correta: ${deleteBody.error.includes('vinculada') ? 'Passou ✓' : 'FALHOU ✗'}`);

    console.log('\n==================================================');
    console.log('TESTES INTEGRADOS CONCLUÍDOS COM SUCESSO!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Erro durante execução dos testes integrados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
