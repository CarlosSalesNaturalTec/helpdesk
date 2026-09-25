# Relatórios e dashboard

Disponíveis para Técnico (dashboard apenas), Gestor, Diretor e Administrador — não aparecem para o Solicitante.

## Dashboard

O **Dashboard** mostra, para a Unidade do usuário (ou, para Técnico e Gestor, também restrito ao seu Tipo de Ocorrência):

- Cartões com a contagem de chamados **Abertos**, **Em Andamento**, **Resolvidos** e **Críticos** (urgência Crítica, ainda não fechados).
- Um gráfico de tendência dos últimos 30 dias, comparando chamados abertos e fechados por dia.

O Administrador pode filtrar por Unidade e por Tipo de Ocorrência; o Diretor vê sempre o escopo da própria Unidade em todas as áreas; o Gestor e o Técnico veem apenas a própria Unidade e o próprio Tipo de Ocorrência.

### Dos cartões para os chamados

Clique em um cartão (ou selecione-o com a tecla Tab e pressione Enter) para abrir a tela [Chamados](listagem-chamados.md) já filtrada pelo mesmo critério da contagem:

| Cartão | Abre a listagem filtrada por |
| --- | --- |
| Abertos | status Aberto e Reaberto |
| Em Andamento | status Em Andamento e Aguardando |
| Resolvidos | status Resolvido |
| Críticos | urgência Crítica e todos os status exceto Fechado |

Se o Administrador tiver selecionado uma Unidade ou um Tipo de Ocorrência no Dashboard, esses recortes vão junto para a listagem. O número de chamados encontrados na listagem é o mesmo exibido no cartão.

Os cartões da tela de Relatórios são apenas informativos e não levam a outra tela.

## Relatórios

Em **Relatórios** (Gestor, Diretor, Administrador), escolha um período — predefinido em dias, ou um intervalo de datas customizado — para ver:

- **Cartões de métricas:** total de chamados, taxa de fechamento, tempo médio de atendimento (TMA, que desconta o tempo em que o chamado ficou Aguardando) e satisfação média.
- **Distribuição** por status, prioridade, categoria (Tipo de Problema) ou satisfação. A dimensão "Unidade" só está disponível para o Administrador.

O Administrador pode filtrar por Unidade e por Tipo de Ocorrência. O Diretor vê sempre a própria Unidade e pode, opcionalmente, estreitar os números a um Tipo de Ocorrência — o filtro nunca mostra dados de outra Unidade. O Gestor vê sempre a própria Unidade restrita ao seu Tipo de Ocorrência, por isso o seletor de Tipo de Ocorrência não aparece para ele.

## Exportação em PDF

O botão **Gerar PDF** monta um documento com os filtros aplicados na tela (período, Unidade e Tipo de Ocorrência). Enquanto o documento é gerado, o botão mostra "Gerando PDF..." e fica desabilitado; ao final, o download começa automaticamente.

O PDF contém:

- **Cabeçalho** com o período, o nome da Unidade (ou "Todas") e o Tipo de Ocorrência (ou "Todos") considerados.
- **Cartões de métricas** — total, taxa de fechamento, TMA e satisfação média.
- **Gráfico** da dimensão selecionada, exatamente como aparece na tela.
- **Lista de chamados** do escopo filtrado, com número, local, tipo de problema, status, urgência, solicitante, técnico e data de abertura. Chamados ainda sem técnico mostram "—" na coluna de técnico, e chamados sem local registrado mostram "—" na coluna de local.
- Em todas as páginas, o nome de quem gerou o documento, a data/hora e a numeração de páginas.

Os cartões e a lista são apurados pelo servidor a partir dos mesmos filtros, no momento da geração — por isso o total do cartão sempre corresponde à quantidade de chamados listados.

### Agrupamento da lista

A lista é agrupada por **Unidade** e, dentro de cada Unidade, por **Tipo de Ocorrência**, com o subtotal de cada grupo. Cada chamado aparece uma única vez, então os subtotais dos Tipos de Ocorrência somam o subtotal da Unidade.

| Perfil | O que a lista traz |
| --- | --- |
| Gestor | A própria Unidade, apenas o seu Tipo de Ocorrência |
| Diretor | A própria Unidade, com todos os Tipos de Ocorrência (ou só o selecionado) |
| Administrador | Todas as Unidades e Tipos de Ocorrência (ou só os selecionados) |

### Limite de 1000 chamados

A lista traz no máximo os **1000 chamados mais recentes** do escopo. Quando o filtro abrange mais do que isso, o PDF avisa que a lista foi truncada e informa o total real — os cartões continuam mostrando o total real. Para ver a lista completa, reduza o período ou filtre por Unidade ou Tipo de Ocorrência.

### Sem dados

Se não houver chamados para os filtros aplicados, o PDF traz os cartões zerados e a mensagem "Não há dados disponíveis para os filtros selecionados" no lugar do gráfico e da lista.
