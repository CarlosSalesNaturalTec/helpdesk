# Spec: Atribuição de Chamados (ticket-assignment)

Mecanismo de auto-atribuição por Técnico e reatribuição por Gestor/Diretor, sempre respeitando o escopo da Unidade.

## Purpose
TBD

## Requirements

### Requirement: Auto-atribuição por Técnico da mesma Unidade
O sistema SHALL permitir que qualquer Técnico assuma um chamado com status "Aberto" ou "Reaberto" desde que o chamado pertença à mesma Unidade do Técnico. Ao assumir, o chamado DEVE transitar automaticamente para "Em Andamento" e o Técnico DEVE ser registrado como responsável.

#### Scenario: Técnico assume chamado da sua Unidade
- **WHEN** um Técnico da "Unidade A" seleciona um chamado "Aberto" da "Unidade A" e aciona "Assumir Chamado"
- **THEN** o chamado transita para "Em Andamento", o Técnico é registrado como responsável, e a atribuição fica no histórico

#### Scenario: Técnico não pode assumir chamado de outra Unidade
- **WHEN** um Técnico da "Unidade A" tenta assumir um chamado cujo solicitante pertence à "Unidade B"
- **THEN** o sistema retorna HTTP 404 (como se o chamado não existisse para ele)

### Requirement: Reatribuição por Gestor de TI ou Diretor
O sistema SHALL permitir que Gestores de TI e Diretores reatribuam qualquer chamado de sua Unidade para um Técnico específico pertencente à mesma Unidade. A reatribuição DEVE atualizar o responsável, mudar o status para "Em Andamento" se estiver "Aberto" ou "Reaberto", e registrar a mudança no histórico.

#### Scenario: Gestor reatribui chamado da sua Unidade
- **WHEN** um Gestor de TI da "Unidade A" acessa um chamado da sua Unidade, aciona "Reatribuir" e seleciona um Técnico válido da "Unidade A"
- **THEN** o responsável é atualizado, o status passa para "Em Andamento" (se estava Aberto/Reaberto), a mudança é registrada no histórico

#### Scenario: Gestor não pode reatribuir para Técnico de outra Unidade
- **WHEN** um Gestor de TI da "Unidade A" tenta reatribuir um chamado para um Técnico da "Unidade B"
- **THEN** o sistema retorna erro informando que o Técnico selecionado não pertence à mesma Unidade

#### Scenario: Diretor reatribui chamado
- **WHEN** um Diretor da "Unidade A" reatribui um chamado de sua Unidade para um Técnico da "Unidade A"
- **THEN** a reatribuição é concluída com sucesso, seguindo as mesmas regras do Gestor de TI

### Requirement: Visibilidade dos chamados por papel
O sistema SHALL garantir que cada papel veja apenas os chamados permitidos: Técnico, Gestor de TI e Diretor veem todos os chamados de sua Unidade; Solicitante vê apenas seus próprios chamados; Administrador do Sistema vê todos os chamados de todas as Unidades.

#### Scenario: Técnico vê fila de chamados da sua Unidade
- **WHEN** um Técnico da "Unidade A" acessa a tela de Gestão de Chamados
- **THEN** o sistema retorna todos os chamados cujo solicitante pertence à "Unidade A"

#### Scenario: Solicitante vê apenas seus chamados
- **WHEN** um Solicitante acessa a lista de chamados
- **THEN** o sistema retorna exclusivamente os chamados onde ele é o solicitante

#### Scenario: Admin vê todos os chamados
- **WHEN** o Administrador do Sistema acessa a Gestão de Chamados
- **THEN** o sistema retorna chamados de todas as Unidades sem restrição
