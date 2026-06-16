# Tasks: Fundação — Autenticação, Usuários e Unidades

## 1. Setup do Projeto

- [x] 1.1 Inicializar monorepo com estrutura `frontend/`, `backend/`, `shared/`, `prisma/`
- [x] 1.2 Configurar TypeScript strict mode nos três pacotes, ESLint e Prettier
- [x] 1.3 Criar Docker Compose com PostgreSQL para desenvolvimento local
- [x] 1.4 Instalar dependências: backend (fastify, prisma, bcryptjs, jsonwebtoken, zod), frontend (vite, react, react-router-dom, react-query, axios), shared (zod)

## 2. Banco de Dados

- [x] 2.1 Escrever `prisma/schema.prisma` com modelos `Unidade` e `User` conforme design
- [x] 2.2 Gerar migration inicial e aplicar no banco local
- [x] 2.3 Criar seed script com Admin global + Unidade padrão para desenvolvimento

## 3. Schemas Compartilhados (shared/)

- [x] 3.1 Criar schema Zod `loginSchema` (email + senha)
- [x] 3.2 Criar schema Zod `changePasswordSchema` (nova senha, confirmação, min 6 chars)
- [x] 3.3 Criar schema Zod `userSchema` (nome, email, role, unidadeId, senha temporária)
- [x] 3.4 Criar schema Zod `unidadeSchema` (nome, min 2 max 60 chars)
- [x] 3.5 Exportar tipos TypeScript inferidos dos schemas Zod

## 4. Backend — Autenticação

- [x] 4.1 Implementar helpers JWT (`signToken`, `verifyToken`) com TTL 15min
- [x] 4.2 Implementar `POST /api/auth/login` com validação de credenciais, hash bcrypt, contador de falhas e bloqueio por força bruta
- [x] 4.3 Implementar `GET /api/auth/me` que retorna dados do usuário autenticado
- [x] 4.4 Implementar `POST /api/auth/change-password` com validação de senha atual, hash da nova senha e remoção da flag `passwordResetRequired`
- [x] 4.5 Criar middleware `authRequired` que valida JWT e popula `req.user`
- [x] 4.6 Criar middleware `requirePasswordChange` que força redirecionamento se `passwordResetRequired === true`
- [x] 4.7 Criar middleware `requireRole` que verifica se o papel do usuário está na lista permitida

## 5. Backend — CRUD de Unidades

- [x] 5.1 Implementar `GET /api/unidades` — listagem acessível a qualquer usuário autenticado
- [x] 5.2 Implementar `POST /api/unidades` — restrito a ADMIN, valida nome único
- [x] 5.3 Implementar `PUT /api/unidades/:id` — restrito a ADMIN
- [x] 5.4 Implementar `DELETE /api/unidades/:id` — restrito a ADMIN, bloqueia se houver usuários vinculados

## 6. Backend — CRUD de Usuários

- [x] 6.1 Implementar `GET /api/usuarios` — com `unitFilter`: Admin vê todos; Diretor/Gestor veem apenas sua Unidade
- [x] 6.2 Implementar `POST /api/usuarios` — valida e-mail único, força Unidade do usuário logado para Diretor/Gestor, aplica hash bcrypt na senha temporária
- [x] 6.3 Implementar `PUT /api/usuarios/:id` — com `unitFilter`, valida e-mail único (exceto o próprio)
- [x] 6.4 Implementar `PATCH /api/usuarios/:id/deactivate` — verifica chamados ativos se for Técnico, retorna alerta com lista de chamados pendentes
- [x] 6.5 Criar utilitário `unitFilter(req.user, targetUnidadeId)` que centraliza a lógica de isolamento entre Unidades

## 7. Frontend — Setup e Infra

- [x] 7.1 Configurar Vite + React Router DOM com rotas protegidas por papel
- [x] 7.2 Criar cliente HTTP (axios) com interceptor para incluir JWT em todas as requisições
- [x] 7.3 Criar `AuthContext` + `AuthProvider` com estado de usuário logado, loading e funções login/logout
- [x] 7.4 Criar componente `<ProtectedRoute>` que verifica autenticação e papel antes de renderizar
- [x] 7.5 Criar componente `<PasswordChangeGuard>` que redireciona para alteração de senha se necessário
- [x] 7.6 Criar layout base com AppBar e navegação condicional por papel

## 8. Frontend — Autenticação

- [x] 8.1 Implementar tela de Login com validação Zod no formulário e exibição de erros da API
- [x] 8.2 Implementar tela de Alteração de Senha obrigatória no primeiro login
- [x] 8.3 Implementar fluxo de logout e redirect para login

## 9. Frontend — Unidades

- [x] 9.1 Implementar tela de listagem de Unidades (visível para todos, ações CRUD apenas para Admin)
- [x] 9.2 Implementar modal/form de criação e edição de Unidade (Admin only)
- [x] 9.3 Implementar diálogo de confirmação de exclusão com mensagem de erro quando houver vínculos

## 10. Frontend — Usuários

- [x] 10.1 Implementar tela de listagem de Usuários com escopo por papel (Admin: todos; Diretor/Gestor: sua Unidade; outros: sem acesso)
- [x] 10.2 Implementar modal/form de criação de Usuário com campo Unidade bloqueado para Diretor/Gestor
- [x] 10.3 Implementar modal/form de edição de Usuário
- [x] 10.4 Implementar diálogo de desativação com alerta de chamados ativos para Técnico

## 11. Testes Manuais e Integração

- [x] 11.1 Fluxo completo: Admin cria Unidade → Admin cria Técnico na Unidade → Técnico faz login com senha temporária → é forçado a trocar senha → acessa Dashboard
- [x] 11.2 Testar isolamento: Gestor de TI da Unidade A não vê usuários da Unidade B
- [x] 11.3 Testar força bruta: 5 tentativas com senha errada → bloqueio de 15 min → login com credenciais corretas após expirar
- [x] 11.4 Testar e-mail duplicado: tentar criar usuário com e-mail já existente
- [x] 11.5 Testar exclusão de Unidade com usuários vinculados: deve ser bloqueada
