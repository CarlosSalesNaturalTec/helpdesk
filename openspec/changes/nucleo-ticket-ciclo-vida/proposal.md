# Proposal: Núcleo do Ticket — Abertura, Ciclo de Vida e Satisfação

## Why

O propósito central do HelpDesk é registrar e gerenciar chamados de suporte. Com a fundação de autenticação e estrutura organizacional pronta (Change 1), este change entrega o fluxo completo de ponta a ponta: um Solicitante abre um chamado, um Técnico assume e o conduz pelo ciclo de vida até a resolução, e o Solicitante avalia o atendimento. Esta é a entrega de maior valor do MVP — sem ela, o sistema não tem razão de existir.

## What Changes

- Formulário de abertura de chamado com validação, categorização por tipo e urgência, e dados do solicitante preenchidos automaticamente
- Número único sequencial por chamado
- Máquina de estados completa: Aberto → Em Andamento → Resolvido → Fechado, com desvios para Aguardando e caminho de Reabertura
- Auto-atribuição de chamados por Técnico da mesma Unidade e reatribuição por Gestor/Diretor
- Linha do tempo cronológica registrando abertura, mudanças de status e mensagens
- Busca textual (título, solicitante, unidade) combinada com filtro por status
- Pesquisa de satisfação com 1 a 5 estrelas no fechamento do chamado pelo Solicitante
- **API de criação de chamados desacoplada** (RF19) — a UI web consome a mesma API que o futuro chatbot consumirá

## Capabilities

### New Capabilities

- `ticket-creation`: Abertura de chamado com validação de campos (título 5-100, descrição 10-2000), categorização (tipo: Hardware/Software/Rede/E-mail/Impressora/Acesso/Sistema Interno/Outro, urgência: Baixa/Média/Alta/Crítica), preenchimento automático dos dados do solicitante e geração de número único sequencial. API desacoplada da interface web
- `ticket-workflow`: Máquina de estados com transições: Aberto → Em Andamento, Em Andamento → Aguardando → Em Andamento, Em Andamento → Resolvido, Resolvido → Fechado, Fechado → Reaberto → Em Andamento. Bloqueio de alterações em chamados Fechados exceto via ação explícita "Reabrir"
- `ticket-assignment`: Auto-atribuição por Técnico da mesma Unidade e reatribuição por Gestor de TI ou Diretor para qualquer Técnico de sua Unidade
- `ticket-query`: Busca textual por título, nome do solicitante e unidade, combinada com filtro por status. Resultados são a interseção dos critérios. Exibição do contador de chamados encontrados
- `satisfaction`: Pesquisa de satisfação obrigatória (1 a 5 estrelas) ao fechar chamado pelo Solicitante. Fechamento administrativo por Gestor/Diretor não aciona pesquisa

### Modified Capabilities

_Nenhuma — este é o segundo change e não modifica os specs criados no Change 1._

## Impact

- **Database**: Nova tabela `tickets` com FK para `users` (solicitante, tecnico), `unidades`; nova tabela `ticket_history` (eventos da timeline); nova tabela `satisfaction` (nota + vínculo com ticket)
- **Backend**: API de tickets (`/api/tickets` com CRUD), endpoints de atribuição, transição de status, histórico, busca/filtro e satisfação
- **Frontend**: Telas "Abrir Chamado" (Solicitante), "Gestão de Chamados" (Técnico/Gestor/Diretor), "Detalhes do Chamado" com timeline, busca e filtros, tela de avaliação
- **Dependências**: Change 1 (auth, RBAC, usuários, unidades) — os tickets dependem de usuário autenticado e vinculação à Unidade

## Non-goals

- Sistema de mensagens entre Técnico e Solicitante (Change 3 — Comunicação)
- Notificações por e-mail ou alertas visuais (Change 3)
- Upload de anexos (fora do MVP)
- Distribuição automática de chamados por carga de trabalho (fora do MVP)
- Implementação do chatbot em si (apenas o ponto de extensão arquitetural — RF19)
