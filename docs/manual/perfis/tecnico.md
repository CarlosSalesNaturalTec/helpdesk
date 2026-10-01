# Técnico

O Técnico atende os chamados de suporte. O que um Técnico enxerga é **duplamente restrito**: apenas chamados da sua própria Unidade **e** do seu Tipo de Ocorrência (por exemplo, um técnico de "Tecnologia" não vê chamados de outro Tipo de Ocorrência, mesmo na mesma Unidade). Um Técnico sem Tipo de Ocorrência definido no cadastro vê todos os chamados da sua Unidade.

## Fila de chamados

Em **Chamados**, a lista mostra os chamados dentro do seu escopo, com filtros por status (um ou mais), urgência e Tipo de Ocorrência — veja [Listagem e filtros de chamados](../funcionalidades/listagem-chamados.md). O **Dashboard** resume os chamados abertos, em andamento, resolvidos e os críticos ainda não fechados, além de uma tendência de 30 dias; clicar em um cartão abre a listagem com esses chamados.

O **Local** informado pelo Solicitante aparece em coluna própria na listagem, nos cards e na tela do chamado — não é preciso ler a descrição inteira para saber aonde ir. Chamados abertos antes da existência desse campo exibem um traço.

## Assumir um chamado

Um chamado nos status **Aberto** ou **Reaberto** pode ser assumido por qualquer Técnico da mesma Unidade — o primeiro a assumir se torna o responsável, e o chamado passa a **Em Andamento**. Chamados fechados não podem ser assumidos; é preciso reabri-los primeiro.

## Colocar em Pendente

Quando o atendimento depende de algo que não está na sua mão — material, equipamento, laudo, fornecedor, verba, ou uma informação que só o Solicitante tem —, mude o status para **Pendente** e informe a **Razão da Pendência**. A razão é obrigatória (de 2 a 100 caracteres) e vai por notificação (in-app e e-mail) ao Solicitante.

O campo oferece as razões já registradas em chamados do seu Tipo de Ocorrência como sugestões: comece a digitar e escolha uma da lista, ou escreva uma razão nova — ela passa a ser sugerida nas pendências seguintes. Reaproveitar a mesma redação é o que mantém a lista curta e torna possível reconhecer padrões ("de novo falta de material"). Diferenças de maiúsculas e de espaços não criam entradas novas: "aguardando  material" é gravado com a grafia já registrada, "Aguardando material".

As sugestões são uma conveniência. Se a lista não carregar, o campo continua aceitando texto livre e a pendência pode ser concluída normalmente.

Enquanto o chamado estiver Pendente, a razão aparece no topo da tela do chamado, de modo que qualquer pessoa com acesso saiba o que se está esperando.

## Retomar o atendimento

**O chamado não sai de Pendente por conta própria.** Uma mensagem do Solicitante não retoma o atendimento — você é avisado da resposta por notificação e por e-mail, e decide se a pendência está resolvida.

Quando estiver, clique em **▶ Retomar Atendimento** na tela do chamado: o status volta para **Em Andamento**, a transição entra no histórico e a razão deixa de ser exibida (o registro histórico dela permanece na linha do tempo).

Essa decisão é sua de propósito: o tempo em Pendente é descontado do Tempo Médio de Atendimento, e uma retomada automática por conversa reiniciaria essa contagem sem que nada tivesse se resolvido.

## Resolver um chamado

Para marcar como **Resolvido**, descreva a solução aplicada (mínimo de 10 caracteres). O Solicitante é notificado e pode fechar o chamado com uma avaliação ou reabri-lo se o problema persistir.

## Corrigir o local do chamado

Chegou ao lugar indicado e o problema não é ali? Você, como Técnico **atribuído** ao chamado, pode corrigir o local: na tela do chamado, clique no lápis ao lado de **Local**, informe o lugar certo e salve. É a informação mais útil que você traz do campo — corrigi-la evita que outra pessoa repita o deslocamento errado.

O título do chamado é recomposto com o novo local e a correção entra no histórico, com seu nome, a data e o local anterior. Como a correção partiu de você, nenhuma notificação é enviada a você mesmo.

Só o Técnico atribuído corrige: um colega do mesmo Tipo de Ocorrência que enxergue o chamado mas não o atenda verá o local apenas para leitura. E nenhum chamado **Fechado** aceita correção — é preciso reabri-lo antes.

Quando outra pessoa (o Solicitante ou a gestão) corrige o local de um chamado seu, você recebe notificação e e-mail com o local anterior e o novo.

## Reatribuição

Um Gestor, Diretor ou Administrador pode reatribuir um chamado para outro Técnico (ou Gestor) da mesma Unidade e do mesmo Tipo de Ocorrência — você será notificado se um chamado for atribuído a você por reatribuição, ou se um chamado seu for movido para outro colega.

Veja o fluxo completo de estados em [Ciclo de vida do chamado](../funcionalidades/ciclo-de-vida.md).
