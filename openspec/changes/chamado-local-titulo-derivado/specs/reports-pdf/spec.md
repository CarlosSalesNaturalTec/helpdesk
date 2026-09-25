# Delta Spec: reports-pdf

## ADDED Requirements

### Requirement: Coluna de Local na lista de chamados do relatório
A lista de chamados do relatório em PDF SHALL apresentar uma coluna **"Local"** no lugar da coluna "Título", exibindo a localidade do problema, com um traço para os chamados que não a possuem. A largura das colunas SHALL ser redistribuída de modo que a soma continue cabendo na área útil da página.

O título composto do chamado NÃO DEVE ser apresentado nessa lista: ela já possui coluna própria de Tipo de Problema, e o título repetiria esse valor na mesma linha.

#### Scenario: Relatório apresenta a coluna Local
- **WHEN** um Gestor, Diretor ou Administrador gera o relatório em PDF
- **THEN** a lista de chamados apresenta a coluna "Local" no lugar de "Título", preservando as demais colunas

#### Scenario: Local não repete o Tipo de Problema
- **WHEN** um chamado de Tipo de Problema "Impressora travada" no local "Recepção" consta da lista
- **THEN** a coluna "Local" exibe apenas "Recepção" e a coluna "Tipo de Problema" exibe "Impressora travada"

#### Scenario: Chamado sem local no relatório
- **WHEN** um chamado anterior à existência do campo consta da lista
- **THEN** a coluna "Local" exibe um traço

#### Scenario: Larguras continuam cabendo na página
- **WHEN** o PDF é gerado com a nova coluna
- **THEN** a soma das larguras das colunas não ultrapassa a área útil da página e nenhuma coluna é cortada
