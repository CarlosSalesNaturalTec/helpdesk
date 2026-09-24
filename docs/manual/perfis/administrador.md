# Administrador

O Administrador do Sistema tem acesso global: enxerga chamados, usuários e relatórios de **todas** as Unidades, e é o único perfil que pode gerenciar a estrutura do sistema — Unidades, Tipos de Ocorrência e Tipos de Problema.

## Unidades

Em **Unidades**, cadastre, edite e remova as Unidades do Instituto. Cada usuário (exceto o próprio Administrador) pertence a exatamente uma Unidade, que determina o que ele enxerga no sistema.

## Tipos de Ocorrência

Em **Tipos de Ocorrência** (o "Setor" internamente), cadastre as categorias de chamado disponíveis para todas as Unidades. Um Tipo de Ocorrência pode ser desativado (campo "ativo") sem excluir seu histórico.

## Tipos de Problema

Em **Tipos de Problema**, cadastre as subcategorias vinculadas a um Tipo de Ocorrência, cada uma com um **SLA em minutos** — o tempo alvo de atendimento usado como referência em relatórios. Não há hoje um job automático que sinalize violação de SLA.

## Usuários

Em **Usuários**, o Administrador cadastra, edita e desativa usuários de qualquer Unidade e define o perfil (Solicitante, Técnico, Gestor, Diretor, Administrador). Para Técnicos e Gestores, é obrigatório selecionar o Tipo de Ocorrência ao qual pertencem — para o Gestor, essa escolha define sua área de atuação (ex.: "Gestor de Manutenção").

### Diretores e Administradores são geridos só pelo Administrador

O Administrador é o **único** perfil que cadastra, edita e desativa **Diretores e outros Administradores**. Nem o Diretor nem o Gestor alcançam esses perfis: eles não aparecem na listagem de Usuários desses perfis, o seletor de papel não oferece as opções, e o servidor recusa a operação mesmo em uma tentativa de contornar a interface. Na prática, um Diretor não cadastra outro Diretor — quando uma Unidade precisa de um novo Diretor, o pedido passa pelo Administrador do Sistema.

Os demais perfis gerenciam apenas parte da própria Unidade: o Diretor alcança Solicitantes, Técnicos e Gestores da sua Unidade; o Gestor alcança Solicitantes da sua Unidade e Técnicos da sua Unidade **e da sua área**. A tabela completa está em [Gestor e Diretor](gestor-diretor.md).

### Ninguém altera o próprio perfil

Ao editar o próprio cadastro, os campos de papel, Unidade e Tipo de Ocorrência ficam desabilitados — **inclusive para o Administrador**. É uma proteção contra o rebaixamento acidental do último Administrador do sistema. Para alterar o perfil de um Administrador, use a conta de outro Administrador.

### Campos obrigatórios do cadastro

Todo cadastro exige **nome completo**, **CPF**, **telefone** e **e-mail**, além do perfil e da Unidade. CPF e e-mail são únicos: o sistema recusa o cadastro se já existir outro usuário com o mesmo valor.

| Campo | Formato esperado | Exemplo |
| --- | --- | --- |
| CPF | com pontuação, no formato `000.000.000-00` | `123.456.789-01` |
| Telefone | somente números, com DDD — aceita fixo e celular | `1133334444` ou `11999998888` |

O CPF é conferido apenas quanto ao **formato**; o sistema não valida os dígitos verificadores. A responsabilidade de digitar o número correto é de quem cadastra.

### Usuários cadastrados antes destes campos

Usuários criados antes da introdução de CPF e telefone continuam ativos e acessando o sistema normalmente, com esses campos vazios — aparecem como "—" na listagem. Não há bloqueio de acesso nem prazo para regularizar.

O preenchimento acontece de forma gradual: **ao editar um desses usuários, ainda que seja apenas para trocar a Unidade, o sistema exige preencher CPF e telefone antes de salvar.** Para completar a base de uma vez, basta editar cada usuário pendente pela listagem.

## Chamados e relatórios globais

O Administrador pode filtrar o Dashboard, os Relatórios e a listagem de Chamados por Unidade e por Tipo de Ocorrência (ao clicar em um cartão do Dashboard, os recortes aplicados seguem para a listagem), algo que os demais perfis não têm acesso — os relatórios de outros perfis são sempre restritos à própria Unidade.

## Isolamento de dados

O Administrador é o único perfil sem restrição de Unidade ou Tipo de Ocorrência nas consultas. Todos os demais perfis têm o acesso filtrado no backend — veja [Acesso e segurança](../operacao/acesso-e-seguranca.md).
