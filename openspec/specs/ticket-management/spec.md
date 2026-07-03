# Capability: ticket-management

## Purpose
TBD

## Requirements

### Requirement: Occurrence Type Nomenclature
The system MUST use the term "Tipo de Ocorrência" instead of "Setor" to categorize tickets across the entire UI.

#### Scenario: User creates or views a ticket
- **WHEN** user interacts with ticket categorization dropdowns, lists, or details
- **THEN** the label MUST read "Tipo de Ocorrência"
- **THEN** no user-facing interface should display the term "Setor"

### Requirement: Colunas separadas para Tipo de Ocorrência e Tipo de Problema
O sistema SHALL exibir explicitamente as informações de "Tipo de Ocorrência" (Setor) e "Tipo de Problema" em colunas separadas na tabela de listagem de chamados ("Meus Chamados" / "Chamados") para todos os perfis. A informação NÃO DEVE ser exibida concatenada ou aglutinada junto ao título do chamado.

#### Scenario: Visualização da listagem de chamados
- **WHEN** um usuário (qualquer perfil) acessa a tela de listagem de chamados
- **THEN** a tabela exibe uma coluna dedicada para "Tipo de Ocorrência"
- **THEN** a tabela exibe uma coluna dedicada para "Tipo de Problema"
- **THEN** o título do chamado é exibido sozinho na sua respectiva coluna, sem conter o tipo de ocorrência ou problema concatenado
