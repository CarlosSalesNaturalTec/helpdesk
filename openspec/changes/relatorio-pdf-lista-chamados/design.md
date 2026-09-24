# Design — Lista de chamados no PDF de relatórios

## 1. Inversão da origem dos dados

O PDF atual é desenhado a partir do que o cliente manda pronto:

```
HOJE
────
  Relatorios.tsx                     reports.ts:24
  ──────────────                     ─────────────
  Recharts → html-to-image → PNG
  cards (vindos de /metrics)  ──POST──→  PDFKit desenha
  periodoLabel                            o que recebeu
```

Uma lista de chamados não cabe aí. O cliente tem apenas a página corrente da listagem (20 itens) e enviar centenas de registros num corpo de requisição seria absurdo. O backend precisa consultar.

```
PROPOSTO
────────
  chartImage  ──┐   (único item que só o cliente pode produzir:
  filtros     ──┤    é renderização de DOM)
                └──POST──→  backend consulta o banco:
                              ├─ cards    (recalculados)
                              ├─ lista    (nova)
                              └─ desenha tudo
```

**Decisão: os cards passam a ser recalculados no servidor**, e não recebidos. O backend já consultará o banco para a lista; manter os cards vindos do cliente criaria um documento com duas fontes de verdade, capaz de exibir "Total: 40" ao lado de uma lista com 37 linhas se a tela estivesse defasada. O gráfico continua vindo do cliente por impossibilidade técnica, mas ele é ilustrativo — não é um número que a lista possa contradizer.

Consequência: os filtros passam a trafegar no lugar dos resultados. O corpo da requisição fica menor, e a rota de PDF passa a compartilhar com `GET /api/reports/metrics` a mesma derivação de período e escopo — que precisa ser extraída para um ponto único, sob pena de as duas divergirem com o tempo.

## 2. Agrupamento hierárquico

```
Unidade Central ······································ 52
  ├─ Tecnologia ······································ 34
  │    #1042  Impressora sem rede     EM_ANDAMENTO  ALTA
  │    #1051  VPN instável            ABERTO        CRITICA
  └─ Manutenção ······································ 18
       #1033  Ar-condicionado sala 4  RESOLVIDO     MEDIA
Unidade Secundária ···································· 19
  └─ ...
```

Preferido a duas listagens independentes (uma por Unidade, outra por Tipo), que repetiriam cada chamado e dobrariam o documento. Na hierarquia cada chamado aparece uma única vez, e os subtotais de cada nível somam o total do nível acima — o documento se confere sozinho.

O agrupamento degrada de forma previsível conforme o papel:

| Papel | Unidades | Tipos de Ocorrência |
| --- | --- | --- |
| Gestor | 1 (a sua) | 1 (a sua área) |
| Diretor | 1 (a sua) | todos da Unidade |
| Admin | todas | todos |

Para o Gestor a árvore tem um só ramo. Não vale um layout especial: a estrutura uniforme é mais simples de manter e continua legível.

## 3. Teto de 1000 chamados

O Cloud Run roda com 512 MiB. Noventa dias em todas as Unidades podem render milhares de chamados, montados em memória e desenhados um a um.

Escolha: consultar no máximo 1000 chamados e declarar o corte no documento, informando o total real e orientando o refinamento do filtro. Alternativas descartadas: cortar por grupo (esconde volume de forma desigual e quebra a conferência dos subtotais) e recusar a geração acima do teto (entrega nada a quem pediu algo).

O spec vigente de `reports-pdf` exige conclusão em até 10 segundos para até 300 chamados. O teto de 1000 amplia o pior caso em mais de três vezes; a medição do tempo real no volume máximo é tarefa explícita, e o limite deve ser revisto se o alvo de 10 s não se sustentar.

## 4. Filtro de Tipo de Ocorrência para o Diretor

`reports.ts:145-150` só honra o filtro de Tipo de Ocorrência para o Admin. O Gestor é fixado na própria área — correto, é o isolamento dele. Mas o **Diretor** tem o parâmetro simplesmente ignorado.

O Diretor já enxerga todos os Tipos de Ocorrência da sua Unidade (`scopeWhere`: só Unidade). Deixá-lo filtrar é **estreitar** a visão que ele já tem, nunca ampliá-la — não há implicação de isolamento de dados. O Gestor permanece fixado na sua área: para ele o seletor, se exibido, seria inerte, e por isso não deve aparecer.

Regra resultante para o seletor na tela: visível para Admin (qualquer Tipo) e Diretor (Tipos da sua Unidade); ausente para o Gestor.
