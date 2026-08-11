## 1. Estrutura do MkDocs

- [ ] 1.1 Criar `requirements-docs.txt` com `mkdocs` e `mkdocs-material` em versões fixadas.
- [ ] 1.2 Criar `mkdocs.yml` na raiz com `docs_dir: docs/manual`, `site_dir: frontend/dist/manual`, tema Material, `language: pt-BR`, busca e navegação declarada.
- [ ] 1.3 Adicionar `frontend/dist/` ao `.gitignore` se ainda não estiver coberto, e validar `mkdocs build --strict` localmente.
- [ ] 1.4 Definir `site_name` a partir do nome da aplicação (SOLUTUS) e incluir a logomarca no tema.

## 2. Conteúdo — visão geral e personas

- [ ] 2.1 `index.md`: o que é o sistema, glossário (Unidade, Tipo de Ocorrência, Tipo de Problema, SLA) e como acessar.
- [ ] 2.2 `perfis/solicitante.md`: abrir chamado, acompanhar, responder mensagens, fechar com avaliação, reabrir.
- [ ] 2.3 `perfis/tecnico.md`: fila de chamados, assumir, colocar em aguardando, resolver — incluindo o escopo por Unidade e Tipo de Ocorrência.
- [ ] 2.4 `perfis/gestor-diretor.md`: reatribuição, fechamento administrativo, gestão de usuários da unidade, relatórios.
- [ ] 2.5 `perfis/administrador.md`: gestão global de Unidades, Tipos de Ocorrência, Tipos de Problema e usuários.

## 3. Conteúdo — funcionalidades e operação

- [ ] 3.1 `funcionalidades/ciclo-de-vida.md`: diagrama do fluxo de estados e o que cada transição exige.
- [ ] 3.2 `funcionalidades/anexos.md`: formatos aceitos (JPG, PNG, PDF, DOCX), limite de 5 MB, substituição e remoção.
- [ ] 3.3 `funcionalidades/notificacoes.md`: eventos que geram notificação in-app e e-mail.
- [ ] 3.4 `funcionalidades/relatorios-dashboard.md`: métricas, filtros de período e exportação em PDF.
- [ ] 3.5 `operacao/arquitetura.md` e `operacao/deploy.md`: visão da arquitetura e ponteiros para `docs/Deploy_GCP.md` e `docs/gcs-bucket-setup.md` (referenciar, não duplicar).
- [ ] 3.6 `operacao/acesso-e-seguranca.md`: perfis, isolamento por Unidade, troca de senha obrigatória, bloqueio por tentativas.

## 4. Publicação no pipeline

- [ ] 4.1 Adicionar a etapa `build-docs` (`python:3.12-slim`) ao `cloudbuild.yaml`, com `waitFor: ['build-frontend']` e antes de `deploy-frontend`.
- [ ] 4.2 Ajustar `deploy-frontend` para depender de `build-docs` e adicionar `Cache-Control: no-cache` para `manual/**/*.html`.
- [ ] 4.3 Confirmar em um build de teste que `frontend/dist/manual/` sobrevive ao `rsync -d` e que o manual abre em `<url-do-frontend>/manual/`.
- [ ] 4.4 Registrar em `docs/Deploy_GCP.md` que a regra de reescrita de SPA do load balancer deve excluir o prefixo `/manual/`.

## 5. Link na aplicação e política de manutenção

- [ ] 5.1 Adicionar o link "Manual" (`/manual/`, `target="_blank"`) na navbar do `Layout.tsx`, visível a todos os perfis.
- [ ] 5.2 Adicionar ao `CLAUDE.md` a seção "Documentação": toda feature ou mudança de comportamento atualiza `docs/manual/` no mesmo PR; a publicação ocorre exclusivamente pelo trigger de `main`; nunca publicar manualmente a partir de branch.
- [ ] 5.3 Registrar em `CLAUDE.md` os comandos `pip install -r requirements-docs.txt`, `mkdocs serve` e `mkdocs build --strict`.
- [ ] 5.4 Incluir "atualizar `docs/manual/`" como item padrão na seção de verificação das próximas changes do OpenSpec.

## 6. Verificação

- [ ] 6.1 Rodar `mkdocs build --strict` e confirmar zero links quebrados.
- [ ] 6.2 Revisar o manual em um smartphone (o tema Material é responsivo) e conferir a busca em português.
- [ ] 6.3 Confirmar, após merge em `main`, que o site publicado reflete o conteúdo do commit.
