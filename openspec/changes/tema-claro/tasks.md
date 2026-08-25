# Tarefas — Tema claro

Ordem deliberada: inverter os tokens **antes** de tokenizar os literais. A interface fica temporariamente quebrada de um jeito útil — cada cor escura hardcoded salta à vista e vira item de lista, em vez de ser caçada arquivo por arquivo.

## 1. Camada de tokens

- [ ] 1.1 `frontend/src/index.css`: inverter o `:root` para a paleta clara conforme a tabela em `design.md` — superfícies, texto, bordas e sombras. `--primary`, `--success`, `--danger` e `--warning` mantêm o matiz. (~2h)
- [ ] 1.2 Definir `--bg-main` como claro suave com gradiente discreto (não branco chapado) e aplicar em `body`, para dar substrato ao `backdrop-filter`. (~1h)
- [ ] 1.3 Converter os tokens `--*-glow` de halo luminoso para tint de superfície: em fundo claro eles passam a ser fundo suave de badge/card, não sombra colorida. (~1h)
- [ ] 1.4 Escurecer `--text-muted` (hoje `#94a3b8`, ≈2.5:1 sobre branco — reprova em AA) e conferir cada token de texto com um verificador de contraste. (~1h)

## 2. Folha de estilo — componentes

- [ ] 2.1 `.glass-panel`: fundo branco translúcido, borda de baixo contraste, sombra suave; manter `backdrop-filter: blur(12px)`. (~1h)
- [ ] 2.2 `.navbar` e `.nav-link`: superfícies, estados `hover`/`active` e separadores no tema claro. (~2h)
- [ ] 2.3 `.input-field`: o fundo atual é `rgba(15,23,42,.6)` fixo — trocar por token claro e revisar `:focus` e `:disabled`. (~1h)
- [ ] 2.4 `.btn` e variantes: `--primary` mantém o matiz, mas as sombras coloridas precisam ser reduzidas para não borrar em claro. (~1h)
- [ ] 2.5 `.data-table` e `.data-table-container`: cabeçalho, listras, bordas e `hover` de linha. (~2h)
- [ ] 2.6 Badges de papel e de status: fundo, texto e borda de cada variante, verificando contraste individualmente e mantendo os matizes semânticos distinguíveis. (~2h)
- [ ] 2.7 Varrer os ~59 literais restantes de `index.css` fora de `var(--)` e convertê-los em tokens. (~2h)

## 3. Componentes React com cor inline

- [ ] 3.1 `pages/Login.tsx:63,74`: substituir o gradiente radial escuro e o texto em gradiente por uma composição clara. É a primeira tela que qualquer usuário vê. (~2h)
- [ ] 3.2 `components/TrendChart.tsx`: recalibrar grade (hoje `rgba(255,255,255,.05)`, invisível em claro), tooltip (hoje escuro), eixos e `fill` dos pontos (hoje `#0b0f19`). (~2h)
- [ ] 3.3 `components/StatusCard.tsx`: converter as bordas `rgba` por status em tokens. (~1h)
- [ ] 3.4 Restantes: `Guards`, `NotificationBell`, `SectorSelector`, `StarRating`, `UnitSelector`, `AbrirChamado`, `ChangePassword`, `DetalhesChamado`, `Relatorios`, `usuarios/Usuarios`. (~3h)
- [ ] 3.5 Conferir que `grep -rnE "#[0-9a-fA-F]{3,8}|rgba\(" frontend/src --include=*.tsx` não retorna cores de apresentação. (~30min)

## 4. Logomarca

- [ ] 4.1 Acomodar a logomarca néon numa cápsula escura contida na navbar, preservando seu contraste sem alterar o ativo nem o mapa `VARIANTS` de `BrandLogo.tsx`. (~2h)

## 5. Verificação

Não há suíte automatizada; a verificação é visual e manual.

- [ ] 5.1 Percorrer todas as telas em tema claro: Login, Troca de Senha, Dashboard, Chamados, Detalhes, Abrir Chamado, Relatórios, Usuários, Unidades, Tipos de Ocorrência, Tipos de Problema.
- [ ] 5.2 Verificar os estados que passam despercebidos numa varredura rápida: modais, dropdowns, campos desabilitados, mensagens de erro de validação, estados vazios e de carregamento, e o sino de notificações com e sem itens.
- [ ] 5.3 Rodar um verificador de contraste (DevTools ou similar) sobre texto secundário, badges e botões; confirmar AA.
- [ ] 5.4 Conferir a responsividade em ≤640px — a navbar colapsada e o layout em cartões de `Chamados` têm superfícies próprias.
- [ ] 5.5 Gerar um relatório em PDF e confirmar que o gráfico capturado por `html-to-image` ficou coerente com a folha branca. Nenhuma alteração de backend deve ser necessária.
- [ ] 5.6 Confirmar que o `backdrop-filter` ainda produz efeito visível — se não produzir, o `--bg-main` ficou claro demais.
- [ ] 5.7 Atualizar `docs/manual/` onde houver captura de tela ou descrição da aparência da interface.
