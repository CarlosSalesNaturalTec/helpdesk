# Arquitetura

Visão de alto nível para quem mantém o sistema. Para os detalhes de código, consulte o `CLAUDE.md` na raiz do repositório.

## Stack

- **Frontend:** React 18 + TypeScript, SPA servida como site estático.
- **Backend:** Node.js 20 + TypeScript + Fastify 4, API REST.
- **Banco de dados:** PostgreSQL 15, acessado via Prisma 5 (ORM).
- **Validação:** Zod, com schemas compartilhados entre frontend e backend (`@helpdesk/shared`).
- **Autenticação:** JWT (expiração de 15 minutos) + bcryptjs.
- **Anexos:** Google Cloud Storage.
- **E-mail:** SendGrid.
- **PDF:** PDFKit (relatórios), gerado no backend a partir de dados enviados pelo frontend.

## Isolamento de dados

O modelo de segurança central do sistema: cada Unidade só enxerga os próprios dados, e cada Técnico é ainda mais restrito ao seu Tipo de Ocorrência. Essa regra é aplicada em toda consulta do backend — veja [Acesso e segurança](acesso-e-seguranca.md).

## Hospedagem

Produção roda inteiramente no Google Cloud Platform: backend em Cloud Run, banco em Cloud SQL, frontend estático (incluindo este manual) no Firebase Hosting. Veja [Deploy](deploy.md) para os detalhes de infraestrutura e pipeline.
