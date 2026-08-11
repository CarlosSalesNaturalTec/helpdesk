## 1. Fundação de CSS responsivo

- [x] 1.1 Remover `frontend/src/App.css` (código morto do template do Vite) e confirmar que não há nenhuma importação restante.
- [x] 1.2 Adicionar ao `index.css` a seção de breakpoints (`≤1024px`, `≤640px`) com paddings e escala tipográfica reduzidos para `.main-content`, `.glass-panel` e títulos.
- [x] 1.3 Definir altura mínima de 44 px para `.btn`, `.nav-link` e `.input-field` nos breakpoints, garantindo alvos de toque.

## 2. Navbar colapsável

- [x] 2.1 Adicionar estado `menuOpen` no `Layout.tsx` e um botão hambúrguer visível apenas abaixo de 1024 px.
- [x] 2.2 Estilizar `.nav-links` como painel deslizante em coluna quando `.nav-open` estiver ativo; manter marca e `NotificationBell` sempre visíveis.
- [x] 2.3 Fechar o menu a cada mudança de `location.pathname` e ao clicar fora.
- [x] 2.4 Mover o bloco de usuário (nome, badge, botão Sair) para dentro do painel em telas pequenas.
- [x] 2.5 Ajustar o dropdown do `NotificationBell` para não ultrapassar a viewport em 360 px.

## 3. Listagens e tabelas

- [x] 3.1 Trocar `overflow: hidden` por `overflow-x: auto` em `.data-table-container` e adicionar `min-width` na `.data-table` para a rolagem funcionar.
- [x] 3.2 Mover as larguras fixas dos `th` de `Chamados.tsx:191-201` para classes CSS, neutralizando-as abaixo de 640 px.
- [x] 3.3 Extrair um componente `TicketCard` e exibi-lo no lugar da tabela abaixo de 640 px em `Chamados.tsx`, alternando por CSS.
- [x] 3.4 Tornar fluida a barra de filtros de `Chamados.tsx` (hoje `width: '200px'` fixo nos selects), empilhando abaixo de 640 px.
- [x] 3.5 Aplicar rolagem horizontal às tabelas de `usuarios/`, `unidades/`, `setores/` e `tipos-problema/`.

## 4. Telas de conteúdo e formulários

- [x] 4.1 Migrar `gridTemplateColumns: '2fr 1fr'` (`DetalhesChamado.tsx:364`) para classe e colapsar em uma coluna abaixo de 1024 px.
- [x] 4.2 Migrar `gridTemplateColumns: '1fr 1fr'` (`AbrirChamado.tsx:259`) para classe e colapsar em uma coluna abaixo de 640 px.
- [x] 4.3 Substituir `width: 420px` (`Login.tsx:65`) e `width: 460px` (`ChangePassword.tsx:83`) por `width: 100%` com `max-width`.
- [x] 4.4 Ajustar a timeline de mensagens e o painel de ações de `DetalhesChamado.tsx` para largura total em telas pequenas.
- [x] 4.5 Verificar o grid de cards do `Dashboard` (já `auto-fit minmax(240px, 1fr)`) e a altura do `ResponsiveContainer` do Recharts em `Dashboard` e `Relatorios`.

## 5. Verificação

- [x] 5.1 Percorrer todas as telas em 360 px, 768 px e 1440 px confirmando ausência de rolagem horizontal da página.
- [x] 5.2 Repetir o percurso de navegação com um usuário de cada perfil (Solicitante, Técnico, Gestor, Diretor, Admin), já que o conjunto de links da navbar muda por perfil.
- [x] 5.3 Executar em smartphone o fluxo completo: login → abrir chamado com anexo → acompanhar → mensagem → fechar com avaliação.
- [x] 5.4 Confirmar que o desktop permanece visualmente idêntico ao estado anterior à change.
