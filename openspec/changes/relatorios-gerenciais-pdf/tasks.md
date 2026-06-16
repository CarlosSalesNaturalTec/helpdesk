# Tasks: Relatórios Gerenciais e Exportação PDF

## 1. Backend — Endpoint de Métricas

- [x] 1.1 Implementar `GET /api/reports/metrics` com query params: `periodo`, `dataInicio` (se custom), `dataFim` (se custom), `unidadeId` (Admin only), `dimensao`
- [x] 1.2 Implementar lógica de escopo: Gestor/Diretor = sua Unidade; Admin = `unidadeId` opcional (consolidado se omitido)
- [x] 1.3 Implementar query de cards-resumo: Total Tickets, Taxa Fechamento (fechados/total × 100), Satisfação Média (AVG excluindo fechamentos admin)
- [x] 1.4 Implementar cálculo do TMA com window functions PostgreSQL: `LAG` para capturar transições, subtração do tempo em Aguardando
- [x] 1.5 Implementar query de distribuição com whitelist de dimensões (status, prioridade, categoria, satisfacao, unidade) e SQL dinâmico seguro
- [x] 1.6 Retornar resposta `{ cards: {...}, distribuicao: [{ label, count }] }`

## 2. Backend — Geração de PDF

- [x] 2.1 Instalar `pdfkit` no backend
- [x] 2.2 Implementar `POST /api/reports/pdf` recebendo `{ cards, chartImage, dimensao, periodoLabel, unidadeLabel }`
- [x] 2.3 Montar PDF com PDFKit: cabeçalho (título, período, Unidade), 4 cards em grid, imagem do gráfico, rodapé (usuário, data/hora)
- [x] 2.4 Tratar cenário sem dados: cards zerados + mensagem "Não há dados disponíveis para os filtros selecionados"
- [x] 2.5 Retornar PDF como stream com headers `Content-Type: application/pdf` e `Content-Disposition: attachment`

## 3. Frontend — Tela de Relatórios

- [x] 3.1 Criar hook `useReportMetrics(filtros)` com React Query chamando `GET /api/reports/metrics`
- [x] 3.2 Criar filtro de período: botões "30 dias", "60 dias", "90 dias" + opção "Personalizado" com date inputs
- [x] 3.3 Criar seletor de dimensão para gráfico: dropdown com Status, Prioridade, Categoria, Satisfação (+ Unidade para Admin)
- [x] 3.4 Criar seletor de Unidade visível apenas para Admin (reutilizar componente do Dashboard)
- [x] 3.5 Exibir 4 cards-resumo (Total, Taxa Fechamento %, TMA horas, Satisfação Média) no topo da tela
- [x] 3.6 Exibir gráfico de distribuição (pizza para Status/Satisfação, barras para demais) que atualiza conforme dimensão selecionada
- [x] 3.7 Para Admin com dimensão "Unidade", exibir gráfico de barras comparativo entre Unidades

## 4. Frontend — Exportação PDF

- [x] 4.1 Instalar `html-to-image` ou `react-to-image` para capturar gráfico como imagem
- [x] 4.2 Criar botão "Gerar PDF" com estado de loading (spinner + desabilitado)
- [x] 4.3 Implementar fluxo: capturar gráfico como PNG base64 → enviar para `POST /api/reports/pdf` com dados dos cards → receber blob → disparar download
- [x] 4.4 Tratar cenário sem dados: enviar cards zerados e mensagem; PDF é gerado sem erros

## 5. Testes Manuais e Integração

- [x] 5.1 Verificar métricas locais: Gestor da Unidade A vê apenas dados da Unidade A
- [x] 5.2 Verificar métricas consolidadas: Admin sem filtro vê soma de todas as Unidades
- [x] 5.3 Verificar TMA descontando Aguardando: criar chamado com pausa em Aguardando e verificar cálculo
- [x] 5.4 Verificar Satisfação Média excluindo fechamentos administrativos
- [x] 5.5 Verificar gráfico de distribuição: alternar dimensões e validar contagens
- [x] 5.6 Verificar Admin comparando Unidades no gráfico de barras
- [x] 5.7 Verificar geração de PDF: download automático, cards corretos, gráfico visível, metadados no rodapé
- [x] 5.8 Verificar PDF sem dados: valores zerados, mensagem informativa, sem erro
- [x] 5.9 Verificar indicador de progresso durante geração do PDF
- [x] 5.10 Verificar filtro de período: 30, 60, 90 dias e personalizado
