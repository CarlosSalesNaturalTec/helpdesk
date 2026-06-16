import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seeding do banco de dados...');

  // 1. Criar Unidade padrão
  const unidadePadrao = await prisma.unidade.upsert({
    where: { nome: 'Unidade Central' },
    update: {},
    create: {
      nome: 'Unidade Central',
    },
  });
  console.log(`Unidade criada/atualizada: ${unidadePadrao.nome} (ID: ${unidadePadrao.id})`);

  // 2. Criar Unidade Secundária para testes de isolamento
  const unidadeSecundaria = await prisma.unidade.upsert({
    where: { nome: 'Unidade Secundária' },
    update: {},
    create: {
      nome: 'Unidade Secundária',
    },
  });
  console.log(`Unidade de testes criada: ${unidadeSecundaria.nome} (ID: ${unidadeSecundaria.id})`);

  // 3. Criar Admin global
  const salt = await bcrypt.genSalt(10);
  const senhaHash = await bcrypt.hash('admin123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: {
      nome: 'Administrador Global',
      email: 'admin@helpdesk.com',
      senhaHash,
      role: Role.ADMIN,
      unidadeId: unidadePadrao.id,
      ativo: true,
      passwordResetRequired: true, // Forçar troca no primeiro login
    },
  });
  console.log(`Usuário Admin criado/atualizado: ${adminUser.email}`);

  // 4. Criar outros usuários para fluxo de tickets
  const hashComum = await bcrypt.hash('user123', salt);

  const solicitanteCentral = await prisma.user.upsert({
    where: { email: 'solicitante@helpdesk.com' },
    update: {},
    create: {
      nome: 'Carlos Solicitante',
      email: 'solicitante@helpdesk.com',
      senhaHash: hashComum,
      role: Role.SOLICITANTE,
      unidadeId: unidadePadrao.id,
      ativo: true,
      passwordResetRequired: false,
    },
  });
  console.log(`Usuário Solicitante Central criado: ${solicitanteCentral.email}`);

  const tecnicoCentral = await prisma.user.upsert({
    where: { email: 'tecnico@helpdesk.com' },
    update: {},
    create: {
      nome: 'Thiago Técnico',
      email: 'tecnico@helpdesk.com',
      senhaHash: hashComum,
      role: Role.TECNICO,
      unidadeId: unidadePadrao.id,
      ativo: true,
      passwordResetRequired: false,
    },
  });
  console.log(`Usuário Técnico Central criado: ${tecnicoCentral.email}`);

  const gestorCentral = await prisma.user.upsert({
    where: { email: 'gestor@helpdesk.com' },
    update: {},
    create: {
      nome: 'Gisela Gestora',
      email: 'gestor@helpdesk.com',
      senhaHash: hashComum,
      role: Role.GESTOR_TI,
      unidadeId: unidadePadrao.id,
      ativo: true,
      passwordResetRequired: false,
    },
  });
  console.log(`Usuário Gestor Central criado: ${gestorCentral.email}`);

  const solicitanteSecundario = await prisma.user.upsert({
    where: { email: 'solicitante2@helpdesk.com' },
    update: {},
    create: {
      nome: 'Silvia Secundária',
      email: 'solicitante2@helpdesk.com',
      senhaHash: hashComum,
      role: Role.SOLICITANTE,
      unidadeId: unidadeSecundaria.id,
      ativo: true,
      passwordResetRequired: false,
    },
  });
  console.log(`Usuário Solicitante Secundário criado: ${solicitanteSecundario.email}`);

  const tecnicoSecundario = await prisma.user.upsert({
    where: { email: 'tecnico2@helpdesk.com' },
    update: {},
    create: {
      nome: 'Túlio Técnico Secundário',
      email: 'tecnico2@helpdesk.com',
      senhaHash: hashComum,
      role: Role.TECNICO,
      unidadeId: unidadeSecundaria.id,
      ativo: true,
      passwordResetRequired: false,
    },
  });
  console.log(`Usuário Técnico Secundário criado: ${tecnicoSecundario.email}`);

  // Limpar tabelas de tickets antes de inserir para evitar duplicatas em re-seed
  await prisma.satisfaction.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();

  // Helper para criar histórico
  const createHistory = async (ticketId: number, authorId: number, type: any, content: any) => {
    return prisma.ticketHistory.create({
      data: {
        ticketId,
        authorId,
        type,
        content,
      },
    });
  };

  // Ticket 1: ABERTO
  const t1 = await prisma.ticket.create({
    data: {
      titulo: 'Computador não liga',
      descricao: 'Meu computador de trabalho não liga de jeito nenhum, já verifiquei a tomada.',
      tipoProblema: 'HARDWARE',
      urgencia: 'ALTA',
      status: 'ABERTO',
      solicitanteId: solicitanteCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t1.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t1.titulo,
    descricao: t1.descricao,
    tipoProblema: t1.tipoProblema,
    urgencia: t1.urgencia,
  });

  // Ticket 2: EM_ANDAMENTO
  const t2 = await prisma.ticket.create({
    data: {
      titulo: 'Erro ao acessar o e-mail corporativo',
      descricao: 'Ao tentar logar, aparece erro 500 na tela do Webmail.',
      tipoProblema: 'EMAIL',
      urgencia: 'MEDIA',
      status: 'EM_ANDAMENTO',
      solicitanteId: solicitanteCentral.id,
      tecnicoId: tecnicoCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t2.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t2.titulo,
    descricao: t2.descricao,
    tipoProblema: t2.tipoProblema,
    urgencia: t2.urgencia,
  });
  await createHistory(t2.id, tecnicoCentral.id, 'ATRIBUICAO', {
    tecnicoId: tecnicoCentral.id,
    tecnicoNome: tecnicoCentral.nome,
  });
  await createHistory(t2.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'ABERTO',
    to: 'EM_ANDAMENTO',
  });

  // Ticket 3: AGUARDANDO
  const t3 = await prisma.ticket.create({
    data: {
      titulo: 'Impressora sem toner',
      descricao: 'A impressora da recepção está com aviso de toner vazio.',
      tipoProblema: 'IMPRESSORA',
      urgencia: 'BAIXA',
      status: 'AGUARDANDO',
      solicitanteId: solicitanteCentral.id,
      tecnicoId: tecnicoCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t3.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t3.titulo,
    descricao: t3.descricao,
    tipoProblema: t3.tipoProblema,
    urgencia: t3.urgencia,
  });
  await createHistory(t3.id, tecnicoCentral.id, 'ATRIBUICAO', {
    tecnicoId: tecnicoCentral.id,
    tecnicoNome: tecnicoCentral.nome,
  });
  await createHistory(t3.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'ABERTO',
    to: 'EM_ANDAMENTO',
  });
  await createHistory(t3.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'EM_ANDAMENTO',
    to: 'AGUARDANDO',
    motivo: 'Aguardando entrega do toner pelo almoxarifado.',
  });

  // Ticket 4: RESOLVIDO
  const t4 = await prisma.ticket.create({
    data: {
      titulo: 'Rede Wi-Fi caindo frequentemente',
      descricao: 'A rede wifi cai a cada 10 minutos na sala de reuniões.',
      tipoProblema: 'REDE_INTERNET',
      urgencia: 'CRITICA',
      status: 'RESOLVIDO',
      solicitanteId: solicitanteCentral.id,
      tecnicoId: tecnicoCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t4.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t4.titulo,
    descricao: t4.descricao,
    tipoProblema: t4.tipoProblema,
    urgencia: t4.urgencia,
  });
  await createHistory(t4.id, tecnicoCentral.id, 'ATRIBUICAO', {
    tecnicoId: tecnicoCentral.id,
    tecnicoNome: tecnicoCentral.nome,
  });
  await createHistory(t4.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'ABERTO',
    to: 'EM_ANDAMENTO',
  });
  await createHistory(t4.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'EM_ANDAMENTO',
    to: 'RESOLVIDO',
    solucao: 'Substituído o roteador da sala de reuniões que estava superaquecendo.',
  });

  // Ticket 5: FECHADO com avaliação (satisfação)
  const t5 = await prisma.ticket.create({
    data: {
      titulo: 'Instalação de software de videoconferência',
      descricao: 'Preciso que instalem o Teams para uma reunião à tarde.',
      tipoProblema: 'SOFTWARE',
      urgencia: 'MEDIA',
      status: 'FECHADO',
      solicitanteId: solicitanteCentral.id,
      tecnicoId: tecnicoCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t5.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t5.titulo,
    descricao: t5.descricao,
    tipoProblema: t5.tipoProblema,
    urgencia: t5.urgencia,
  });
  await createHistory(t5.id, tecnicoCentral.id, 'ATRIBUICAO', {
    tecnicoId: tecnicoCentral.id,
    tecnicoNome: tecnicoCentral.nome,
  });
  await createHistory(t5.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'ABERTO',
    to: 'EM_ANDAMENTO',
  });
  await createHistory(t5.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'EM_ANDAMENTO',
    to: 'RESOLVIDO',
    solucao: 'Instalado o aplicativo e testada a câmera e áudio.',
  });
  await createHistory(t5.id, solicitanteCentral.id, 'FECHAMENTO', {
    motivo: 'Atendimento rápido e eficiente.',
  });
  await prisma.satisfaction.create({
    data: {
      ticketId: t5.id,
      nota: 5,
    },
  });

  // Ticket 6: FECHADO administrativamente
  const t6 = await prisma.ticket.create({
    data: {
      titulo: 'Troca de teclado com defeito',
      descricao: 'A tecla espaço não funciona.',
      tipoProblema: 'HARDWARE',
      urgencia: 'BAIXA',
      status: 'FECHADO',
      solicitanteId: solicitanteCentral.id,
      tecnicoId: tecnicoCentral.id,
      unidadeId: unidadePadrao.id,
    },
  });
  await createHistory(t6.id, solicitanteCentral.id, 'ABERTURA', {
    titulo: t6.titulo,
    descricao: t6.descricao,
    tipoProblema: t6.tipoProblema,
    urgencia: t6.urgencia,
  });
  await createHistory(t6.id, tecnicoCentral.id, 'ATRIBUICAO', {
    tecnicoId: tecnicoCentral.id,
    tecnicoNome: tecnicoCentral.nome,
  });
  await createHistory(t6.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'ABERTO',
    to: 'EM_ANDAMENTO',
  });
  await createHistory(t6.id, tecnicoCentral.id, 'MUDANCA_STATUS', {
    from: 'EM_ANDAMENTO',
    to: 'RESOLVIDO',
    solucao: 'Troca do teclado por um novo modelo padrão USB.',
  });
  await createHistory(t6.id, gestorCentral.id, 'FECHAMENTO', {
    adminClose: true,
    motivo: 'Fechamento administrativo devido à falta de retorno do solicitante após 3 dias.',
  });

  // Ticket 7: Isolamento (Unidade Secundária)
  const t7 = await prisma.ticket.create({
    data: {
      titulo: 'Sistema interno indisponível',
      descricao: 'Não consigo abrir a tela de faturamento da minha unidade.',
      tipoProblema: 'SISTEMA_INTERNO',
      urgencia: 'CRITICA',
      status: 'ABERTO',
      solicitanteId: solicitanteSecundario.id,
      unidadeId: unidadeSecundaria.id,
    },
  });
  await createHistory(t7.id, solicitanteSecundario.id, 'ABERTURA', {
    titulo: t7.titulo,
    descricao: t7.descricao,
    tipoProblema: t7.tipoProblema,
    urgencia: t7.urgencia,
  });

  console.log('Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
