# Proposal: Relatórios Gerenciais e Exportação PDF

## Why

Diretores e Gestores de TI precisam prestar contas sobre a operação de suporte e identificar gargalos. O Dashboard (Change 4) oferece visão operacional imediata, mas não responde perguntas gerenciais como "qual o tempo médio de atendimento este mês?", "qual categoria de problema é mais frequente?" ou "como a Unidade A se compara à Unidade B?". Relatórios com métricas calculadas, gráficos de distribuição e exportação PDF suprem a necessidade de análise, documentação formal e compartilhamento com stakeholders que não acessam o sistema.

## What Changes

- Quatro cards-resumo: Total de Tickets, Taxa de Fechamento (%), Tempo Médio de Atendimento em horas e Satisfação Média (1-5)
- TMA com desconto automático do tempo em status "Aguardando"
- Satisfação Média excluindo fechamentos administrativos (sem nota)
- Gráfico de distribuição com dimensões selecionáveis: Status, Prioridade, Categoria, Satisfação
- Visão comparativa entre Unidades para Admin (gráfico de barras)
- Filtro de período (30, 60, 90 dias ou período customizado)
- Exportação para PDF contendo cards, gráfico, data/hora de geração e nome do usuário
- Indicador de progresso durante a geração do PDF (RNF10)
- PDF com valores zerados e mensagem informativa quando não houver dados

## Capabilities

### New Capabilities

- `reports-metrics`: Cards-resumo gerenciais com métricas calculadas (Total, Taxa Fechamento, TMA, Satisfação Média) e gráficos de distribuição por dimensões selecionáveis. TMA desconta tempo Aguardando. Satisfação Média exclui fechamentos administrativos. Visão local (Diretor/Gestor) ou global/comparativa (Admin)
- `reports-pdf`: Geração de arquivo PDF a partir dos dados exibidos na tela de relatórios, contendo cards-resumo, gráfico, metadados (data/hora, usuário) e tratamento de cenário sem dados. Download automático com indicador de progresso durante a geração

### Modified Capabilities

_Nenhuma — este change apenas consulta dados de tickets e satisfação, não altera requisitos existentes._

## Impact

- **Backend**: Endpoint `GET /api/reports/metrics` para cards e gráficos, endpoint `POST /api/reports/pdf` para geração de PDF
- **Frontend**: Tela de Relatórios com cards-resumo, filtro de período e dimensão, gráfico de distribuição (pizza/barras), botão "Gerar PDF" com progresso
- **Dependências**: Change 1 (auth, Unidades), Change 2 (tickets, satisfação), PDFKit (geração server-side)
- **Performance**: Query de TMA requer window functions PostgreSQL; PDF exige streaming para caber no limite de 10s (RNF10)

## Non-goals

- Agendamento de relatórios automáticos (envio periódico por e-mail)
- Templates de PDF customizáveis (logo, cores da Unidade)
- Exportação para CSV/Excel — apenas PDF no MVP
- Drill-down nos gráficos de distribuição
