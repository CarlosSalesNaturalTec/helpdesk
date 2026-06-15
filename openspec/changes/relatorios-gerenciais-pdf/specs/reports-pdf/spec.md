# Spec: Exportação de Relatórios em PDF (reports-pdf)

Geração de documento PDF com os dados e gráficos dos relatórios, permitindo compartilhamento formal dos indicadores com stakeholders.

## ADDED Requirements

### Requirement: Geração de PDF com dados atuais
O sistema SHALL gerar um arquivo PDF a partir dos dados atualmente visíveis na tela de Relatórios, respeitando os filtros de Unidade e período aplicados. O PDF DEVE conter: os quatro cards-resumo com seus valores, o gráfico de distribuição ou comparação selecionado com legenda, a data e hora de geração, e o nome do usuário que gerou o documento.

#### Scenario: PDF com dados filtrados
- **WHEN** um Gestor de TI com filtro "Últimos 30 dias" e dimensão "Categoria" aciona "Gerar PDF"
- **THEN** o sistema gera um PDF contendo os cards-resumo dos últimos 30 dias da sua Unidade, o gráfico de distribuição por Categoria, a data/hora atual e o nome do Gestor

#### Scenario: Download automático
- **WHEN** a geração do PDF é concluída
- **THEN** o download do arquivo é iniciado automaticamente no navegador

### Requirement: Indicador de progresso na geração
O sistema SHALL exibir um indicador de progresso durante a geração do PDF, informando ao usuário que o processamento está em andamento. A geração DEVE ser concluída em até 10 segundos para volumes de até 300 chamados no escopo do filtro.

#### Scenario: Progresso visível durante geração
- **WHEN** o usuário aciona "Gerar PDF"
- **THEN** um spinner ou barra de progresso é exibido e o botão é desabilitado até a conclusão do download

#### Scenario: Timeout aceitável
- **WHEN** o volume de chamados no escopo é ≤ 300
- **THEN** a geração e o download são concluídos em até 10 segundos

### Requirement: PDF sem dados
O sistema SHALL gerar um PDF mesmo quando não houver chamados para os filtros aplicados. Neste caso, o PDF DEVE conter os cards-resumo com valores zerados e a mensagem "Não há dados disponíveis para os filtros selecionados" no lugar do gráfico, sem erros de processamento.

#### Scenario: PDF com filtros sem resultados
- **WHEN** um Diretor aplica um filtro de período que não contém chamados e aciona "Gerar PDF"
- **THEN** o sistema gera um PDF limpo com cards zerados (Total: 0, Taxa: 0%, TMA: 0h, Satisfação: 0.0) e mensagem "Não há dados disponíveis para os filtros selecionados"

### Requirement: Metadados do PDF
O sistema SHALL incluir no rodapé ou cabeçalho do PDF: data e hora de geração (formato DD/MM/AAAA HH:MM) e nome do usuário que gerou o documento.

#### Scenario: Rodapé com metadados
- **WHEN** o usuário "Maria Silva" gera um PDF em 15/06/2026 às 14:30
- **THEN** o PDF contém "Gerado por Maria Silva em 15/06/2026 14:30"
