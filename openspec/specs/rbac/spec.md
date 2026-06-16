# Spec: RBAC (rbac)

Controle de acesso baseado em papéis (Role-Based Access Control) com isolamento de dados entre Unidades. Define o que cada persona pode ver e fazer no sistema, com enforcement no servidor.

## Purpose
TBD

## Requirements

### Requirement: Cinco papéis com permissões distintas
O sistema SHALL implementar cinco papéis de usuário com as seguintes permissões:

- **Solicitante:** vê apenas seus próprios chamados; pode abrir, interagir e fechar seus chamados resolvidos
- **Técnico:** vê todos os chamados da sua Unidade; pode assumir chamados abertos, alterar status (exceto Fechar) e registrar mensagens
- **Gestor de TI:** vê e gerencia todos os chamados da sua Unidade, incluindo reatribuição e fechamento; gerencia usuários de sua Unidade
- **Diretor:** vê e gerencia todos os chamados da sua Unidade, incluindo reatribuição e fechamento; gerencia usuários de sua Unidade
- **Administrador do Sistema:** acesso irrestrito global; CRUD de Unidades e Usuários; visão consolidada de todas as Unidades

#### Scenario: Solicitante acessa apenas seus chamados
- **WHEN** um Solicitante consulta a lista de chamados
- **THEN** o sistema retorna exclusivamente os chamados cujo `solicitanteId` corresponde ao seu ID de usuário

#### Scenario: Técnico acessa apenas chamados de sua Unidade
- **WHEN** um Técnico da "Unidade A" consulta a lista de chamados
- **THEN** o sistema retorna apenas chamados cujo solicitante pertence à "Unidade A"

#### Scenario: Admin acessa dados globais
- **WHEN** o Administrador do Sistema consulta qualquer recurso
- **THEN** o sistema retorna dados de todas as Unidades sem restrição

### Requirement: Enforcement de permissões no servidor
O sistema SHALL aplicar as regras de autorização no backend, e NÃO apenas na interface. Nenhum usuário DEVE conseguir acessar dados fora do seu escopo via manipulação de parâmetros de requisição.

#### Scenario: Técnico tenta acessar chamado de outra Unidade via ID
- **WHEN** um Técnico da "Unidade A" faz uma requisição direta para `/api/tickets/999` onde o ticket 999 pertence a um solicitante da "Unidade B"
- **THEN** o sistema retorna HTTP 404 (recurso não encontrado), não distinguindo entre "não existe" e "você não tem permissão"

#### Scenario: Solicitante tenta acessar chamado de outro usuário
- **WHEN** um Solicitante faz uma requisição para um chamado que não é seu
- **THEN** o sistema retorna HTTP 404 como se o recurso não existisse

### Requirement: Isolamento de dados entre Unidades
O sistema SHALL garantir que Técnico, Diretor e Gestor de TI alocados a uma Unidade não visualizem chamados, usuários ou quaisquer dados cujo contexto pertença a outra Unidade. Apenas o Administrador do Sistema possui visão irrestrita.

#### Scenario: Gestor de TI lista usuários
- **WHEN** um Gestor de TI da "Unidade A" consulta a lista de usuários
- **THEN** o sistema retorna apenas usuários cuja `unidadeId` corresponde à "Unidade A"

#### Scenario: Diretor tenta editar usuário de outra Unidade
- **WHEN** um Diretor da "Unidade A" tenta editar um usuário da "Unidade B"
- **THEN** o sistema retorna HTTP 404 e a edição não é realizada
