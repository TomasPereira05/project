# Jagoz Backend

Backend Kotlin + Spring Boot com Gradle multi-modulo.

## Modulos

- `host`: ponto de entrada Spring Boot, configuracao, email, Stripe, R2 e JDBI.
- `http`: controllers REST, modelos HTTP, pipeline de autenticacao e problemas.
- `services`: regras de aplicacao.
- `domain`: entidades, validacoes e erros de dominio.
- `repository`: contratos de persistencia.
- `repository-jdbi`: implementacao JDBI/PostgreSQL e scripts SQL.

## Requisitos

- JDK 21
- PostgreSQL
- Docker, recomendado para testes que sobem PostgreSQL temporario

## Variaveis de ambiente

O backend falha no arranque se faltarem variaveis obrigatorias:

- `DB_URL`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_PUBLIC_URL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Ver tambem `.env.example` na raiz do repositorio.

## Base de dados

Criar uma base PostgreSQL e aplicar:

```powershell
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f modules/repository-jdbi/src/sql/JagozSchema.sql
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f modules/repository-jdbi/src/sql/insert-test-data.sql
```

O schema usa o schema PostgreSQL `jagoz`.

## Correr

```powershell
./gradlew.bat :host:bootRun
```

O servidor fica disponivel em `http://localhost:8080`.

## Testes

```powershell
./gradlew.bat test
```

As tarefas Gradle dos modulos `repository-jdbi` e `host` incluem suporte Docker para PostgreSQL de testes.

## API

A API publica e de backoffice esta documentada em `../../docs/openapi.yaml`.

Autenticacao:

- `POST /api/users/login` cria uma sessao e devolve tambem um token.
- O token pode ser enviado por cookie HTTP-only `token` ou por header `Authorization: Bearer <token>`.
- Algumas rotas aceitam acesso anonimo, sobretudo catalogos publicos, eventos disponiveis, detalhe publico de atletas e webhook Stripe.
