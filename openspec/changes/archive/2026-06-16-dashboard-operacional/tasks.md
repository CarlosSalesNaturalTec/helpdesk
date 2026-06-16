# Tasks: Dashboard Operacional

## 1. Backend — Endpoint do Dashboard

- [x] 1.1 Implementar `GET /api/dashboard` com query param opcional `unidadeId` (só Admin pode usar)
- [x] 1.2 Implementar lógica de escopo: Admin usa `unidadeId` opcional; outros usam `unidadeId` do JWT obrigatoriamente
- [x] 1.3 Implementar query de cards com `COUNT FILTER` para Abertos, Em Andamento, Resolvidos, Críticos
- [x] 1.4 Implementar query de tendência com `generate_series` 30 dias + `LEFT JOIN` duplo (aberturas e fechamentos)
- [x] 1.5 Executar queries de cards e trend em paralelo com `Promise.all`
- [x] 1.6 Retornar resposta no formato `{ cards: {...}, trend: [...] }`

## 2. Frontend — Cards de Status

- [x] 2.1 Criar hook `useDashboard(unidadeId?)` com React Query chamando `GET /api/dashboard`
- [x] 2.2 Criar componente `StatusCard` com ícone, label, valor numérico e cor de fundo (azul, âmbar, verde, vermelho)
- [x] 2.3 Montar grid de 4 colunas com os cards no topo da página de Dashboard

## 3. Frontend — Gráfico de Tendência

- [x] 3.1 Instalar `recharts` no frontend
- [x] 3.2 Criar componente `TrendChart` com `LineChart`, duas `Line` (abertos azul, fechados verde), grid, tooltip e legenda
- [x] 3.3 Formatar eixo X como datas abreviadas (ex: "16/05") e eixo Y com inteiros
- [x] 3.4 Tratar período com menos de 30 dias: gráfico se ajusta aos dados disponíveis sem quebras

## 4. Frontend — Seletor de Unidade (Admin)

- [x] 4.1 Criar componente `UnitSelector` no topo do Dashboard, visível apenas para Admin
- [x] 4.2 Preencher dropdown com lista de Unidades do endpoint `GET /api/unidades` (já existe do Change 1)
- [x] 4.3 Ao selecionar Unidade, refetch dos dados do dashboard com `unidadeId`
- [x] 4.4 Opção "Todas as Unidades" como default para Admin

## 5. Frontend — Integração e Rotas

- [x] 5.1 Configurar Dashboard como tela inicial (landing page) para Técnico, Gestor, Diretor e Admin após login
- [x] 5.2 Adicionar link "Dashboard" na navegação principal para esses papéis

## 6. Testes Manuais

- [x] 6.1 Verificar cards para Técnico: números correspondem apenas à sua Unidade
- [x] 6.2 Verificar cards para Admin: sem filtro = soma de todas Unidades; com filtro = Unidade específica
- [x] 6.3 Verificar gráfico: período de 30 dias, dias vazios com zero, duas séries visíveis
- [x] 6.4 Verificar atualização: abrir novo chamado → recarregar Dashboard → card Abertos incrementa
- [x] 6.5 Verificar que Solicitante não acessa o Dashboard (redirecionado para Abrir Chamado)
