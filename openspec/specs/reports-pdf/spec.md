# Spec: Exportação de Relatórios em PDF (reports-pdf)

## Purpose
Geração de documento PDF com os dados e gráficos dos relatórios, permitindo compartilhamento formal dos indicadores com stakeholders.

## Requirements

### Requirement: Geração de PDF com dados atuais
O sistema SHALL gerar um arquivo PDF a partir dos filtros atualmente aplicados na tela de Relatórios — período, Unidade e Tipo de Ocorrência — respeitando o escopo do papel de quem o solicita. O PDF DEVE conter: os quatro cards-resumo com seus valores, o gráfico de distribuição ou comparação selecionado com legenda, **a lista dos chamados do escopo filtrado**, a data e hora de geração, e o nome do usuário que gerou o documento.

Os cards e a lista SHALL ser apurados pelo servidor a partir dos mesmos filtros, de modo que os números impressos e as linhas listadas descrevam necessariamente o mesmo conjunto de chamados. O gráfico SHALL continuar sendo produzido pelo cliente, por depender de renderização visual.

A funcionalidade SHALL estar disponível a Gestor, Diretor e Administrador.

#### Scenario: PDF com dados filtrados
- **WHEN** um Gestor com filtro "Últimos 30 dias" e dimensão "Categoria" aciona "Gerar PDF"
- **THEN** o sistema gera um PDF contendo os cards-resumo dos últimos 30 dias da sua Unidade e da sua área, o gráfico de distribuição por Categoria, a lista dos chamados correspondentes, a data/hora atual e o nome do Gestor

#### Scenario: Download automático
- **WHEN** a geração do PDF é concluída
- **THEN** o download do arquivo é iniciado automaticamente no navegador

#### Scenario: Cards e lista descrevem o mesmo conjunto
- **WHEN** qualquer usuário autorizado gera o PDF
- **THEN** o valor do card "Total de Chamados" corresponde à quantidade de chamados listados, ressalvado o corte por volume máximo

#### Scenario: Nome real da Unidade no cabeçalho
- **WHEN** um Admin filtra por uma Unidade específica e gera o PDF
- **THEN** o cabeçalho exibe o nome da Unidade selecionada, e não um rótulo genérico

### Requirement: Indicador de progresso na geração
O sistema SHALL exibir um indicador de progresso durante a geração do PDF, informando ao usuário que o processamento está em andamento. A geração DEVE ser concluída em até 10 segundos para volumes de até 300 chamados no escopo do filtro, e NÃO DEVE exceder o volume máximo de chamados listados definido para o documento.

#### Scenario: Progresso visível durante geração
- **WHEN** o usuário aciona "Gerar PDF"
- **THEN** um spinner ou barra de progresso é exibido e o botão é desabilitado até a conclusão do download

#### Scenario: Timeout aceitável
- **WHEN** o volume de chamados no escopo é ≤ 300
- **THEN** a geração e o download são concluídos em até 10 segundos

#### Scenario: Geração no volume máximo permanece viável
- **WHEN** o escopo do filtro atinge o volume máximo de chamados listados
- **THEN** a geração é concluída sem esgotar a memória da instância e sem interromper o download

### Requirement: PDF sem dados
O sistema SHALL gerar um PDF mesmo quando não houver chamados para os filtros aplicados. Neste caso, o PDF DEVE conter os cards-resumo com valores zerados e a mensagem "Não há dados disponíveis para os filtros selecionados" no lugar do gráfico **e no lugar da lista de chamados**, sem erros de processamento.

#### Scenario: PDF com filtros sem resultados
- **WHEN** um Diretor aplica um filtro de período que não contém chamados e aciona "Gerar PDF"
- **THEN** o sistema gera um PDF limpo com cards zerados (Total: 0, Taxa: 0%, TMA: 0h, Satisfação: 0.0) e mensagem "Não há dados disponíveis para os filtros selecionados"
- **AND** nenhum grupo de Unidade ou Tipo de Ocorrência vazio é impresso

### Requirement: Metadados do PDF
O sistema SHALL incluir no rodapé ou cabeçalho do PDF: data e hora de geração (formato DD/MM/AAAA HH:MM) e nome do usuário que gerou o documento.

#### Scenario: Rodapé com metadados
- **WHEN** o usuário "Maria Silva" gera um PDF em 15/06/2026 às 14:30
- **THEN** o PDF contém "Gerado por Maria Silva em 15/06/2026 14:30"
### Requirement: Lista de chamados agrupada por Unidade e Tipo de Ocorrência
O sistema SHALL incluir no PDF a lista dos chamados do escopo filtrado, agrupada hierarquicamente por **Unidade** e, dentro de cada Unidade, por **Tipo de Ocorrência**, exibindo o subtotal de cada grupo. Cada chamado SHALL aparecer uma única vez.

Cada linha SHALL conter: número do chamado, local, tipo de problema, status, urgência, solicitante, técnico responsável e data de abertura. Campos sem valor — como o técnico de um chamado ainda não atribuído — DEVEM ser representados por um marcador neutro, nunca por espaço em branco ambíguo.

#### Scenario: Admin obtém a árvore completa
- **WHEN** o Admin gera o PDF sem filtrar Unidade nem Tipo de Ocorrência
- **THEN** o documento traz uma seção por Unidade, subdividida por Tipo de Ocorrência, com o subtotal de cada nível
- **AND** a soma dos subtotais de Tipo de Ocorrência de uma Unidade é igual ao subtotal daquela Unidade

#### Scenario: Gestor obtém um único ramo
- **WHEN** um Gestor de "Manutenção" da "Unidade A" gera o PDF
- **THEN** o documento contém apenas a "Unidade A" e apenas o Tipo de Ocorrência "Manutenção"
- **AND** nenhum chamado de outra Unidade ou de outra área aparece na lista

#### Scenario: Diretor obtém os Tipos de Ocorrência da sua Unidade
- **WHEN** um Diretor da "Unidade A" gera o PDF sem filtrar Tipo de Ocorrência
- **THEN** o documento contém apenas a "Unidade A", subdividida por todos os seus Tipos de Ocorrência

#### Scenario: Chamado sem técnico atribuído
- **WHEN** a lista inclui um chamado com status "Aberto", ainda sem responsável
- **THEN** a coluna de técnico exibe um marcador neutro

#### Scenario: Lista respeita o filtro de período
- **WHEN** um usuário aplica um período personalizado e gera o PDF
- **THEN** apenas chamados abertos dentro desse período compõem a lista e os subtotais

### Requirement: Volume máximo de chamados no PDF
O sistema SHALL limitar a lista a 1000 chamados por documento. Quando o escopo filtrado exceder esse limite, o PDF SHALL informar explicitamente que a lista foi truncada, indicar o total real de chamados no escopo e orientar o refinamento do filtro.

Os cards-resumo SHALL continuar refletindo o **total real** do escopo, e não o subconjunto listado.

#### Scenario: Escopo excede o limite
- **WHEN** um Admin gera o PDF para um escopo com 3742 chamados
- **THEN** a lista contém no máximo 1000 chamados
- **AND** o documento informa que a lista foi truncada e que o escopo tem 3742 chamados
- **AND** o card "Total de Chamados" exibe 3742

#### Scenario: Escopo dentro do limite não exibe aviso
- **WHEN** o escopo filtrado contém 240 chamados
- **THEN** todos são listados e nenhum aviso de truncamento é exibido

#### Scenario: Geração não é recusada por volume
- **WHEN** o escopo excede o limite
- **THEN** o PDF é gerado normalmente, com a lista truncada, em vez de a geração ser recusada

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
