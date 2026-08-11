# Acesso e segurança

## Perfis

O sistema tem 5 perfis (`role`): **Solicitante**, **Técnico**, **Gestor de TI**, **Diretor** e **Administrador**. Cada endpoint da API é restrito a um subconjunto de perfis; a interface esconde o que o usuário não tem permissão de usar, mas a validação real acontece sempre no backend.

## Isolamento por Unidade e Tipo de Ocorrência

- **Solicitante** só vê os próprios chamados.
- **Técnico, Gestor de TI e Diretor** só veem dados da própria Unidade. O **Técnico** é ainda mais restrito: apenas chamados do seu Tipo de Ocorrência dentro da Unidade.
- **Administrador** não tem restrição — enxerga todas as Unidades.

Essa regra é aplicada em toda consulta relevante do backend (listagem de chamados, dashboard, relatórios, gestão de usuários) — nunca apenas na interface.

## Autenticação

- Login com e-mail e senha, protegido por hash **bcrypt**.
- Sessão via **JWT** com expiração de **15 minutos**.
- **Bloqueio por tentativas:** após 5 tentativas de login com senha incorreta, a conta fica bloqueada por **15 minutos**.

## Troca de senha obrigatória

Usuários criados com a flag de redefinição de senha pendente (por exemplo, o usuário Administrador padrão no primeiro uso) são bloqueados em **toda** rota da API, exceto a de troca de senha, até definirem uma nova senha. O mesmo bloqueio é replicado na interface, redirecionando automaticamente para a tela de troca de senha.

## Anexos

Os arquivos anexados a chamados são validados por tipo (JPG, PNG, PDF, DOCX) e tamanho (até 5 MB) antes do upload — veja [Anexos](../funcionalidades/anexos.md). Os objetos ficam em um bucket do Google Cloud Storage com acesso público por URL, da mesma forma que o próprio frontend.
