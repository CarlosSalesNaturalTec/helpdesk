# Tasks: Fundação — Autenticação, Usuários e Unidades

## 1. Setup do Projeto

- [ ] 1.1 Inicializar monorepo com estrutura `frontend/`, `backend/`, `shared/`, `prisma/`
- [ ] 1.2 Configurar TypeScript strict mode nos três pacotes, ESLint e Prettier
- [ ] 1.3 Criar Docker Compose com PostgreSQL para desenvolvimento local
- [ ] 1.4 Instalar dependências: backend (fastify, prisma, bcryptjs, jsonwebtoken, zod), frontend (vite, react, react-router-dom, react-query, axios), shared (zod)

## 2. Banco de Dados

- [ ] 2.1 Escrever `prisma/schema.prisma` com modelos `Unidade` e `User` conforme design
- [ ] 2.2 Gerar migration inicial e aplicar no banco local
- [ ] 2.3 Criar seed script com Admin global + Unidade padrão para desenvolvimento

## 3. Schemas Compartilhados (shared/)

- [ ] 3.1 Criar schema Zod `loginSchema` (email + senha)
- [ ] 3.2 Criar schema Zod `changePasswordSchema` (nova senha, confirmação, min 6 chars)
- [ ] 3.3 Criar schema Zod `userSchema` (nome, email, role, unidadeId, senha temporária)
- [ ] 3.4 Criar schema Zod `unidadeSchema` (nome, min 2 max 60 chars)
- [ ] 3.5 Exportar tipos TypeScript inferidos dos schemas Zod

## 4. Backend — Autenticação

- [ ] 4.1 Implementar helpers JWT (`signToken`, `verifyToken`) com TTL 15min
- [ ] 4.2 Implementar `POST /api/auth/login` com validação de credenciais, hash bcrypt, contador de falhas e bloqueio por força bruta
- [ ] 4.3 Implementar `GET /api/auth/me` que retorna dados do usuário autenticado
- [ ] 4.4 Implementar `POST /api/auth/change-password` com validação de senha atual, hash da nova senha e remoção da flag `passwordResetRequired`
- [ ] 4.5 Criar middleware `authRequired` que valida JWT e popula `req.user`
- [ ] 4.6 Criar middleware `requirePasswordChange` que força redirecionamento se `passwordResetRequired === true`
- [ ] 4.7 Criar middleware `requireRole` que verifica se o papel do usuário está na lista permitida

## 5. Backend — CRUD de Unidades

- [ ] 5.1 Implementar `GET /api/unidades` — listagem acessível a qualquer usuário autenticado
- [ ] 5.2 Implementar `POST /api/unidades` — restrito a ADMIN, valida nome único
- [ ] 5.3 Implementar `PUT /api/unidades/:id` — restrito a ADMIN
- [ ] 5.4 Implementar `DELETE /api/unidades/:id` — restrito a ADMIN, bloqueia se houver usuários vinculados

## 6. Backend — CRUD de Usuários

- [ ] 6.1 Implementar `GET /api/usuarios` — com `unitFilter`: Admin vê todos; Diretor/Gestor veem apenas sua Unidade
- [ ] 6.2 Implementar `POST /api/usuarios` — valida e-mail único, força Unidade do usuário logado para Diretor/Gestor, aplica hash bcrypt na senha temporária
- [ ] 6.3 Implementar `PUT /api/usuarios/:id` — com `unitFilter`, valida e-mail único (exceto o próprio)
- [ ] 6.4 Implementar `PATCH /api/usuarios/:id/deactivate` — verifica chamados ativos se for Técnico, retorna alerta com lista de chamados pendentes
- [ ] 6.5 Criar utilitário `unitFilter(req.user, targetUnidadeId)` que centraliza a lógica de isolamento entre Unidades

## 7. Frontend — Setup e Infra

- [ ] 7.1 Configurar Vite + React Router DOM com rotas protegidas por papel
- [ ] 7.2 Criar cliente HTTP (axios) com interceptor para incluir JWT em todas as requisições
- [ ] 7.3 Criar `AuthContext` + `AuthProvider` com estado de usuário logado, loading e funções login/logout
- [ ] 7.4 Criar componente `<ProtectedRoute>` que verifica autenticação e papel antes de renderizar
- [ ] 7.5 Criar componente `<PasswordChangeGuard>` que redireciona para alteração de senha se necessário
- [ ] 7.6 Criar layout base com AppBar e navegação condicional por papel

## 8. Frontend — Autenticação

- [ ] 8.1 Implementar tela de Login com validação Zod no formulário e exibição de erros da API
- [ ] 8.2 Implementar tela de Alteração de Senha obrigatória no primeiro login
- [ ] 8.3 Implementar fluxo de logout e redirect para login

## 9. Frontend — Unidades

- [ ] 9.1 Implementar tela de listagem de Unidades (visível para todos, ações CRUD apenas para Admin)
- [ ] 9.2 Implementar modal/form de criação e edição de Unidade (Admin only)
- [ ] 9.3 Implementar diálogo de confirmação de exclusão com mensagem de erro quando houver vínculos

## 10. Frontend — Usuários

- [ ] 10.1 Implementar tela de listagem de Usuários com escopo por papel (Admin: todos; Diretor/Gestor: sua Unidade; outros: sem acesso)
- [ ] 10.2 Implementar modal/form de criação de Usuário com campo Unidade bloqueado para Diretor/Gestor
- [ ] 10.3 Implementar modal/form de edição de Usuário
- [ ] 10.4 Implementar diálogo de desativação com alerta de chamados ativos para Técnico

## 11. Testes Manuais e Integração

- [ ] 11.1 Fluxo completo: Admin cria Unidade → Admin cria Técnico na Unidade → Técnico faz login com senha temporária → é forçado a trocar senha → acessa Dashboard
- [ ] 11.2 Testar isolamento: Gestor de TI da Unidade A não vê usuários da Unidade B
- [ ] 11.3 Testar força bruta: 5 tentativas com senha errada → bloqueio de 15 min → login com credenciais corretas após expirar
- [ ] 11.4 Testar e-mail duplicado: tentar criar usuário com e-mail já existente
- [ ] 11.5 Testar exclusão de Unidade com usuários vinculados: deve ser bloqueada
