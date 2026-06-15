# Proposal: Fundação — Autenticação, Usuários e Unidades

## Why

O sistema HelpDesk precisa saber **quem** está acessando e a **qual Unidade** pertence antes que qualquer outra funcionalidade exista. Sem autenticação e estrutura organizacional, não há como abrir chamados, restringir visibilidade por unidade ou aplicar permissões por papel. Esta é a camada fundacional que todos os outros changes consomem.

## What Changes

- Sistema de login com e-mail/senha usando JWT + bcrypt
- Proteção contra força bruta (bloqueio de 15 min após 5 falhas)
- Fluxo de primeiro login com senha temporária (troca obrigatória)
- Cinco papéis com permissões distintas: Solicitante, Técnico, Gestor de TI, Diretor, Administrador do Sistema
- CRUD de Usuários com escopo: Admin gerencia globalmente; Diretor e Gestor de TI gerenciam apenas usuários de sua própria Unidade
- CRUD de Unidades restrito ao Administrador do Sistema
- Isolamento de dados entre Unidades aplicado no servidor (não apenas na UI)
- Schema inicial do banco: `unidades`, `users`

## Capabilities

### New Capabilities

- `auth`: Autenticação local com e-mail/senha, hash bcrypt, proteção contra força bruta, bloqueio de usuários desativados e fluxo de senha temporária com troca obrigatória no primeiro login
- `rbac`: Controle de acesso baseado em 5 papéis com permissões e visibilidade distintas, aplicado no servidor. Isolamento de dados entre Unidades para Técnico, Gestor de TI e Diretor
- `user-management`: CRUD de usuários com escopo descentralizado — Admin gerencia globalmente (todas as unidades), Diretor e Gestor de TI gerenciam apenas usuários de sua própria Unidade
- `unit-management`: CRUD de Unidades restrito ao Administrador do Sistema, com proteção contra exclusão de Unidade que possua usuários ou chamados vinculados

### Modified Capabilities

_Nenhuma — este é o primeiro change do projeto._

## Impact

- **Database**: Criação das tabelas `unidades` e `users` (schema fundacional — todos os changes futuros referenciam estas tabelas)
- **Backend**: API de auth (`/api/auth/login`, `/api/auth/me`), middleware de autenticação/autorização, endpoints CRUD de usuários e unidades
- **Frontend**: Tela de login, tela de alteração de senha, telas de CRUD de Usuários e Unidades (com escopo por papel)
- **Dependências**: Prisma ORM, bcrypt, jsonwebtoken, Zod (schemas de validação compartilhadas)

## Non-goals

- Integração com diretório corporativo (AD/SSO/Google) — fora do MVP
- Auditoria avançada de ações administrativas — fora do MVP
- Recuperação de senha por e-mail (fluxo "esqueci minha senha") — será tratado em change futuro se necessário
- Perfis customizados além dos 5 definidos no PRD
