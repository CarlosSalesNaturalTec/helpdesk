## Why

**Diagnóstico: a aplicação hoje não é adaptável a dispositivos móveis.** A investigação do código confirma:

- `frontend/src/index.css` — a **única** folha de estilo carregada (`main.tsx:3`) — tem 477 linhas e **nenhuma media query**. (`App.css` tem media queries, mas é resto do template do Vite e não é importado por ninguém.)
- A navbar (`.navbar`) é uma linha rígida de 70 px com `padding: 0 40px`, marca, até 7 links de navegação, sino de notificações, dados do usuário e botão Sair — em 375 px de largura os links transbordam.
- `.main-content` usa `padding: 40px` fixo; painéis de Login e Troca de Senha são fixos em 420 px / 460 px.
- As tabelas (`.data-table`) não têm contêiner rolável (`.data-table-container` usa `overflow: hidden`) e têm colunas de largura fixa em `Chamados.tsx`.
- `DetalhesChamado.tsx:364` usa `gridTemplateColumns: '2fr 1fr'` fixo; `AbrirChamado.tsx:259`, `'1fr 1fr'`.

O único acerto existente é a meta tag `viewport`, já presente em `index.html:6`. Na prática, em smartphone a aplicação exige zoom e rolagem horizontal.

## What Changes

- Definir breakpoints padrão (`≤ 640px` smartphone, `≤ 1024px` tablet) e adicioná-los ao `index.css`.
- Tornar a navbar colapsável: em telas pequenas, marca + sino + botão hambúrguer; links e ações do usuário num painel deslizante, fechado ao navegar.
- Tornar as tabelas utilizáveis: rolagem horizontal com `overflow-x: auto` no contêiner e, em `Chamados.tsx`, layout de cartões abaixo de 640 px.
- Colapsar para uma coluna os grids fixos de `DetalhesChamado` e `AbrirChamado`; tornar fluidos os painéis de largura fixa de `Login` e `ChangePassword`.
- Reduzir paddings e tamanhos de fonte nos breakpoints; garantir alvos de toque de no mínimo 44 px em botões e links.
- Migrar para classes CSS apenas os inline styles que definem layout (larguras, grids, paddings de contêiner) — sem tocar nos demais.
- Remover `frontend/src/App.css`, código morto do template.

## Capabilities

### New Capabilities
- Nenhuma.

### Modified Capabilities
- `core-ui`: a interface passa a ser responsiva em smartphones e tablets, com navegação colapsável.

## Impact

- **Frontend:** `index.css` (principal), `Layout.tsx` (navbar/menu), `Chamados.tsx`, `DetalhesChamado.tsx`, `AbrirChamado.tsx`, `Login.tsx`, `ChangePassword.tsx`, `Dashboard.tsx`, `Relatorios.tsx` e as telas administrativas; remoção de `App.css`.
- **Backend / banco de dados:** nenhum impacto.

## Non-goals

- Refatorar todos os ~350 inline styles para um design system — apenas os que impedem a responsividade.
- Aplicativo nativo, PWA instalável ou service worker offline.
- Redesenho visual, mudança de paleta ou de tipografia.
- Auditoria completa de acessibilidade (WCAG) — cobre-se apenas o tamanho de alvo de toque.
- Responsividade do gráfico Recharts exportado para o PDF (`html-to-image`), cujo snapshot é gerado em largura fixa de desktop.
