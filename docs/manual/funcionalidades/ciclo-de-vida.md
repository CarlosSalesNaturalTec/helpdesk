# Ciclo de vida do chamado

Todo chamado percorre uma máquina de estados fixa. O sistema valida cada transição no servidor — não é possível pular etapas pela API nem pela interface.

```
ABERTO ──────────▶ EM_ANDAMENTO ──────────▶ RESOLVIDO ──────────▶ FECHADO
                        ▲   │                                        │
                        │   ▼                                        ▼
                    AGUARDANDO                                  REABERTO
                                                                      │
                                                                      ▼
                                                                EM_ANDAMENTO
```

## Estados

| Estado | Significado |
| --- | --- |
| **Aberto** | Chamado criado pelo Solicitante, aguardando um Técnico assumir. |
| **Em Andamento** | Um Técnico assumiu o chamado e está trabalhando nele. |
| **Aguardando** | O Técnico precisa de mais informações do Solicitante para prosseguir. |
| **Resolvido** | O Técnico aplicou uma solução; aguarda confirmação do Solicitante. |
| **Fechado** | O chamado foi encerrado — pelo Solicitante (com avaliação) ou administrativamente. |
| **Reaberto** | O Solicitante reabriu um chamado Fechado porque o problema persiste. |

## O que cada transição exige

- **Aberto/Reaberto → Em Andamento** — um Técnico assume o chamado (`assumir`), ou é atribuído por reatribuição; exige um Técnico da mesma Unidade do chamado.
- **Em Andamento → Aguardando** — exige uma mensagem explicando o que falta; notifica o Solicitante.
- **Aguardando → Em Andamento** — automático, assim que o Solicitante envia uma nova mensagem no chamado.
- **Em Andamento → Resolvido** — exige uma descrição da solução com pelo menos 10 caracteres; notifica o Solicitante.
- **Resolvido → Fechado** — pelo Solicitante, informando uma nota de satisfação de 1 a 5; ou administrativamente por Gestor, Diretor ou Administrador, sem exigir avaliação.
- **Fechado → Reaberto** — pelo Solicitante, informando um motivo com pelo menos 10 caracteres; notifica o(s) Técnico(s) responsável(is) ou, se não houver, todos os Técnicos da Unidade.

Toda transição fica registrada no histórico do chamado, visível na tela de detalhes, junto com as mensagens trocadas entre Solicitante e Técnico.

## Mensagens

Mensagens podem ser enviadas a qualquer momento na tela do chamado. A única mensagem com efeito colateral é a do Solicitante quando o chamado está **Aguardando**: ela move o chamado de volta para **Em Andamento** automaticamente.
