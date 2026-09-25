# Técnico

O Técnico atende os chamados de suporte. O que um Técnico enxerga é **duplamente restrito**: apenas chamados da sua própria Unidade **e** do seu Tipo de Ocorrência (por exemplo, um técnico de "Tecnologia" não vê chamados de outro Tipo de Ocorrência, mesmo na mesma Unidade). Um Técnico sem Tipo de Ocorrência definido no cadastro vê todos os chamados da sua Unidade.

## Fila de chamados

Em **Chamados**, a lista mostra os chamados dentro do seu escopo, com filtros por status (um ou mais), urgência e Tipo de Ocorrência — veja [Listagem e filtros de chamados](../funcionalidades/listagem-chamados.md). O **Dashboard** resume os chamados abertos, em andamento, resolvidos e os críticos ainda não fechados, além de uma tendência de 30 dias; clicar em um cartão abre a listagem com esses chamados.

O **Local** informado pelo Solicitante aparece em coluna própria na listagem, nos cards e na tela do chamado — não é preciso ler a descrição inteira para saber aonde ir. Chamados abertos antes da existência desse campo exibem um traço.

## Assumir um chamado

Um chamado nos status **Aberto** ou **Reaberto** pode ser assumido por qualquer Técnico da mesma Unidade — o primeiro a assumir se torna o responsável, e o chamado passa a **Em Andamento**. Chamados fechados não podem ser assumidos; é preciso reabri-los primeiro.

## Colocar em Aguardando

Quando faltam informações do Solicitante para prosseguir, mude o status para **Aguardando** e escreva uma mensagem explicando o que é necessário — a mensagem é obrigatória e vai por notificação (in-app e e-mail) ao Solicitante. Quando o Solicitante responde, o chamado volta automaticamente para **Em Andamento**.

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
