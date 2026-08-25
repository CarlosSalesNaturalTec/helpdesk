# Gestor e Diretor

Gestor e Diretor têm visão gerencial de uma Unidade, gerenciam os usuários locais e acessam relatórios — mas com escopos diferentes: o **Gestor** é responsável por um único Tipo de Ocorrência (por exemplo, "Gestor de Manutenção" ou "Gestor de Tecnologia"), enquanto o **Diretor** supervisiona todos os Tipos de Ocorrência da Unidade.

## Chamados da Unidade

O **Dashboard** e a lista de **Chamados** do Diretor mostram todos os chamados da sua Unidade, de qualquer Tipo de Ocorrência. Para o Gestor, esses mesmos painéis mostram apenas os chamados da Unidade que pertencem ao seu Tipo de Ocorrência — um Gestor de "Manutenção" não vê chamados de "Tecnologia", mesmo dentro da própria Unidade.

## Reatribuição

Em um chamado que ainda não está fechado, reatribua o Técnico (ou Gestor) responsável — o destino precisa pertencer à mesma Unidade **e** ao mesmo Tipo de Ocorrência do chamado. O Gestor só reatribui chamados da sua própria área; o Diretor reatribui chamados de qualquer área da Unidade. Isso é útil para redistribuir carga de trabalho ou repassar um chamado para quem tem mais contexto sobre o problema. Técnico e Solicitante são notificados da mudança.

## Fechamento administrativo

Além do fechamento normal (feito pelo Solicitante com avaliação), Gestor, Diretor e Administrador podem executar um **fechamento administrativo**, que encerra o chamado sem passar pela pesquisa de satisfação — útil quando o Solicitante não responde ou o chamado precisa ser encerrado por outro motivo administrativo. O Gestor só pode fechar chamados da sua própria área. O Solicitante é notificado do encerramento.

## Gestão de usuários da Unidade

Em **Usuários**, Gestor e Diretor cadastram, editam e desativam usuários — mas apenas da própria Unidade; o campo de Unidade fica fixo na sua Unidade ao criar ou editar um usuário. Ao cadastrar ou editar um Gestor, é obrigatório selecionar o Tipo de Ocorrência ao qual ele pertence — é essa escolha que define sua área de atuação e aparece no seu rótulo (ex.: "Gestor de Manutenção"). Somente o Administrador pode criar usuários em outras Unidades.

## Relatórios

Em **Relatórios**, o Diretor vê métricas de toda a sua Unidade (total de chamados, taxa de fechamento, tempo médio de atendimento, satisfação média) e a distribuição por status, prioridade, categoria ou satisfação, com exportação em PDF. O Gestor vê as mesmas métricas restritas ao seu Tipo de Ocorrência. Veja detalhes em [Relatórios e dashboard](../funcionalidades/relatorios-dashboard.md).
