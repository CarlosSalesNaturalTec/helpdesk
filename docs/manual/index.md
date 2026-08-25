# Bem-vindo

**SOLUTUS** é a plataforma centralizada de chamados de suporte do **Instituto Setes**. Ela conecta quem precisa de ajuda (Solicitante) a quem resolve (Técnico), com visibilidade de gestão (Gestor, Diretor) e administração global do sistema (Administrador), mantendo os dados de cada Unidade isolados entre si.

Este manual descreve como usar o sistema no dia a dia, por perfil de usuário, e como suas principais funcionalidades funcionam.

## Como acessar

Acesse a URL do sistema fornecida pela sua Unidade e entre com o e-mail e senha cadastrados. No primeiro acesso, o sistema pode exigir a troca de senha antes de liberar qualquer outra tela — basta definir uma nova senha para continuar.

Após 5 tentativas de login com senha incorreta, a conta fica bloqueada por 15 minutos por segurança.

## Glossário

| Termo | Significado |
| --- | --- |
| **Unidade** | Uma unidade do Instituto (ex.: Unidade Central, Unidade Secundária). Cada usuário (exceto o Administrador) pertence a uma única Unidade, e só enxerga chamados e dados dessa Unidade. |
| **Tipo de Ocorrência** | A categoria do chamado (por exemplo, "Tecnologia"). Internamente chamado de "Setor" no sistema, mas sempre exibido como "Tipo de Ocorrência" na interface. |
| **Tipo de Problema** | Uma subcategoria dentro de um Tipo de Ocorrência (ex.: "Impressora não funciona"), usada para direcionar o chamado e associada a um SLA em minutos. |
| **SLA** | Tempo alvo (em minutos), configurado por Tipo de Problema, que serve como referência de prazo — hoje é informação de configuração/relatório, não há bloqueio automático quando o prazo é ultrapassado. |
| **Chamado** | O registro de uma solicitação de suporte, com título, descrição, urgência, um Tipo de Ocorrência e Tipo de Problema, e opcionalmente um anexo. |

## Perfis do sistema

- **[Solicitante](perfis/solicitante.md)** — abre chamados e acompanha o atendimento.
- **[Técnico](perfis/tecnico.md)** — atende chamados da sua Unidade e do seu Tipo de Ocorrência.
- **[Gestor e Diretor](perfis/gestor-diretor.md)** — acompanham e gerenciam os chamados e usuários da sua Unidade; o Gestor é escopado ao seu Tipo de Ocorrência, o Diretor vê todas as áreas.
- **[Administrador](perfis/administrador.md)** — gerencia Unidades, Tipos de Ocorrência, Tipos de Problema e usuários em todo o sistema.

## Funcionalidades

- [Ciclo de vida do chamado](funcionalidades/ciclo-de-vida.md)
- [Anexos](funcionalidades/anexos.md)
- [Notificações](funcionalidades/notificacoes.md)
- [Relatórios e dashboard](funcionalidades/relatorios-dashboard.md)

## Operação

Para quem mantém o sistema: [arquitetura](operacao/arquitetura.md), [deploy](operacao/deploy.md) e [acesso e segurança](operacao/acesso-e-seguranca.md).
