# Runbook: apagar dados de teste (chamados/histórico) em produção

> ⚠️ **Operação destrutiva em produção.** Apaga permanentemente todos os chamados, mensagens/histórico,
> avaliações de satisfação e notificações — de todas as Unidades e Tipos de Ocorrência. Não afeta
> `Unidade`, `Sector` ("Tipo de Ocorrência"), `ProblemType` nem `User` (contas de usuário são preservadas).
> Use quando um conjunto de chamados lançados por usuários durante testes/homologação precisa ser
> zerado antes do uso real do sistema — não é o script de seed (`prisma/seed.ts`), que é para
> ambiente de desenvolvimento.

## O que este runbook faz

| Apaga (dados transacionais) | Preserva (estrutura) |
| --- | --- |
| `Notification` | `Unidade` |
| `Satisfaction` | `Sector` |
| `TicketHistory` | `ProblemType` |
| `Ticket` | `User` |

Também reseta as sequences de `id` das quatro tabelas apagadas e a sequence de `numero` do `Ticket`
(o número exibido ao usuário), para que o primeiro chamado real comece do 1. E remove os anexos
órfãos no bucket do Cloud Storage, já que nenhuma linha de `Ticket` sobra para referenciá-los.

## Pré-requisitos

1. **Confirme que existe um backup recente do Cloud SQL.** A instância `helpdesk-db` tem backup
   automático diário (`--backup-start-time=03:00`, ver `docs/Deploy_GCP.md`). Verifique no console
   (Cloud SQL → instância → Backups) que há um backup de hoje ou de ontem antes de prosseguir — é a
   única forma de reverter esta operação.
2. **Rode fora do horário de pico**, se possível — usuários com uma tela de chamado aberta no
   momento do DELETE não vão quebrar (é só uma leitura que vai passar a 404), mas evite surpresas.
3. Tenha em mãos o nome do bucket de anexos (`GCS_BUCKET_NAME` / `_GCS_BUCKET_NAME` no
   `cloudbuild.yaml`).

## Passo 1 — SQL (Cloud SQL: console/Cloud SQL Studio ou `gcloud sql connect`)

Rode tudo dentro de uma transação. Os `SELECT count(*)` antes e depois do `DELETE` são só para
conferência visual — confirme que os quatro contadores finais estão em `0` antes de dar `COMMIT`.

```sql
BEGIN;

-- Contagem antes (registre os números para conferência)
SELECT
  (SELECT count(*) FROM "Notification")   AS notifications,
  (SELECT count(*) FROM "Satisfaction")   AS satisfaction,
  (SELECT count(*) FROM "TicketHistory")  AS ticket_history,
  (SELECT count(*) FROM "Ticket")         AS tickets;

-- Ordem obrigatória por causa das FKs (nenhuma tabela tem onDelete: Cascade):
-- Notification, Satisfaction e TicketHistory referenciam Ticket; nada referencia elas.
DELETE FROM "Notification";
DELETE FROM "Satisfaction";
DELETE FROM "TicketHistory";
DELETE FROM "Ticket";

-- Reset das sequences: id das 4 tabelas apagadas + numero do Ticket.
-- pg_get_serial_sequence() resolve o nome real da sequence, sem depender de adivinhar
-- a convenção de nomenclatura do Prisma.
SELECT setval(pg_get_serial_sequence('"Notification"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"Satisfaction"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"TicketHistory"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"Ticket"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"Ticket"', 'numero'), 1, false);

-- Contagem depois — os quatro valores devem estar em 0
SELECT
  (SELECT count(*) FROM "Notification")   AS notifications,
  (SELECT count(*) FROM "Satisfaction")   AS satisfaction,
  (SELECT count(*) FROM "TicketHistory")  AS ticket_history,
  (SELECT count(*) FROM "Ticket")         AS tickets;

-- Se os quatro contadores acima estiverem em 0, finalize:
COMMIT;
-- Se algo parecer errado (contador > 0, erro no meio do caminho), desfaça tudo:
-- ROLLBACK;
```

Confirme também, antes do `COMMIT`, que `User`, `Unidade`, `Sector` e `ProblemType` continuam com
as contagens esperadas (não fazem parte deste script, então não deveriam ter mudado — é só uma
checagem de sanidade):

```sql
SELECT
  (SELECT count(*) FROM "User")        AS users,
  (SELECT count(*) FROM "Unidade")     AS unidades,
  (SELECT count(*) FROM "Sector")      AS sectors,
  (SELECT count(*) FROM "ProblemType") AS problem_types;
```

## Passo 2 — Anexos no Cloud Storage (fora do SQL)

Todo objeto de anexo vive sob o prefixo `tickets/{ticketId}/...` (ver `docs/gcs-bucket-setup.md`) e
o bucket é dedicado só a isso — não guarda mais nada. Como todo `Ticket` foi apagado no Passo 1, o
prefixo inteiro pode ser removido:

```bash
gsutil -m rm -r gs://<NOME_DO_BUCKET>/tickets/**
```

Se o prefixo já estiver vazio, o comando retorna "no matches found" — não é um erro, é o esperado
caso não houvesse anexos de teste.

## Verificação final

- Login na aplicação como um dos usuários preservados e confira que a lista de chamados está vazia.
- Abra um novo chamado de teste e confirme que ele nasce com `numero = 1`.
- Confira no bucket (console do Cloud Storage) que não sobrou nenhum objeto sob `tickets/`.
