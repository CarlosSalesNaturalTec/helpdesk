## Why

O PDF de relatórios entrega hoje apenas indicadores agregados: quatro cards e um gráfico. Quem precisa agir sobre os números — saber *quais* chamados compõem um total — não tem para onde ir a partir do documento.

A arquitetura atual impede acrescentar essa lista sem mudança estrutural. O frontend renderiza o gráfico, calcula os cards e **posta tudo pronto** para o backend, que apenas desenha (`reports.ts:24`, e o `CLAUDE.md` registra: "the backend does not recompute metrics for the PDF"). Uma lista de chamados não cabe nesse modelo: o cliente só tem a página corrente da listagem, com 20 itens.

Há ainda uma lacuna de filtro. O relatório deve ser agrupado por Unidade e por Tipo de Ocorrência, mas a tela de Relatórios **não tem seletor de Tipo de Ocorrência** — embora `GET /api/reports/metrics` já aceite esse filtro para o Admin (`reports.ts:147`). O Diretor, que supervisiona todos os Tipos de Ocorrência da sua Unidade, hoje tem esse parâmetro **ignorado**.

E um defeito visível: `Relatorios.tsx:58` envia `unidadeLabel: 'Filtrada'`, com o comentário `// idealmente o nome real`. O PDF imprime literalmente "Unidade: Filtrada".

## What Changes

- O backend passa a **consultar os chamados** do escopo filtrado e a compô-los no PDF, agrupados hierarquicamente: **Unidade → Tipo de Ocorrência → chamados**, com subtotais por grupo.
- Colunas da lista: número, título, tipo de problema, status, urgência, solicitante, técnico e data de abertura.
- O backend passa a **recalcular também os cards**, em vez de recebê-los prontos. Como já consultará o banco para a lista, isso elimina o risco de um mesmo PDF ter cards de uma fonte e lista de outra, discordando entre si. O gráfico continua vindo do cliente — é renderização de DOM, impossível no servidor.
- **Teto de volume:** a lista é limitada a 1000 chamados, com aviso no documento quando o escopo excede esse número. Sem teto, 90 dias em todas as Unidades montariam milhares de linhas em memória numa instância de 512 MiB.
- A tela de Relatórios ganha seletor de Tipo de Ocorrência, reaproveitando o `SectorSelector` já existente.
- O Diretor passa a poder filtrar por Tipo de Ocorrência — dentro da sua Unidade, é estreitamento do que ele já enxerga, não ampliação de escopo.
- Corrigir `unidadeLabel` para o nome real da Unidade.

Disponível para Gestor, Diretor e Admin, como a rota já permite. O agrupamento degrada bem: o Gestor vê uma Unidade e um Tipo; o Diretor, uma Unidade e vários Tipos; o Admin, vários de cada.

## Capabilities

### Modified Capabilities
- `reports-pdf`: o documento passa a conter a lista de chamados agrupada, com os dados apurados no servidor.
- `reports-metrics`: filtro por Tipo de Ocorrência disponível também ao Diretor, e exposto na tela.

## Impact

- **Backend:** `routes/reports.ts` — nova consulta, composição hierárquica do PDF e recálculo dos cards.
- **Frontend:** `pages/Relatorios.tsx` — seletor de Tipo de Ocorrência, correção do rótulo de Unidade, payload reduzido ao gráfico e aos filtros.
- **Desempenho:** o spec vigente exige conclusão em até 10 s para até 300 chamados; o teto de 1000 amplia o pior caso e precisa ser medido.
- Sem migration.
- **Docs:** `docs/manual/funcionalidades/relatorios-dashboard.md`.

## Non-goals

- Exportação em CSV ou XLSX.
- Agrupamento por perfil de usuário — avaliado e descartado.
- Paginação, ordenação ou escolha de colunas pelo usuário.
- Gráficos renderizados no servidor.
- Envio do relatório por e-mail ou agendamento periódico.
- Incluir o histórico ou as mensagens de cada chamado.
