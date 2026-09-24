# Administrador

O Administrador do Sistema tem acesso global: enxerga chamados, usuários e relatórios de **todas** as Unidades, e é o único perfil que pode gerenciar a estrutura do sistema — Unidades, Tipos de Ocorrência e Tipos de Problema.

## Unidades

Em **Unidades**, cadastre, edite e remova as Unidades do Instituto. Cada usuário (exceto o próprio Administrador) pertence a exatamente uma Unidade, que determina o que ele enxerga no sistema.

## Tipos de Ocorrência

Em **Tipos de Ocorrência** (o "Setor" internamente), cadastre as categorias de chamado disponíveis para todas as Unidades. Um Tipo de Ocorrência pode ser desativado (campo "ativo") sem excluir seu histórico.

## Tipos de Problema

Em **Tipos de Problema**, cadastre as subcategorias vinculadas a um Tipo de Ocorrência, cada uma com um **SLA em minutos** — o tempo alvo de atendimento usado como referência em relatórios. Não há hoje um job automático que sinalize violação de SLA.

## Usuários

Em **Usuários**, o Administrador cadastra, edita, desativa, reativa e exclui usuários de qualquer Unidade e define o perfil (Solicitante, Técnico, Gestor, Diretor, Administrador). Para Técnicos e Gestores, é obrigatório selecionar a **Área de atuação** — o Tipo de Ocorrência que o usuário atende. Para o Gestor, essa escolha define o que ele gerencia (ex.: "Gestor de Manutenção").

### Diretores e Administradores são geridos só pelo Administrador

O Administrador é o **único** perfil que cadastra, edita e desativa **Diretores e outros Administradores**. Nem o Diretor nem o Gestor alcançam esses perfis: eles não aparecem na listagem de Usuários desses perfis, o seletor de papel não oferece as opções, e o servidor recusa a operação mesmo em uma tentativa de contornar a interface. Na prática, um Diretor não cadastra outro Diretor — quando uma Unidade precisa de um novo Diretor, o pedido passa pelo Administrador do Sistema.

Os demais perfis gerenciam apenas parte da própria Unidade: o Diretor alcança Solicitantes, Técnicos e Gestores da sua Unidade; o Gestor alcança Solicitantes da sua Unidade e Técnicos da sua Unidade **e da sua área**. A tabela completa está em [Gestor e Diretor](gestor-diretor.md).

### Ninguém altera o próprio perfil

Ao editar o próprio cadastro, os campos de papel, Unidade e Tipo de Ocorrência ficam desabilitados — **inclusive para o Administrador**. É uma proteção contra o rebaixamento acidental do último Administrador do sistema. Para alterar o perfil de um Administrador, use a conta de outro Administrador.

### Campos obrigatórios do cadastro

Todo cadastro exige **nome completo**, **CPF**, **telefone** e **e-mail**, além do perfil e da Unidade. CPF e e-mail são únicos: o sistema recusa o cadastro se já existir outro usuário com o mesmo valor.

| Campo | Como digitar | Como o campo fica |
| --- | --- | --- |
| CPF | apenas números | `529.982.247-25` |
| Telefone | apenas números, com DDD — aceita fixo e celular | `(11) 3333-4444` ou `(11) 99999-8888` |

**Digite apenas números nos dois campos: a pontuação é aplicada sozinha enquanto você digita.** Colar um valor já formatado também funciona — `(71) 99965-5578` e `71999655578` dão no mesmo. Na listagem, o telefone aparece formatado.

O CPF é conferido apenas quanto ao **formato**; o sistema não valida os dígitos verificadores. A responsabilidade de digitar o número correto é de quem cadastra.

### Usuários cadastrados antes destes campos

Usuários criados antes da introdução de CPF e telefone continuam ativos e acessando o sistema normalmente, com esses campos vazios — aparecem como "—" na listagem. Não há bloqueio de acesso nem prazo para regularizar.

O preenchimento acontece de forma gradual: **ao editar um desses usuários, ainda que seja apenas para trocar a Unidade, o sistema exige preencher CPF e telefone antes de salvar.** Para completar a base de uma vez, basta editar cada usuário pendente pela listagem.

### Desativar, reativar e excluir

Um usuário **ativo** pode ser **desativado**: ele perde o acesso imediatamente, mas continua cadastrado e todo o seu histórico de chamados é preservado. É a forma correta de tratar um desligamento.

Para um usuário **inativo**, a listagem oferece duas ações no lugar de "Desativar":

- **Reativar** — devolve o acesso. O usuário entra com a **mesma senha** que já tinha, e um eventual bloqueio por cinco tentativas de login malsucedidas é removido. Se a senha se perdeu, reative primeiro e depois edite o usuário para definir uma nova senha temporária. Use esta ação para desfazer um desligamento feito por engano.
- **Excluir** — remove o cadastro **em definitivo**; a ação não tem volta.

"Editar" só fica disponível para usuários ativos: para corrigir os dados de um inativo, reative-o antes.

!!! warning "A exclusão só vale para cadastros sem histórico"
    O sistema só exclui um usuário que **nunca participou de um chamado**: nunca abriu nem foi designado para um, nunca comentou e não tem notificações. Havendo qualquer vínculo, a exclusão é recusada com a mensagem "Este usuário possui histórico no sistema e não pode ser excluído. Mantenha-o inativo."

    A restrição existe para preservar a rastreabilidade: apagar quem abriu ou atendeu um chamado deixaria o histórico sem autor. Na prática, **Excluir serve para cadastros criados por engano** (e-mail digitado errado, usuário duplicado); para quem já trabalhou no sistema, o correto é manter inativo.

    O usuário precisa estar inativo para ser excluído — a desativação prévia é o passo que evita uma exclusão acidental.

O Gestor e o Diretor também reativam e excluem, mas apenas dentro do que já gerenciam: mesma Unidade e, para o Gestor, mesma área. Fora disso o sistema responde como se o usuário não existisse.

## Chamados e relatórios globais

O Administrador pode filtrar o Dashboard, os Relatórios e a listagem de Chamados por Unidade e por Tipo de Ocorrência (ao clicar em um cartão do Dashboard, os recortes aplicados seguem para a listagem), algo que os demais perfis não têm acesso — os relatórios de outros perfis são sempre restritos à própria Unidade.

## Isolamento de dados

O Administrador é o único perfil sem restrição de Unidade ou Tipo de Ocorrência nas consultas. Todos os demais perfis têm o acesso filtrado no backend — veja [Acesso e segurança](../operacao/acesso-e-seguranca.md).
