# Design — Gestor escopado por área

## Modelo conceitual

A identidade operacional de um gestor passa a ser composta por duas dimensões que já existem no schema:

```
"Gestor de Manutenção"  =  role GESTOR      +  sector "Manutenção"
                              ▲                    ▲
                     permissão (fixa em código)   área (linha na tabela Sector)
```

Nenhuma tabela nova. O CRUD de áreas é a tela de Tipos de Ocorrência, já existente.

## Matriz de escopo (estado final)

| Papel | Unidade | Setor | Observação |
|---|---|---|---|
| SOLICITANTE | — | — | Filtra por `solicitanteId = user.id` |
| TECNICO | ✅ | ✅ | Já era assim |
| **GESTOR** | ✅ | **✅ (novo)** | `sectorId` passa a ser obrigatório |
| DIRETOR | ✅ | ❌ | Supervisiona todas as áreas da Unidade |
| ADMIN | ❌ | ❌ | Visão global; pode filtrar opcionalmente |

## Onde o escopo é aplicado

```
                          hoje              depois
tickets.ts  listagem      un.              un. + setor (GESTOR)
tickets.ts  :330,:364     un.              un. + setor
tickets.ts  :899,:968     un.              un. + setor
tickets.ts  reassign      un.              un. + setor (origem e destino)
dashboard.ts              un. (+setor TEC) un. + setor (GESTOR)
reports.ts                un.              un. + setor  ◀── lacuna atual
```

`reports.ts` é o ponto mais importante: hoje não tem escopo de setor nenhum. Sem ele, o isolamento vaza pelas métricas gerenciais mesmo com a listagem corrigida.

## Decisão: helper de escopo centralizado

`backend/src/lib/rbac.ts` já tem `unitFilter()` para checagem de registro único. A regra de setor está espalhada em condicionais inline, o que já produziu a assimetria atual (o `reports.ts` simplesmente esqueceu).

**Decisão:** adicionar `sectorFilter(user, targetSectorId)` e um `scopeWhere(user)` que devolve a cláusula `{ unidadeId?, sectorId? }` derivada do papel, e usá-los nos quatro módulos. Uma regra, um lugar. Se um módulo futuro esquecer de chamar, o esquecimento fica visível na revisão em vez de silencioso.

## Decisão: rename do enum via SQL manual

`ALTER TYPE "Role" RENAME VALUE 'GESTOR_TI' TO 'GESTOR';` — suportado no PostgreSQL 10+, preserva as linhas existentes. O `prisma migrate dev` geraria, por padrão, um drop/recreate do tipo, que falha com colunas dependentes. A migration será escrita à mão.

Como migrations rodam no start do container (`npx prisma migrate deploy && node ...`), uma migration inválida trava o deploy do Cloud Run — motivo para validar localmente contra um banco populado antes do merge.

## Decisão: `Ticket.sectorId` NOT NULL

`createTicketSchema` já exige `sectorId`, mas a coluna é nullable. Um chamado sem setor seria invisível a todo Gestor e Técnico — atendido por ninguém, e visível só a quem não é escopado. Tornar NOT NULL elimina a classe de falha em vez de tratá-la.

Viável agora porque o sistema **não está em produção** e os dados existentes serão descartados antes do uso real. Se houver linhas locais com `sectorId` nulo, a migration falha — limpar ou rodar `npx prisma db seed`, que recria os tickets.

## Decisão: rótulo derivado

`Layout.tsx:52` e `Usuarios.tsx:234` têm "Gestor de TI" fixo. Passa a `Gestor de ${sector.nome}`, o que exige o nome do setor no payload do usuário. O JWT já carrega `sectorId`; o nome vem de `GET /api/auth/me`, que precisa incluir `sector: { nome }`.

Fallback: se o setor não estiver disponível, exibir apenas "Gestor" — nunca quebrar a navbar por um dado de exibição.

## Ponto em aberto

**Chamado aberto numa área sem gestor.** Com o escopo estreitado, um chamado de uma área que não tem gestor nem técnico atribuído fica visível apenas para Diretor e Admin. Não é um defeito desta change — é o comportamento pedido — mas vale confirmar que o Diretor cobre essa lacuna operacionalmente.
