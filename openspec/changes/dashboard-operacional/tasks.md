# Tasks: Dashboard Operacional

## 1. Backend — Endpoint do Dashboard

- [ ] 1.1 Implementar `GET /api/dashboard` com query param opcional `unidadeId` (só Admin pode usar)
- [ ] 1.2 Implementar lógica de escopo: Admin usa `unidadeId` opcional; outros usam `unidadeId` do JWT obrigatoriamente
- [ ] 1.3 Implementar query de cards com `COUNT FILTER` para Abertos, Em Andamento, Resolvidos, Críticos
- [ ] 1.4 Implementar query de tendência com `generate_series` 30 dias + `LEFT JOIN` duplo (aberturas e fechamentos)
- [ ] 1.5 Executar queries de cards e trend em paralelo com `Promise.all`
- [ ] 1.6 Retornar resposta no formato `{ cards: {...}, trend: [...] }`

## 2. Frontend — Cards de Status

- [ ] 2.1 Criar hook `useDashboard(unidadeId?)` com React Query chamando `GET /api/dashboard`
- [ ] 2.2 Criar componente `StatusCard` com ícone, label, valor numérico e cor de fundo (azul, âmbar, verde, vermelho)
- [ ] 2.3 Montar grid de 4 colunas com os cards no topo da página de Dashboard

## 3. Frontend — Gráfico de Tendência

- [ ] 3.1 Instalar `recharts` no frontend
- [ ] 3.2 Criar componente `TrendChart` com `LineChart`, duas `Line` (abertos azul, fechados verde), grid, tooltip e legenda
- [ ] 3.3 Formatar eixo X como datas abreviadas (ex: "16/05") e eixo Y com inteiros
- [ ] 3.4 Tratar período com menos de 30 dias: gráfico se ajusta aos dados disponíveis sem quebras

## 4. Frontend — Seletor de Unidade (Admin)

- [ ] 4.1 Criar componente `UnitSelector` no topo do Dashboard, visível apenas para Admin
- [ ] 4.2 Preencher dropdown com lista de Unidades do endpoint `GET /api/unidades` (já existe do Change 1)
- [ ] 4.3 Ao selecionar Unidade, refetch dos dados do dashboard com `unidadeId`
- [ ] 4.4 Opção "Todas as Unidades" como default para Admin

## 5. Frontend — Integração e Rotas

- [ ] 5.1 Configurar Dashboard como tela inicial (landing page) para Técnico, Gestor, Diretor e Admin após login
- [ ] 5.2 Adicionar link "Dashboard" na navegação principal para esses papéis

## 6. Testes Manuais

- [ ] 6.1 Verificar cards para Técnico: números correspondem apenas à sua Unidade
- [ ] 6.2 Verificar cards para Admin: sem filtro = soma de todas Unidades; com filtro = Unidade específica
- [ ] 6.3 Verificar gráfico: período de 30 dias, dias vazios com zero, duas séries visíveis
- [ ] 6.4 Verificar atualização: abrir novo chamado → recarregar Dashboard → card Abertos incrementa
- [ ] 6.5 Verificar que Solicitante não acessa o Dashboard (redirecionado para Abrir Chamado)
