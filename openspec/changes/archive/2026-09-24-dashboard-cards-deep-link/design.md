# Design — Cards do Dashboard com link para a listagem filtrada

## 1. A negação não precisa de sintaxe nova

O card "Críticos" conta `urgencia = CRITICA AND status <> FECHADO`. A tentação é criar um operador de exclusão (`excludeStatus`, `status!=FECHADO`), o que introduziria um segundo vocabulário de filtro na API.

Desnecessário: com `status` multi-valor, "não fechado" é a **enumeração explícita** dos outros cinco estados.

```
Abertos       → ?status=ABERTO,REABERTO
Em Andamento  → ?status=EM_ANDAMENTO,AGUARDANDO
Resolvidos    → ?status=RESOLVIDO
Críticos      → ?urgencia=CRITICA
                &status=ABERTO,EM_ANDAMENTO,AGUARDANDO,RESOLVIDO,REABERTO
                + &unidadeId= &sectorId=  quando o Admin os tiver aplicados
```

A URL de "Críticos" fica verbosa, mas o custo é cosmético e o ganho é real: um único conceito de filtro, e a seleção múltipla de status na tela consegue **representar visualmente** o que foi aplicado — um `excludeStatus` ficaria invisível na barra de filtros.

Contrapartida aceita: se um novo status for adicionado ao workflow, o link de "Críticos" precisa incluí-lo. Mitigação: derivar a lista de "todos os status exceto FECHADO" do enum compartilhado, nunca escrevê-la à mão.

## 2. Risco de isolamento de dados no parâmetro `unidadeId`

Este é o ponto mais perigoso da mudança.

`tickets.ts:189` monta o escopo assim:

```ts
Object.assign(whereClause, scopeWhere(user));  // injeta unidadeId/sectorId do usuário
```

Se o novo parâmetro for aplicado **depois** dessa linha, ele sobrescreve o escopo derivado do papel, e um Técnico consegue ler outra Unidade com `?unidadeId=99`. O `CLAUDE.md` trata isolamento entre Unidades como invariante ("data isolation is paramount").

Regra: **o parâmetro só é lido quando `user.role === 'ADMIN'`.** Para os demais papéis ele é ignorado em silêncio — não é erro 403, porque responder de forma diferente revelaria a existência da outra Unidade, contrariando a convenção de 404 já adotada nas rotas de chamado individual.

O mesmo vale para `sectorId`, que já existe no schema: hoje ele é aplicado sem checagem de papel (`tickets.ts:~205`). Um Gestor de Manutenção passando `?sectorId=<Tecnologia>` obtém lista vazia, porque o `scopeWhere` já fixou o setor dele e as duas condições se contradizem — o vazamento não ocorre, mas por acidente, não por desenho. Vale explicitar a mesma regra para os dois parâmetros.

```
   request.query
        │
        ├─ ADMIN?  ──sim──→ aplica unidadeId / sectorId do query
        │
        └─ demais ──→ descarta; vale scopeWhere(user)
```

**Decisão de implementação.** `unidadeId` é lido apenas para Admin, como previsto. Para `sectorId` a regra "só Admin" foi descartada: o filtro de Tipo de Ocorrência já é exibido a todos os papéis na tela de Chamados, e Diretor e Solicitante o usam para estreitar a própria listagem — restringi-lo quebraria um recurso existente. A invariante de isolamento é garantida de outra forma: `scopeWhere(user)` (e `solicitanteId` para o Solicitante) passa a ser aplicado **por último** em `tickets.ts`, então nenhum parâmetro do query consegue sobrescrever o escopo do papel. Para Técnico e Gestor, um `sectorId` de outra área é descartado em silêncio; para Diretor e Solicitante ele só estreita dentro do que o papel já enxerga.

## 3. Filtros na URL como fonte de verdade

`Chamados.tsx` guarda filtros em `useState`, sem sincronia com a URL. Sem mudar isso, o link do card não funciona.

Escolha: a URL passa a ser a fonte de verdade (`useSearchParams`), e o estado local deriva dela. Alternativa descartada: manter `useState` e apenas inicializar a partir da URL — mais simples, mas o botão voltar do navegador deixa de refletir a mudança de filtro, o que é pior justamente para quem acabou de chegar do Dashboard e quer voltar.

Efeitos colaterais desejáveis: link compartilhável entre colegas, recarga preservando filtro, e a `queryKey` do React Query passa a derivar de um objeto já serializado.

## 4. `StatusCard` clicável é opt-in

`Relatorios.tsx:146-149` reusa o componente para Total de Chamados, Taxa de Fechamento, TMA e Satisfação — nenhum deles tem listagem de destino. Tornar o componente navegável por padrão daria a quatro cards de Relatórios um cursor e um foco que não levam a lugar algum.

O destino entra como prop opcional. Quando presente, o card é renderizado como elemento navegável (com foco por teclado e papel semântico); quando ausente, permanece exatamente como hoje — `cursor: 'default'`, sem foco.
