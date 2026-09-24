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

O Administrador pode filtrar por Unidade e por Tipo de Ocorrência; o Diretor vê sempre toda a própria Unidade; o Gestor vê sempre a própria Unidade restrita ao seu Tipo de Ocorrência.

## Exportação em PDF

O botão de exportar gera um PDF com os mesmos cartões e o gráfico exibido na tela. O gráfico é renderizado no navegador (como imagem) e enviado ao servidor junto com os números já calculados — o PDF não recalcula as métricas, apenas monta o documento a partir do que está na tela no momento da exportação.
