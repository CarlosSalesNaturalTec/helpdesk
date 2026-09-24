## Context

- `shared/src/schemas/user.ts` valida o CPF no formato `000.000.000-00` e o telefone como 10 ou 11 dígitos. Os dois formatos foram decididos na change `usuario-cpf-telefone` e permanecem.
- `Usuarios.tsx` usa `<input type="text">` simples para os dois campos e desabilita "Editar" quando `ativo === false`. Só existe a ação "Desativar".
- `User` é referenciado por `Ticket.solicitanteId`, `Ticket.tecnicoId`, `TicketHistory.authorId` e `Notification.userId`, todas sem `onDelete`. Um `DELETE` com vínculo falha com P2003.

## Goals / Non-Goals

**Goals:** entrada de dados sem atrito; reverter uma desativação; remover cadastros feitos por engano; campo de área autoexplicativo.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. Máscara só na interface; contrato da API inalterado

Um utilitário `frontend/src/utils/masks.ts` terá funções puras:

- `maskCpf(v)`: remove o que não é dígito, limita a 11 e formata progressivamente (`529.9`, `529.982.2`…).
- `maskTelefone(v)`: remove o que não é dígito, limita a 11 e formata `(71) 3333-4444` com 10 dígitos ou `(71) 99965-5578` com 11. Durante a digitação, até o 10º dígito usa o formato de fixo e troca para celular no 11º.
- `onlyDigits(v)`.

O `onChange` grava o valor mascarado no estado. No envio, o CPF segue mascarado (é o formato do schema) e o telefone passa por `onlyDigits`. Colar `(71) 99965-5578` ou `71999655578` produz o mesmo resultado.

*Alternativa descartada:* biblioteca de máscara (ex.: `react-imask`). Seria uma dependência nova para duas funções de poucas linhas.
*Alternativa descartada:* relaxar o regex do telefone para aceitar a máscara. A base atual está só em dígitos e ficaria misturada.

A mesma `maskTelefone` formata o telefone na listagem. `maskCpf` é idempotente sobre um valor já formatado.

### D2. Reativar

`PATCH /api/usuarios/:id/activate`, com os mesmos papéis e escopo do `deactivate` (`canManageUser`, 404 fora do escopo). Define `ativo: true`, `failedLoginAttempts: 0` e `lockedUntil: null`. Usuário já ativo → 409. A senha **não** é resetada: se o operador quiser, edita depois e define uma nova senha temporária.

### D3. Excluir somente inativos sem vínculo

`DELETE /api/usuarios/:id`:

1. Escopo via `canManageUser` → 404.
2. `ativo === true` → 409 "Desative o usuário antes de excluí-lo". Exigir a desativação prévia evita exclusão acidental de um usuário ativo e casa com o pedido ("excluir usuário inativo").
3. Contar os vínculos (`ticket` como solicitante ou técnico, `ticketHistory` como autor, `notification`) em uma única `Promise.all`. Soma maior que zero → 409 "Este usuário possui histórico no sistema e não pode ser excluído. Mantenha-o inativo."
4. `prisma.user.delete`. Um P2003 (vínculo criado entre a checagem e o delete) também vira 409, como rede de segurança.

Autoexclusão é impossível por construção: o próprio usuário está ativo.

*Alternativas descartadas:* anonimização e soft-delete, discutidas na exploração. Ficam como evolução se a LGPD exigir.

### D4. Interface

- Linhas inativas: "Reativar" (secundário) e "Excluir" (perigo), no lugar de "Desativar". "Editar" continua desabilitado para inativos: reativa-se primeiro.
- Cada ação abre um modal de confirmação. O de exclusão avisa que a ação é irreversível. Um 409 é exibido no próprio modal.
- A interface não tenta prever se o usuário tem vínculos. O servidor decide e explica, o que evita um endpoint extra de contagem.

### D5. "Área de atuação"

- No formulário, o rótulo "Tipo de Ocorrência" passa a ser **"Área de atuação"**, e o placeholder passa a ser "Selecione a área...".
- Abaixo do campo entra a dica: "Tipo de Ocorrência atendido por este usuário. Para Gestores, define quais chamados, indicadores e técnicos ele gerencia."
- As mensagens do `userSchema` e do formulário passam a dizer "Área de atuação é obrigatória para Técnicos e Gestores".
- Nada muda fora do formulário de usuário: na abertura de chamado e nos relatórios, "Tipo de Ocorrência" continua correto, porque ali descreve o chamado.

## Risks / Trade-offs

- **[O cursor pula ao editar no meio do valor mascarado]** → Aceitável para campos curtos. Se incomodar, é possível tratar `selectionStart` no utilitário.
- **[Exclusão em massa não existe]** → Fora de escopo: uma por vez, com confirmação.
- **[Um usuário "virgem" pode ter recebido notificações]** → Na prática, notificações só existem para quem participa de um chamado. Ainda assim, entram na contagem para não depender dessa premissa.

## Migration Plan

Sem migration. Deploy normal pelo `main`, **depois** de `usuarios-permissoes-por-papel`.

## Open Questions

Nenhuma.
