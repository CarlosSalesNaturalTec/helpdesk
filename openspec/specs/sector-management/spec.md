# Spec: Gerenciamento de Setores (sector-management)

## Purpose
TBD

## Requirements

### Requirement: Gerenciamento de Setores (CRUD)
O sistema SHALL permitir que o Administrador do Sistema crie, edite, ative e inative Setores (ex: Tecnologia, Manutenção, Limpeza). Cada Setor deve possuir nome e um status de ativo/inativo. Setores inativos não devem ser exibidos nas telas de abertura de chamado.

#### Scenario: Admin cria novo Setor
- **WHEN** o Administrador acessa a tela de Setores, clica em "Novo Setor", informa "Manutenção" e salva
- **THEN** o Setor "Manutenção" é criado e fica disponível para associação de Técnicos e Tipos de Problema

#### Scenario: Ocultar Setor inativo
- **WHEN** o Administrador inativa o Setor "Limpeza"
- **THEN** o Setor "Limpeza" deixa de aparecer no dropdown de abertura de chamados

### Requirement: Gerenciamento de Tipos de Problema por Setor (CRUD)
O sistema SHALL permitir que o Administrador do Sistema cadastre Tipos de Problema associados a um Setor específico. Cada Tipo de Problema deve ter: Nome, Setor (vínculo), SLA (tempo de resolução em minutos) e Status (ativo/inativo).

#### Scenario: Criação de Tipo de Problema
- **WHEN** o Administrador acessa o Setor "Manutenção" e adiciona o Tipo de Problema "Troca de Lâmpada" com SLA de 1440 minutos (24 horas)
- **THEN** o Tipo de Problema é salvo e passa a ser exibido para os Solicitantes que selecionarem o Setor "Manutenção"
