# Tarefas — Lista de chamados no PDF de relatórios

Ordem: extrair a derivação de escopo → consulta → composição do PDF → frontend → docs. Ler `design.md` antes de começar: esta mudança inverte a origem dos dados do documento.

Depende de `branding-display-isets` estar aplicado — cabeçalho e nome do arquivo do PDF leem o mesmo nome composto.

## 1. Escopo compartilhado entre métricas e PDF

- [x] 1.1 `backend/src/routes/reports.ts`: extrair para uma função única a derivação de período (`periodo` / `dataInicio` / `dataFim`, ~linhas 118-131) e de escopo por papel (~linhas 133-150), hoje vivendo só dentro de `GET /metrics`. A rota de PDF passará a usar a mesma função — sem isso as duas divergem com o tempo. (~3h)
- [x] 1.2 Na mesma função, permitir o filtro de Tipo de Ocorrência para **Diretor**, além de Admin, mantendo o Gestor fixado na própria área. Confirmar que o filtro nunca amplia o escopo: um Diretor informando Tipo de outra Unidade continua restrito à sua (ver `design.md` §4). (~2h)

## 2. Consulta da lista

- [x] 2.1 Implementar a consulta dos chamados do escopo, trazendo número, título, tipo de problema, status, urgência, solicitante, técnico, Unidade, Tipo de Ocorrência e data de abertura, ordenados de modo a permitir o agrupamento. **`Ticket.numero` é BigInt** — serializar com `.toString()`. (~3h)
- [x] 2.2 Aplicar o teto de 1000 chamados na consulta e obter separadamente a contagem total do escopo, necessária ao aviso de truncamento e à coerência com os cards. (~1h)
- [x] 2.3 Agrupar o resultado em Unidade → Tipo de Ocorrência, calculando os subtotais de cada nível. (~2h)

## 3. Composição do PDF

- [x] 3.1 `POST /api/reports/pdf`: passar a receber filtros em vez de cards prontos, mantendo o recebimento do `chartImage`. Recalcular os cards no servidor pela função da tarefa 1.1 (ver `design.md` §1). (~3h)
- [x] 3.2 Desenhar a lista agrupada com PDFKit, com cabeçalhos de grupo, subtotais e quebra de página entre grupos. Marcador neutro para campos vazios, como técnico não atribuído. (~4h)
- [x] 3.3 Imprimir o aviso de truncamento com o total real quando o escopo exceder 1000 chamados. (~1h)
- [x] 3.4 Ajustar o cenário sem dados (~linha 82) para também suprimir a seção de lista, sem imprimir grupos vazios. (~1h)
- [x] 3.5 Substituir o `unidadeLabel` recebido pelo nome real da Unidade, resolvido no servidor — corrigindo o "Unidade: Filtrada" hoje impresso. (~1h)

## 4. Frontend

- [x] 4.1 `frontend/src/pages/Relatorios.tsx`: adicionar o `SectorSelector` à barra de filtros, visível para Admin e Diretor e ausente para Gestor. O componente já existe e é usado no Dashboard. (~2h)
- [x] 4.2 Incluir o Tipo de Ocorrência selecionado na `queryKey` e nos parâmetros de `getReportMetrics`. (~1h)
- [x] 4.3 `handleGeneratePdf` (~linha 35): enviar filtros e `chartImage` no lugar dos cards. Remover o `unidadeLabel: 'Filtrada'` da linha 58. (~2h)
- [x] 4.4 Conferir que o indicador de progresso cobre a nova duração e que o botão permanece desabilitado até a conclusão. (~1h)

## 5. Documentação

- [x] 5.1 Atualizar `docs/manual/funcionalidades/relatorios-dashboard.md`: conteúdo do PDF, agrupamento, novo filtro por Tipo de Ocorrência e limite de 1000 chamados. Rodar `mkdocs build --strict`. (~2h)

## 6. Verificação

Sem suíte automatizada no repositório; verificação manual contra o banco semeado.

- [x] 6.1 Gerar o PDF como Gestor, Diretor e Admin e conferir o agrupamento esperado de cada papel: Gestor com um ramo, Diretor com os Tipos da sua Unidade, Admin com a árvore completa. (~2h)
- [x] 6.2 **Isolamento:** confirmar que o PDF do Gestor não traz nenhum chamado de outra área nem de outra Unidade, e que o do Diretor não vaza outra Unidade. (~2h)
- [x] 6.3 Conferir que os subtotais de Tipo de Ocorrência somam o subtotal da Unidade, e que o total dos cards bate com a quantidade listada quando não há truncamento. (~1h)
- [x] 6.4 Diretor filtrando por um Tipo de Ocorrência: métricas e lista estreitam juntas. Confirmar que o Gestor não recebe o seletor. (~1h)
- [x] 6.5 Gerar com escopo vazio: cards zerados, mensagem no lugar do gráfico e da lista, nenhum grupo vazio impresso. (~30min)
- [x] 6.6 **Volume:** popular acima de 1000 chamados e medir o tempo de geração e a memória da instância. Confirmar o aviso de truncamento com o total real e o card exibindo o total real, não 1000. Rever o teto se o alvo de 10 s para 300 chamados não se sustentar (ver `design.md` §3). (~3h)
- [x] 6.7 Conferir que `numero` aparece corretamente no PDF, sem perda de precisão de BigInt. (~30min)
- [x] 6.8 Cabeçalho exibindo o nome real da Unidade filtrada. (~30min)
- [x] 6.9 `docs/manual/` atualizado. (~item padrão)
