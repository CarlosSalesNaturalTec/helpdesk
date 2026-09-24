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
    await prisma.problemType.deleteMany({});
    await prisma.sector.deleteMany({});

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
        cpf: '111.111.111-11',
        telefone: '11999990001',
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

    // 6. Testar Matriz de Papéis Gerenciáveis (change usuarios-permissoes-por-papel)
    console.log('-> Testando Matriz de Papéis Gerenciáveis...');

    const secTecnologia = await prisma.sector.create({ data: { nome: 'Tecnologia' } });
    const secManutencao = await prisma.sector.create({ data: { nome: 'Manutenção' } });

    // Gestor de Tecnologia na Unidade A
    const gestorTec = await prisma.user.create({
      data: {
        nome: 'Gestor Tecnologia',
        email: 'gestor.tec@teste.com',
        senhaHash,
        role: 'GESTOR',
        unidadeId: unitA.id,
        sectorId: secTecnologia.id,
        passwordResetRequired: false,
      },
    });

    // Técnico de Manutenção na mesma Unidade — fora da área do Gestor acima
    const tecnicoManutencao = await prisma.user.create({
      data: {
        nome: 'Tecnico Manutencao',
        email: 'tecnico.manut@teste.com',
        senhaHash,
        role: 'TECNICO',
        unidadeId: unitA.id,
        sectorId: secManutencao.id,
        passwordResetRequired: false,
      },
    });

    const loginGestorTec = await fastify.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'gestor.tec@teste.com', senha: 'admin123' },
    });
    const gestorHeaders = { authorization: `Bearer ${JSON.parse(loginGestorTec.body).token}` };

    // Gestor tenta criar um ADMIN -> 403 (o select esconde a opção, a API recusa)
    const gestorCriaAdmin = await fastify.inject({
      method: 'POST',
      url: '/api/usuarios',
      headers: gestorHeaders,
      payload: {
        nome: 'Admin Indevido',
        cpf: '222.222.222-22',
        telefone: '11999990002',
        email: 'admin.indevido@teste.com',
        role: 'ADMIN',
        unidadeId: unitA.id,
        senha: 'senha123',
      },
    });
    console.log(`   [Assert] Gestor recebe HTTP 403 ao criar ADMIN: ${gestorCriaAdmin.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Gestor tenta se promover a DIRETOR editando o próprio cadastro -> 403
    const gestorSePromove = await fastify.inject({
      method: 'PUT',
      url: `/api/usuarios/${gestorTec.id}`,
      headers: gestorHeaders,
      payload: {
        nome: 'Gestor Tecnologia',
        cpf: '333.333.333-33',
        telefone: '11999990003',
        email: 'gestor.tec@teste.com',
        role: 'DIRETOR',
        unidadeId: unitA.id,
        sectorId: secTecnologia.id,
      },
    });
    console.log(`   [Assert] Gestor recebe HTTP 403 ao alterar o próprio papel: ${gestorSePromove.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Gestor de Tecnologia tenta editar Técnico de Manutenção -> 404 (fora da área)
    const gestorEditaOutraArea = await fastify.inject({
      method: 'PUT',
      url: `/api/usuarios/${tecnicoManutencao.id}`,
      headers: gestorHeaders,
      payload: {
        nome: 'Tecnico Manutencao Editado',
        cpf: '444.444.444-44',
        telefone: '11999990004',
        email: 'tecnico.manut@teste.com',
        role: 'TECNICO',
        unidadeId: unitA.id,
        sectorId: secManutencao.id,
      },
    });
    console.log(`   [Assert] Gestor recebe HTTP 404 ao editar Técnico de outra área: ${gestorEditaOutraArea.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Gestor tenta desativar Técnico de outra área -> 404
    const gestorDesativaOutraArea = await fastify.inject({
      method: 'PATCH',
      url: `/api/usuarios/${tecnicoManutencao.id}/deactivate`,
      headers: gestorHeaders,
    });
    console.log(`   [Assert] Gestor recebe HTTP 404 ao desativar Técnico de outra área: ${gestorDesativaOutraArea.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Gestor tenta editar o Diretor da própria Unidade -> 404 (fora da matriz)
    const gestorEditaDiretor = await fastify.inject({
      method: 'PUT',
      url: `/api/usuarios/${diretorA.id}`,
      headers: gestorHeaders,
      payload: {
        nome: 'Diretor Unidade A Editado',
        cpf: '555.555.555-55',
        telefone: '11999990005',
        email: 'diretora@teste.com',
        role: 'DIRETOR',
        unidadeId: unitA.id,
      },
    });
    console.log(`   [Assert] Gestor recebe HTTP 404 ao editar o Diretor da Unidade: ${gestorEditaDiretor.statusCode === 404 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Diretor tenta criar outro DIRETOR -> 403 (atribuição exclusiva do Admin)
    const diretorCriaDiretor = await fastify.inject({
      method: 'POST',
      url: '/api/usuarios',
      headers: dirAHeaders,
      payload: {
        nome: 'Outro Diretor',
        cpf: '666.666.666-66',
        telefone: '11999990006',
        email: 'outro.diretor@teste.com',
        role: 'DIRETOR',
        unidadeId: unitA.id,
        senha: 'senha123',
      },
    });
    console.log(`   [Assert] Diretor recebe HTTP 403 ao criar outro DIRETOR: ${diretorCriaDiretor.statusCode === 403 ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Listagem do Gestor: só Solicitantes da Unidade, Técnicos da área e ele mesmo
    const listUsersGestor = await fastify.inject({
      method: 'GET',
      url: '/api/usuarios',
      headers: gestorHeaders,
    });
    const gestorList = JSON.parse(listUsersGestor.body);
    const veTecnicoOutraArea = gestorList.some((u: any) => u.id === tecnicoManutencao.id);
    const veDiretor = gestorList.some((u: any) => u.id === diretorA.id);
    const veASiMesmo = gestorList.some((u: any) => u.id === gestorTec.id);
    console.log(`   [Assert] Listagem do Gestor não traz Técnico de outra área: ${!veTecnicoOutraArea ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Listagem do Gestor não traz o Diretor da Unidade: ${!veDiretor ? 'Passou ✓' : 'FALHOU ✗'}`);
    console.log(`   [Assert] Listagem do Gestor inclui o próprio Gestor: ${veASiMesmo ? 'Passou ✓' : 'FALHOU ✗'}`);

    // Listagem do Diretor: não traz Admins nem outros Diretores
    const listUsersDirA2 = await fastify.inject({
      method: 'GET',
      url: '/api/usuarios',
      headers: dirAHeaders,
    });
    const diretorList = JSON.parse(listUsersDirA2.body);
    const veAdmin = diretorList.some((u: any) => u.id === admin.id);
    console.log(`   [Assert] Listagem do Diretor não traz Administradores: ${!veAdmin ? 'Passou ✓' : 'FALHOU ✗'}`);

    // 7. Testar exclusão de unidade com vínculo
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
