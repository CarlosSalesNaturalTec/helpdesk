> Pré-requisito: `usuarios-permissoes-por-papel` implementada (usa `canManageUser()`).

## 1. Máscaras (frontend)

- [ ] 1.1 Criar `frontend/src/utils/masks.ts` com `onlyDigits`, `maskCpf` e `maskTelefone` (fixo com 10 dígitos, celular com 11, formatação progressiva), conforme design D1. (~1h)
- [ ] 1.2 `Usuarios.tsx`: aplicar `maskCpf`/`maskTelefone` no `onChange` e ao carregar o usuário na edição; enviar o telefone com `onlyDigits`. Ajustar os placeholders para `000.000.000-00` e `(00) 00000-0000`. (~1h)
- [ ] 1.3 `Usuarios.tsx`: exibir o telefone formatado na coluna da listagem. (~15min)

## 2. Rótulo "Área de atuação"

- [ ] 2.1 `shared/src/schemas/user.ts`: unificar as mensagens de `sectorId` em "Área de atuação é obrigatória para Técnicos e Gestores". Rebuild do `shared`. (~15min)
- [ ] 2.2 `Usuarios.tsx`: trocar o rótulo, o placeholder e a mensagem de validação local; adicionar a dica abaixo do select (design D5). (~30min)

## 3. Reativar (backend + frontend)

- [ ] 3.1 `routes/usuarios.ts`: `PATCH /api/usuarios/:id/activate` com escopo `canManageUser` (404), 409 se já ativo, e reset de `failedLoginAttempts`/`lockedUntil`. (~1h)
- [ ] 3.2 `Usuarios.tsx`: botão "Reativar" em linhas inativas, modal de confirmação, refetch ao concluir. (~1h)

## 4. Excluir (backend + frontend)

- [ ] 4.1 `routes/usuarios.ts`: `DELETE /api/usuarios/:id`. Escopo (404), exige inativo (409), contagem de vínculos em `Promise.all` (409 com mensagem orientativa) e `delete` com captura de P2003 → 409 (design D3). (~2h)
- [ ] 4.2 `Usuarios.tsx`: botão "Excluir" em linhas inativas, modal de confirmação avisando que é irreversível, exibindo o 409 no próprio modal. (~1h30)
- [ ] 4.3 Atualizar a tabela de rotas de `usuarios.ts` no `CLAUDE.md` com `activate` e `DELETE`. (~15min)

## 5. Documentação

- [ ] 5.1 `docs/manual/perfis/administrador.md`: CPF e telefone digitados só com números; reativação; exclusão restrita a inativos sem histórico e o motivo. (~1h)
- [ ] 5.2 `docs/manual/perfis/gestor-diretor.md`: explicar o campo "Área de atuação" (responde à dúvida "por que o Gestor tem esse campo") e as ações Reativar/Excluir. Rodar `mkdocs build --strict`. (~1h)

## 6. Verificação

Sem suíte automatizada; verificação manual contra o banco semeado.

- [ ] 6.1 Digitar `52998224725` no CPF exibe `529.982.247-25`; colar um CPF já formatado mantém o formato; o cadastro salva. (~15min)
- [ ] 6.2 Digitar ou colar `(71) 99965-5578` exibe o formato e salva `71999655578` no banco (conferir no Prisma Studio); `7133334444` vira `(71) 3333-4444`. (~15min)
- [ ] 6.3 A listagem mostra os telefones do seed formatados. (~5min)
- [ ] 6.4 `POST` direto na API com telefone mascarado continua recusado (400). (~10min)
- [ ] 6.5 Formulário mostra "Área de atuação" com a dica para Técnico e Gestor; para Diretor, o campo some. (~10min)
- [ ] 6.6 Desativar e reativar um usuário: ele volta a logar com a mesma senha. Reativar um usuário bloqueado por 5 tentativas remove o bloqueio. (~30min)
- [ ] 6.7 Criar um usuário novo, desativar e excluir: some da lista. Tentar excluir `tecnico@` desativado → 409 com a mensagem orientativa. Tentar `DELETE` em usuário ativo → 409. (~30min)
- [ ] 6.8 Como Gestor, tentar reativar ou excluir usuário fora da matriz via API → 404. (~15min)
- [ ] 6.9 `docs/manual/` atualizado e `mkdocs build --strict` sem erros. (~item padrão)
