import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { canManageUser, manageableUsersWhere } from '../lib/rbac.js';
import { userSchema } from '@helpdesk/shared';

export async function usuarioRoutes(fastify: FastifyInstance) {
  // GET /api/usuarios
  fastify.get(
    '/api/usuarios',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;

      // A listagem devolve os usuários gerenciáveis segundo a matriz de papéis,
      // mais o próprio usuário logado — que aparece marcado "Você" na interface
      // e pode editar os próprios dados pessoais (design D4).
      const users = await prisma.user.findMany({
        where: { OR: [manageableUsersWhere(user), { id: user.id }] },
        include: { unidade: true, sector: true },
        orderBy: { nome: 'asc' },
      });

      // Omitir hash de senha no retorno por segurança
      const result = users.map((u) => {
        const { senhaHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

      return reply.send(result);
    },
  );

  // POST /api/usuarios
  fastify.post(
    '/api/usuarios',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const parseResult = userSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, cpf, telefone, email, role, unidadeId: reqUnidadeId, sectorId, senha } = parseResult.data;

      // Se Diretor/Gestor, força a unidade do usuário logado
      const targetUnidadeId = user.role === 'ADMIN' ? reqUnidadeId : user.unidadeId;

      // Na criação não existe alvo atual, então todo payload fora da matriz de
      // papéis gerenciáveis é recusado com 403 (design D2).
      if (!canManageUser(user, { role, unidadeId: targetUnidadeId, sectorId })) {
        return reply
          .status(403)
          .send({ error: 'Você não tem permissão para cadastrar um usuário com este papel, Unidade ou Tipo de Ocorrência' });
      }

      // Validar e-mail único
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return reply.status(400).send({ error: 'Já existe um usuário com este e-mail' });
      }

      // Validar CPF único — espelha a checagem de e-mail acima para que a
      // duplicidade vire mensagem amigável em vez de erro P2002 cru do Prisma
      const existingCpf = await prisma.user.findUnique({
        where: { cpf },
      });
      if (existingCpf) {
        return reply.status(400).send({ error: 'Já existe um usuário com este CPF' });
      }

      // Senha é obrigatória no cadastro
      if (!senha) {
        return reply.status(400).send({ error: { senha: { _errors: ['A senha temporária é obrigatória para criação do usuário'] } } });
      }

      // Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(senha, salt);

      const novoUsuario = await prisma.user.create({
        data: {
          nome,
          cpf,
          telefone,
          email,
          role,
          unidadeId: targetUnidadeId,
          sectorId,
          senhaHash: hash,
          ativo: true,
          passwordResetRequired: true, // Força alteração no primeiro login
        },
      });

      const { senhaHash, ...userWithoutPassword } = novoUsuario;
      return reply.status(201).send(userWithoutPassword);
    },
  );

  // PUT /api/usuarios/:id
  fastify.put<{ Params: { id: string } }>(
    '/api/usuarios/:id',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const user = request.user!;
      const parseResult = userSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, cpf, telefone, email, role, unidadeId: reqUnidadeId, sectorId, senha } = parseResult.data;

      // Buscar usuário alvo
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      const isSelfEdit = targetUser.id === user.id;

      if (isSelfEdit) {
        // Auto-edição: dados pessoais sim, escopo não. A checagem de matriz é
        // dispensada (o Gestor não gerencia Gestores, mas edita a si mesmo) e em
        // troca papel, Unidade e área precisam ficar como estão — inclusive para
        // o Admin, para que o último Admin não se rebaixe por engano (design D3).
        const mudouArea = (sectorId ?? null) !== (targetUser.sectorId ?? null);
        if (role !== targetUser.role || reqUnidadeId !== targetUser.unidadeId || mudouArea) {
          return reply
            .status(403)
            .send({ error: 'Você não pode alterar o seu próprio papel, Unidade ou Tipo de Ocorrência' });
        }
      } else if (!canManageUser(user, targetUser)) {
        // Alvo atual fora do escopo, por papel, Unidade ou área → 404, para não
        // revelar que o usuário existe (design D2).
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Se Diretor/Gestor, impede alterar para outra unidade que não seja a sua
      let finalUnidadeId = targetUser.unidadeId;
      if (user.role === 'ADMIN') {
        finalUnidadeId = reqUnidadeId;
      } else {
        // Diretor/Gestor não podem mover usuário para outra unidade
        if (reqUnidadeId !== user.unidadeId) {
          return reply.status(403).send({ error: 'Você só pode vincular usuários à sua própria unidade' });
        }
        finalUnidadeId = user.unidadeId;
      }

      // O estado final da edição também precisa caber na matriz: assim uma
      // promoção (Solicitante → Gestor) ou uma troca de área do Técnico é pega
      // pela mesma regra, sem caso especial (design D1, D2).
      if (!isSelfEdit && !canManageUser(user, { role, unidadeId: finalUnidadeId, sectorId })) {
        return reply
          .status(403)
          .send({ error: 'Você não tem permissão para atribuir este papel, Unidade ou Tipo de Ocorrência' });
      }

      // Validar e-mail único (exceto o próprio)
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== id) {
        return reply.status(400).send({ error: 'Já existe um usuário com este e-mail' });
      }

      // Validar CPF único (exceto o próprio)
      const existingCpf = await prisma.user.findUnique({
        where: { cpf },
      });
      if (existingCpf && existingCpf.id !== id) {
        return reply.status(400).send({ error: 'Já existe um usuário com este CPF' });
      }

      const updateData: any = {
        nome,
        cpf,
        telefone,
        email,
        role,
        unidadeId: finalUnidadeId,
        sectorId,
      };

      // Se forneceu nova senha, atualiza e marca para resetar
      if (senha) {
        const salt = await bcrypt.genSalt(10);
        updateData.senhaHash = await bcrypt.hash(senha, salt);
        updateData.passwordResetRequired = true;
      }

      const usuarioAtualizado = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      const { senhaHash, ...userWithoutPassword } = usuarioAtualizado;
      return reply.send(userWithoutPassword);
    },
  );

  // PATCH /api/usuarios/:id/deactivate
  fastify.patch<{ Params: { id: string }; Querystring: { force?: string } }>(
    '/api/usuarios/:id/deactivate',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR'])] },
    async (request, reply) => {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'ID inválido' });
      }

      const user = request.user!;

      // Buscar usuário alvo
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Impedir de se desativar a si próprio — checado antes da matriz para que
      // a mensagem seja a mesma para todos os papéis
      if (user.id === targetUser.id) {
        return reply.status(400).send({ error: 'Você não pode desativar seu próprio usuário' });
      }

      // Alvo fora da matriz de papéis gerenciáveis, da Unidade ou da área → 404
      if (!canManageUser(user, targetUser)) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Verificar se o usuário é técnico e se tem chamados ativos
      // Como neste change inicial não há tabela de chamados, retornamos 0 chamados.
      const chamadosAtivosCount = 0; 
      
      // Se houver chamados ativos no futuro e o query param force não for true, retornamos o alerta:
      const force = request.query.force === 'true';
      if (targetUser.role === 'TECNICO' && chamadosAtivosCount > 0 && !force) {
        // Exemplo de retorno para solicitar confirmação na UI
        return reply.status(400).send({
          code: 'ACTIVE_TICKETS_WARNING',
          error: `Este técnico possui ${chamadosAtivosCount} chamados ativos sob sua responsabilidade. Deseja realmente desativá-lo?`,
          activeTickets: [/* lista de ids ou chamados */],
        });
      }

      const usuarioDesativado = await prisma.user.update({
        where: { id },
        data: { ativo: false },
      });

      const { senhaHash, ...userWithoutPassword } = usuarioDesativado;
      return reply.send(userWithoutPassword);
    },
  );
}
