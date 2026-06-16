# Spec: Pesquisa de Satisfação (satisfaction)

Avaliação do atendimento pelo Solicitante ao fechar um chamado, com nota de 1 a 5 estrelas, alimentando os indicadores de qualidade dos relatórios gerenciais.

## ADDED Requirements

### Requirement: Avaliação obrigatória no fechamento pelo Solicitante
O sistema SHALL exigir que o Solicitante avalie o atendimento ao fechar seu chamado. A tela de avaliação DEVE apresentar 5 estrelas com a pergunta "Como você avalia o atendimento recebido?". O fechamento NÃO DEVE ser concluído até que uma nota de 1 a 5 seja selecionada.

#### Scenario: Solicitante avalia e fecha
- **WHEN** o Solicitante acessa um chamado "Resolvido", aciona "Fechar Chamado", seleciona 4 estrelas e confirma
- **THEN** o chamado transita para "Fechado" e a nota é registrada vinculada ao chamado, Solicitante, Unidade e data de fechamento

#### Scenario: Fechamento bloqueado sem avaliação
- **WHEN** o Solicitante tenta fechar o chamado sem selecionar uma nota de 1 a 5 estrelas
- **THEN** o sistema impede o fechamento e solicita a seleção de uma nota

### Requirement: Registro da avaliação
O sistema SHALL registrar a nota de satisfação vinculada ao chamado, ao Solicitante, à Unidade e à data de fechamento. A nota DEVE ser um inteiro de 1 a 5. A avaliação NÃO DEVE incluir campo de comentário textual no MVP.

#### Scenario: Nota registrada corretamente
- **WHEN** um Solicitante atribui nota 4 e confirma o fechamento
- **THEN** a nota 4 é persistida com os vínculos: ticketId, solicitanteId, unidadeId, data de fechamento

#### Scenario: Apenas nota numérica é registrada
- **WHEN** um Solicitante está na tela de avaliação
- **THEN** o sistema apresenta apenas as 5 estrelas para seleção, sem campo de texto para comentário qualitativo

### Requirement: Fechamento administrativo sem avaliação
O sistema NÃO DEVE acionar a pesquisa de satisfação quando o fechamento for realizado por Gestor de TI ou Diretor (fechamento administrativo). Nesse caso, o chamado DEVE ser fechado diretamente, sem registro de nota.

#### Scenario: Gestor fecha sem pesquisa
- **WHEN** um Gestor de TI aciona "Fechar Chamado" em um chamado "Resolvido" de sua Unidade
- **THEN** o chamado transita para "Fechado" sem apresentar tela de avaliação e sem registrar nota de satisfação

#### Scenario: Admin fecha sem pesquisa
- **WHEN** o Administrador do Sistema aciona "Fechar Chamado" em um chamado "Resolvido"
- **THEN** o chamado transita para "Fechado" sem pesquisa de satisfação

### Requirement: Disponibilidade da nota para relatórios
O sistema SHALL disponibilizar as notas de satisfação registradas para consulta nos relatórios gerenciais (Change 5). Os dados DEVEM incluir: nota, identificador do chamado, Solicitante, Unidade e data de fechamento. Chamados fechados administrativamente (sem nota) DEVEM ser excluídos do cálculo da Satisfação Média.

#### Scenario: Notas disponíveis para relatórios
- **WHEN** um relatório gerencial consulta a satisfação média de uma Unidade
- **THEN** o sistema calcula a média apenas com os chamados que possuem nota registrada, ignorando fechamentos administrativos
