# Notificações

Cada evento relevante do ciclo de vida de um chamado gera uma notificação **in-app** (visível no sino de notificações da barra superior) e, quando possível, um **e-mail** para o destinatário.

## Eventos e destinatários

| Evento | Quem é notificado |
| --- | --- |
| Chamado assumido por um Técnico | Solicitante |
| Chamado colocado em Aguardando | Solicitante |
| Nova mensagem do Solicitante em um chamado Aguardando | Técnico responsável |
| Chamado marcado como Resolvido | Solicitante |
| Chamado fechado administrativamente | Solicitante |
| Chamado reaberto | Técnico(s) responsável(is), ou todos os Técnicos da Unidade se não houver um Técnico atribuído |
| Chamado reatribuído | Novo Técnico responsável **e** Solicitante |

## Notificações in-app

O sino na barra superior mostra a contagem de notificações não lidas. Clique em uma notificação para marcá-la como lida e ir direto ao chamado relacionado; há também a opção de marcar todas como lidas de uma vez.

## E-mails

Os e-mails são enviados via SendGrid e incluem um link direto para o chamado. Se o servidor de e-mail não estiver configurado, o sistema continua funcionando normalmente — apenas a notificação in-app é gerada.

Uma falha ao enviar e-mail ou ao criar a notificação in-app **nunca** impede a ação no chamado (assumir, resolver, fechar etc.) — o erro é registrado internamente, mas a operação principal é concluída normalmente.
