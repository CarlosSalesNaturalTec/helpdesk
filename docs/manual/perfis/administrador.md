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

## Chamados e relatórios globais

O Administrador pode filtrar o Dashboard e os Relatórios por Unidade e por Tipo de Ocorrência, algo que os demais perfis não têm acesso — os relatórios de outros perfis são sempre restritos à própria Unidade.

## Isolamento de dados

O Administrador é o único perfil sem restrição de Unidade ou Tipo de Ocorrência nas consultas. Todos os demais perfis têm o acesso filtrado no backend — veja [Acesso e segurança](../operacao/acesso-e-seguranca.md).
