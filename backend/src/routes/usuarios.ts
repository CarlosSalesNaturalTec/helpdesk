import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authRequired, requirePasswordChange, requireRole } from '../middleware/auth.js';
import { unitFilter } from '../lib/rbac.js';
import { userSchema } from '@helpdesk/shared';

export async function usuarioRoutes(fastify: FastifyInstance) {
  // GET /api/usuarios
  fastify.get(
    '/api/usuarios',
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR_TI'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;

      let users;
      if (user.role === 'ADMIN') {
        users = await prisma.user.findMany({
          include: { unidade: true },
          orderBy: { nome: 'asc' },
        });
      } else {
        // Diretor e Gestor de TI listam apenas de sua unidade
        users = await prisma.user.findMany({
          where: { unidadeId: user.unidadeId },
          include: { unidade: true },
          orderBy: { nome: 'asc' },
        });
      }

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
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR_TI'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const parseResult = userSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ error: parseResult.error.format() });
      }

      const { nome, email, role, unidadeId: reqUnidadeId, senha } = parseResult.data;

      // Se Diretor/Gestor de TI, força a unidade do usuário logado
      const targetUnidadeId = user.role === 'ADMIN' ? reqUnidadeId : user.unidadeId;

      // Validar e-mail único
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return reply.status(400).send({ error: 'Já existe um usuário com este e-mail' });
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
          email,
          role,
          unidadeId: targetUnidadeId,
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
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR_TI'])] },
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

      const { nome, email, role, unidadeId: reqUnidadeId, senha } = parseResult.data;

      // Buscar usuário alvo
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Verificar isolamento: Diretor/Gestor de TI só editam usuários da sua própria unidade
      if (!unitFilter(user, targetUser.unidadeId)) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Se Diretor/Gestor de TI, impede alterar para outra unidade que não seja a sua
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

      // Validar e-mail único (exceto o próprio)
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== id) {
        return reply.status(400).send({ error: 'Já existe um usuário com este e-mail' });
      }

      const updateData: any = {
        nome,
        email,
        role,
        unidadeId: finalUnidadeId,
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
    { preHandler: [authRequired, requirePasswordChange, requireRole(['ADMIN', 'DIRETOR', 'GESTOR_TI'])] },
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

      // Verificar isolamento de unidade
      if (!unitFilter(user, targetUser.unidadeId)) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // Impedir de se desativar a si próprio
      if (user.id === targetUser.id) {
        return reply.status(400).send({ error: 'Você não pode desativar seu próprio usuário' });
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
