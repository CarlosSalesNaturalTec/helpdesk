# Gestor e Diretor

Gestor e Diretor têm visão gerencial de uma Unidade, gerenciam os usuários locais e acessam relatórios — mas com escopos diferentes: o **Gestor** é responsável por um único Tipo de Ocorrência (por exemplo, "Gestor de Manutenção" ou "Gestor de Tecnologia"), enquanto o **Diretor** supervisiona todos os Tipos de Ocorrência da Unidade.

## Chamados da Unidade

O **Dashboard** e a lista de **Chamados** do Diretor mostram todos os chamados da sua Unidade, de qualquer Tipo de Ocorrência. Para o Gestor, esses mesmos painéis mostram apenas os chamados da Unidade que pertencem ao seu Tipo de Ocorrência — um Gestor de "Manutenção" não vê chamados de "Tecnologia", mesmo dentro da própria Unidade.

## Reatribuição

Em um chamado que ainda não está fechado, reatribua o Técnico (ou Gestor) responsável — o destino precisa pertencer à mesma Unidade **e** ao mesmo Tipo de Ocorrência do chamado. O Gestor só reatribui chamados da sua própria área; o Diretor reatribui chamados de qualquer área da Unidade. A lista de destinatários é montada a partir do próprio chamado e traz os Técnicos e Gestores ativos da mesma Unidade e do mesmo Tipo de Ocorrência — então um Gestor encontra ali os outros Gestores da sua área, ainda que não possa gerenciá-los na tela de **Usuários**. Isso é útil para redistribuir carga de trabalho ou repassar um chamado para quem tem mais contexto sobre o problema. Técnico e Solicitante são notificados da mudança.

## Fechamento administrativo

Além do fechamento normal (feito pelo Solicitante com avaliação), Gestor, Diretor e Administrador podem executar um **fechamento administrativo**, que encerra o chamado sem passar pela pesquisa de satisfação — útil quando o Solicitante não responde ou o chamado precisa ser encerrado por outro motivo administrativo. O Gestor só pode fechar chamados da sua própria área. O Solicitante é notificado do encerramento.

## Gestão de usuários da Unidade

Em **Usuários**, Gestor e Diretor cadastram, editam, desativam, reativam e excluem usuários da própria Unidade — mas cada perfil alcança apenas parte dela. Quem você pode gerenciar depende do seu perfil:

| Seu perfil | Pode gerenciar |
| --- | --- |
| **Gestor** (Unidade A, área "Manutenção") | Solicitantes da Unidade A e Técnicos da Unidade A **da área "Manutenção"** |
| **Diretor** (Unidade A) | Solicitantes, Técnicos e Gestores da Unidade A, de todas as áreas |
| **Administrador** | Todos os perfis, em qualquer Unidade — inclusive Diretores e outros Administradores |

"Gerenciar" vale para todas as operações da tela: **listar, cadastrar, editar, desativar, reativar e excluir**. A listagem de **Usuários** mostra apenas quem você pode gerenciar, mais o seu próprio cadastro (marcado com "Você") — por isso um Gestor de "Manutenção" não encontra na tela os Técnicos de "Tecnologia", os outros Gestores, o Diretor nem o Administrador da Unidade.

O seletor de **Papel / Função** oferece somente os perfis que você pode atribuir: o Gestor vê "Solicitante" e "Técnico"; o Diretor vê também "Gestor". **Criar, editar ou desativar um Diretor ou um Administrador é atribuição exclusiva do Administrador do Sistema** — inclusive para o Diretor, que não cadastra outro Diretor.

O campo de Unidade fica fixo na sua Unidade ao criar ou editar um usuário; somente o Administrador pode criar usuários em outras Unidades. Quando **um Gestor cadastra um Técnico**, a Área de atuação já vem preenchida com a sua própria área e não pode ser alterada.

### O campo "Área de atuação"

Ao cadastrar ou editar um Técnico ou um Gestor, é obrigatório escolher uma **Área de atuação**. O seletor lista os Tipos de Ocorrência cadastrados, e é natural estranhar: "Tipo de Ocorrência" descreve um chamado, não uma pessoa. O que o campo responde é **com qual Tipo de Ocorrência esta pessoa trabalha**:

- Para um **Técnico**, é a área dos chamados que ele atende.
- Para um **Gestor**, é a área que ele gerencia — e é ela que determina quais chamados ele vê, quais indicadores aparecem no seu Dashboard e nos seus relatórios, e quais Técnicos ele pode cadastrar e gerenciar. É também o que compõe o rótulo do perfil na listagem (ex.: "Gestor de Manutenção").

Cada usuário tem **uma** área. Para cobrir outra, é preciso um cadastro com essa área. Solicitantes, Diretores e Administradores não têm o campo: o Solicitante abre chamados de qualquer área e os outros dois enxergam todas as áreas da sua Unidade.

### Desativar, reativar e excluir

Ao **desativar** um usuário, ele perde o acesso na hora, mas segue cadastrado e o histórico dos chamados dele é preservado. É o caminho correto para um desligamento.

Na linha de um usuário **inativo**, "Desativar" dá lugar a duas ações:

- **Reativar** — devolve o acesso. O usuário entra com a **mesma senha** de antes, e um bloqueio por cinco tentativas de login malsucedidas é desfeito junto. Se a senha se perdeu, reative e depois edite o usuário para definir uma nova senha temporária.
- **Excluir** — apaga o cadastro **em definitivo**, sem volta. Só funciona para quem **nunca participou de um chamado** (nunca abriu, nunca atendeu, nunca comentou). Havendo histórico, o sistema recusa e pede que o usuário seja mantido inativo — é o que preserva a rastreabilidade dos chamados. Na prática, use "Excluir" apenas para cadastros feitos por engano.

"Editar" continua indisponível enquanto o usuário estiver inativo: reative-o primeiro. As duas ações respeitam o mesmo escopo da tabela acima — um usuário fora do seu alcance responde como se não existisse.

### Editando o próprio cadastro

O seu usuário sempre aparece na listagem e você pode editar os seus **dados pessoais** — nome, CPF, telefone, e-mail e senha temporária. No CPF e no telefone, digite **apenas números**: a pontuação é aplicada sozinha enquanto você digita. Os campos de **papel, Unidade e Área de atuação aparecem desabilitados**: ninguém altera o próprio perfil ou o próprio escopo, nem mesmo o Administrador. Se precisar mudar isso, peça a alguém que tenha permissão para gerenciar o seu perfil. O botão **Desativar** também não aparece para o seu próprio usuário.

Essas regras valem no servidor, não apenas na tela: a interface esconde o que você não pode fazer, mas a verificação acontece no backend. Uma tentativa de contornar a interface é recusada de qualquer forma — um alvo fora do seu escopo responde como se não existisse, e um papel ou área que você não pode atribuir é recusado com uma mensagem explicando a regra.

## Relatórios

Em **Relatórios**, o Diretor vê métricas de toda a sua Unidade (total de chamados, taxa de fechamento, tempo médio de atendimento, satisfação média) e a distribuição por status, prioridade, categoria ou satisfação, com exportação em PDF. O Gestor vê as mesmas métricas restritas ao seu Tipo de Ocorrência. Veja detalhes em [Relatórios e dashboard](../funcionalidades/relatorios-dashboard.md).
