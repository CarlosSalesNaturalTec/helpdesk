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
