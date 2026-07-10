# Jagoz Backend

Backend Kotlin + Spring Boot com Gradle multi-módulo.

## Índice

- [Módulos](#módulos)
- [Requisitos](#requisitos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Base de dados](#base-de-dados)
- [Correr](#correr)
- [Correr com Docker](#correr-com-docker)
- [Testes](#testes)
- [API](#api)
- [Guias de integrações externas](#guias-de-integrações-externas)

## Módulos

- `host`: ponto de entrada Spring Boot, configuração, email, Stripe, R2 e JDBI.
- `http`: controladores REST, modelos HTTP, pipeline de autenticação e problemas.
- `services`: regras de aplicação.
- `domain`: entidades, validações e erros de domínio.
- `repository`: contratos de persistência.
- `repository-jdbi`: implementação JDBI/PostgreSQL e scripts SQL.

## Requisitos

- JDK 21
- PostgreSQL
- Docker, recomendado para testes que sobem um PostgreSQL temporário

## Variáveis de ambiente

O backend falha no arranque se faltarem variáveis obrigatórias:

- `DB_URL`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USERNAME`
- `EMAIL_FROM_NAME`
- `EMAIL_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_PUBLIC_URL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Ver também `.env.example` na raiz do repositório.

Para detalhes de configuração das integrações:

- Stripe: `../../docs/stripe_setup.md`
- Cloudflare R2: `../../docs/cloudflare_r2_setup.md`
- Email/SMTP: `../../docs/smtp_setup.md`

## Base de dados

Criar uma base PostgreSQL e aplicar:

```powershell
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f modules/repository-jdbi/src/sql/JagozSchema.sql
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f modules/repository-jdbi/src/sql/insert-test-data.sql
```

O esquema usa o schema PostgreSQL `jagoz`.

## Correr

```powershell
./gradlew.bat :host:bootRun
```

O servidor fica disponível em `http://localhost:8080`.

## Correr com Docker

Para correr apenas os serviços Docker do backend/testes a partir desta pasta:

```powershell
docker compose up --build db-tests
```

Para correr a aplicação completa, usar o Compose da raiz do repositório:

```powershell
cd ..\..
docker compose up --build
```

## Testes

```powershell
./gradlew.bat test
```

As tarefas Gradle dos módulos `repository-jdbi`, `services` e `host` sobem automaticamente o serviço `db-tests` definido em `docker-compose.yml`. Este Postgres fica em `localhost:5433` e usa a base `jagoz`, alinhada com o `DB_URL` padrão dos testes.

## API

A API pública e de backoffice está documentada em `../../docs/openapi.yaml`.

### Autenticação:

- `POST /api/users/login` cria uma sessão e devolve também um token.
- O token pode ser enviado por cookie HTTP-only `token` ou por cabeçalho `Authorization: Bearer <token>`.
- Algumas rotas aceitam acesso anónimo, sobretudo catálogos públicos, eventos disponíveis, detalhe público de atletas e webhook Stripe.

## Guias de integrações externas

Os guias operacionais das integrações usadas pelo backend estão na pasta `docs` da raiz:

- `../../docs/stripe_setup.md`
- `../../docs/cloudflare_r2_setup.md`
- `../../docs/smtp_setup.md`
