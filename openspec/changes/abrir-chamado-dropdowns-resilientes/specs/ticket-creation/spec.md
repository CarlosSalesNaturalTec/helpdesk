# Delta Spec: ticket-creation

## ADDED Requirements

### Requirement: Falha ao carregar dados de referência do formulário é visível e recuperável
O formulário de abertura de chamado depende de três conjuntos de dados de referência carregados do servidor: Tipos de Ocorrência, Tipos de Problema e níveis de urgência. Quando o carregamento de qualquer um deles falhar, o sistema SHALL exibir, no lugar do seletor correspondente, uma mensagem indicando que a lista não pôde ser carregada e uma ação "Tentar novamente" que refaz a busca sem recarregar a página. O sistema NÃO DEVE, em nenhuma hipótese, apresentar um seletor habilitado e vazio como se não houvesse opções cadastradas.

Enquanto qualquer um dos conjuntos de referência estiver ausente, o sistema SHALL manter a ação de envio do chamado desabilitada, informando o motivo.

#### Scenario: Lista de Tipos de Ocorrência falha ao carregar
- **WHEN** a requisição dos Tipos de Ocorrência falha ao abrir a tela "Abrir Novo Chamado"
- **THEN** no lugar do seletor é exibida a mensagem de falha e a ação "Tentar novamente"
- **AND** a ação "Enviar Chamado" permanece desabilitada

#### Scenario: Recuperação sem recarregar a página
- **WHEN** o Solicitante aciona "Tentar novamente" e o servidor responde com sucesso
- **THEN** o seletor é preenchido com as opções, a mensagem de falha desaparece e o envio é liberado, sem que a página seja recarregada

#### Scenario: Falha isolada identifica qual lista quebrou
- **WHEN** apenas a lista de níveis de urgência falha e as demais carregam
- **THEN** somente o seletor de urgência exibe a mensagem de falha, enquanto Tipo de Ocorrência e Tipo de Problema seguem operáveis

#### Scenario: Instabilidade momentânea é absorvida sem erro
- **WHEN** a primeira requisição de um conjunto de referência falha por indisponibilidade momentânea do servidor e uma repetição subsequente tem sucesso
- **THEN** a lista é preenchida normalmente e nenhuma mensagem de falha chega a ser exibida ao Solicitante
