## ADDED Requirements

### Requirement: Reativação de usuário
O sistema SHALL permitir reativar um usuário inativo, respeitando o mesmo escopo aplicado à desativação. A reativação SHALL restaurar o acesso ao sistema e zerar o bloqueio por tentativas de login malsucedidas, sem alterar a senha.

#### Scenario: Admin reativa usuário desativado por engano
- **WHEN** o Administrador aciona "Reativar" em um usuário inativo e confirma
- **THEN** o usuário volta a constar como ativo e consegue fazer login com a senha que já possuía

#### Scenario: Reativação zera bloqueio de login
- **WHEN** um usuário inativo que estava bloqueado por tentativas malsucedidas é reativado
- **THEN** o contador de tentativas é zerado e o bloqueio é removido

#### Scenario: Reativar usuário fora do escopo
- **WHEN** um Gestor da "Unidade A" tenta reativar um usuário da "Unidade B" ou um usuário fora da sua matriz de papéis gerenciáveis
- **THEN** o sistema retorna HTTP 404 e o usuário permanece inativo

#### Scenario: Reativar usuário já ativo
- **WHEN** uma requisição de reativação é enviada para um usuário ativo
- **THEN** o sistema retorna HTTP 409 e nada é alterado

### Requirement: Exclusão de usuário inativo sem histórico
O sistema SHALL permitir excluir definitivamente um usuário, respeitando o mesmo escopo aplicado à desativação, somente quando ele estiver inativo e não possuir nenhum vínculo no sistema: chamados abertos por ele, chamados atribuídos a ele, registros de histórico de sua autoria ou notificações. Havendo vínculo, o sistema SHALL recusar a exclusão com HTTP 409 e uma mensagem orientando a manter o usuário inativo. Nenhum erro técnico de banco de dados SHALL ser exposto.

#### Scenario: Exclusão de cadastro feito por engano
- **WHEN** o Administrador desativa um usuário que nunca participou de nenhum chamado e em seguida aciona "Excluir" e confirma
- **THEN** o usuário é removido definitivamente e deixa de aparecer na listagem

#### Scenario: Exclusão de usuário com histórico é recusada
- **WHEN** um operador tenta excluir um usuário inativo que já abriu ou atendeu algum chamado
- **THEN** o sistema retorna HTTP 409 com a mensagem "Este usuário possui histórico no sistema e não pode ser excluído. Mantenha-o inativo."
- **AND** o usuário permanece cadastrado e inativo

#### Scenario: Exclusão de usuário ativo é recusada
- **WHEN** uma requisição de exclusão é enviada para um usuário ativo
- **THEN** o sistema retorna HTTP 409 indicando que o usuário deve ser desativado antes

#### Scenario: Excluir usuário fora do escopo
- **WHEN** um Gestor tenta excluir um usuário fora da sua Unidade ou da sua matriz de papéis gerenciáveis
- **THEN** o sistema retorna HTTP 404 e nada é removido

#### Scenario: Ações exibidas para usuários inativos
- **WHEN** o operador visualiza um usuário inativo gerenciável na listagem
- **THEN** são exibidas as ações "Reativar" e "Excluir", cada uma com confirmação, e a ação "Editar" permanece indisponível até a reativação

## MODIFIED Requirements

### Requirement: Formato de CPF e telefone
O sistema SHALL validar o CPF quanto ao **formato** `000.000.000-00`, sem conferir dígitos verificadores, e SHALL garantir sua unicidade entre os usuários.

O telefone SHALL ser armazenado e trafegado na API com DDD, aceitando tanto linha fixa quanto celular, **apenas com dígitos**.

A interface SHALL aplicar máscara durante a digitação: o operador digita apenas números e o CPF é formatado como `000.000.000-00`; o telefone é formatado como `(00) 0000-0000` (fixo) ou `(00) 00000-0000` (celular) e enviado somente com dígitos. Colar um valor já formatado SHALL produzir o mesmo resultado. A listagem SHALL exibir o telefone formatado.

A mesma validação SHALL valer no cliente e no servidor, a partir do schema compartilhado.

#### Scenario: CPF digitado sem pontuação é formatado
- **WHEN** o operador digita `52998224725` no campo CPF
- **THEN** o campo exibe `529.982.247-25` e o valor é aceito

#### Scenario: CPF com dígitos verificadores inconsistentes é aceito
- **WHEN** um gestor informa um CPF no formato correto cujos dígitos verificadores não conferem
- **THEN** o sistema aceita o valor, pois a conferência de dígitos está fora do escopo desta validação

#### Scenario: Telefone celular digitado com máscara
- **WHEN** o operador digita ou cola `(71) 99965-5578` no campo telefone
- **THEN** o campo exibe `(71) 99965-5578`, o valor enviado à API é `71999655578` e o cadastro é salvo

#### Scenario: Telefone fixo é aceito
- **WHEN** o operador digita `7133334444`
- **THEN** o campo exibe `(71) 3333-4444` e o valor é aceito

#### Scenario: Listagem exibe telefone formatado
- **WHEN** a listagem de usuários exibe um telefone armazenado como `71999655578`
- **THEN** a célula mostra `(71) 99965-5578`

#### Scenario: Validação idêntica no servidor
- **WHEN** uma requisição de criação ou edição chega diretamente à API com CPF fora do formato ou telefone contendo caracteres que não sejam dígitos
- **THEN** o servidor rejeita a requisição, sem depender da validação do cliente

### Requirement: Tipo de Ocorrência obrigatório para papéis escopados
O sistema SHALL exigir a seleção de um Tipo de Ocorrência (`sectorId`) ao criar ou editar um usuário com papel `TECNICO` ou `GESTOR`. Para os papéis `SOLICITANTE`, `DIRETOR` e `ADMIN` o campo SHALL permanecer ausente e ser ignorado se enviado. A validação SHALL ocorrer no schema Zod compartilhado, garantindo paridade entre cliente e servidor.

No formulário de usuário, o campo SHALL ser rotulado **"Área de atuação"**, acompanhado de uma dica explicando que ele define o Tipo de Ocorrência atendido pelo usuário e, para Gestores, quais chamados, indicadores e técnicos ele gerencia. As mensagens de validação do campo SHALL usar o mesmo termo.

#### Scenario: Criar Gestor sem Tipo de Ocorrência é rejeitado
- **WHEN** um Administrador submete a criação de um usuário com papel `GESTOR` e sem `sectorId`
- **THEN** o sistema retorna erro de validação no campo `sectorId`, com a mensagem "Área de atuação é obrigatória para Técnicos e Gestores", e o usuário não é criado

#### Scenario: Campo aparece na interface para Gestor
- **WHEN** o operador seleciona o papel "Gestor" no formulário de usuário
- **THEN** o seletor "Área de atuação" é exibido, marcado como obrigatório e acompanhado da dica explicativa

#### Scenario: Campo é ocultado para Diretor
- **WHEN** o operador seleciona o papel "Diretor"
- **THEN** o seletor "Área de atuação" não é exibido e nenhum `sectorId` é enviado

#### Scenario: Alterar papel de Diretor para Gestor passa a exigir a área
- **WHEN** um Administrador edita um Diretor sem `sectorId` alterando seu papel para `GESTOR` sem informar a área de atuação
- **THEN** o sistema retorna erro de validação e a edição não é persistida
