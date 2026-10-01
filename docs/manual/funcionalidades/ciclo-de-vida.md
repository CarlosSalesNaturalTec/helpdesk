# Ciclo de vida do chamado

Todo chamado percorre uma máquina de estados fixa. O sistema valida cada transição no servidor — não é possível pular etapas pela API nem pela interface.

```
ABERTO ──────────▶ EM_ANDAMENTO ──────────▶ RESOLVIDO ──────────▶ FECHADO
                        ▲   │                                        │
                        │   ▼                                        ▼
                     PENDENTE                                   REABERTO
                                                                      │
                                                                      ▼
                                                                EM_ANDAMENTO
```

A volta de **Pendente** para **Em Andamento** depende de uma ação explícita do Técnico responsável: nenhuma outra interação no chamado, inclusive mensagens do Solicitante, altera o status de um chamado Pendente.

## Estados

| Estado | Significado |
| --- | --- |
| **Aberto** | Chamado criado pelo Solicitante, aguardando um Técnico assumir. |
| **Em Andamento** | Um Técnico assumiu o chamado e está trabalhando nele. |
| **Pendente** | O atendimento está bloqueado por algo externo — material, equipamento, laudo, fornecedor, verba, ou uma informação que só o Solicitante tem. Exige uma Razão da Pendência. |
| **Resolvido** | O Técnico aplicou uma solução; aguarda confirmação do Solicitante. |
| **Fechado** | O chamado foi encerrado — pelo Solicitante (com avaliação) ou administrativamente. |
| **Reaberto** | O Solicitante reabriu um chamado Fechado porque o problema persiste. |

## O que cada transição exige

- **Aberto/Reaberto → Em Andamento** — um Técnico assume o chamado (`assumir`), ou é atribuído por reatribuição; exige um Técnico da mesma Unidade do chamado.
- **Em Andamento → Pendente** — exige a **Razão da Pendência** (de 2 a 100 caracteres), escolhida entre as razões já registradas no Tipo de Ocorrência ou digitada livremente; notifica o Solicitante. A razão fica registrada no chamado, visível enquanto ele estiver Pendente, e no histórico.
- **Pendente → Em Andamento** — somente por ação explícita do Técnico responsável (**▶ Retomar Atendimento**). A razão deixa de ser exibida no chamado; o registro histórico dela permanece.
- **Em Andamento → Resolvido** — exige uma descrição da solução com pelo menos 10 caracteres; notifica o Solicitante.
- **Resolvido → Fechado** — pelo Solicitante, informando uma nota de satisfação de 1 a 5; ou administrativamente por Gestor, Diretor ou Administrador, sem exigir avaliação.
- **Fechado → Reaberto** — pelo Solicitante, informando um motivo com pelo menos 10 caracteres; notifica o(s) Técnico(s) responsável(is) ou, se não houver, todos os Técnicos da Unidade.

Toda transição fica registrada no histórico do chamado, visível na tela de detalhes, junto com as mensagens trocadas entre Solicitante e Técnico.

## Mensagens

Mensagens podem ser enviadas a qualquer momento na tela do chamado e **nenhuma delas altera o status**. Quando o Solicitante responde em um chamado **Pendente**, o Técnico responsável é notificado (in-app e e-mail) e o chamado permanece Pendente até que o Técnico retome o atendimento.

Essa separação protege o Tempo Médio de Atendimento, que desconta justamente o tempo em Pendente: se uma mensagem retomasse o chamado, a contagem reiniciaria sem que a pendência tivesse se resolvido.
