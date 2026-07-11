# Jagoz

Aplicação web para apoio à gestão do GDUE: sócios, atletas, patrocinadores, eventos, bilhetes, pagamentos e ficheiros.

O repositório está dividido em dois blocos principais:

- `kotlin/project`: backend Kotlin + Spring Boot, organizado por módulos Gradle.
- `js`: frontend React + Vite.

A documentação da API está em `docs/openapi.yaml`.

## Índice

- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Requisitos](#requisitos)
- [Configuração](#configuração)
- [Como correr](#como-correr)
- [Como correr com Docker](#como-correr-com-docker)
- [Contas de desenvolvimento](#contas-de-desenvolvimento)
- [Testes](#testes)
- [Documentação adicional](#documentação-adicional)
- [Guias de serviços externos](#guias-de-serviços-externos)
- [Segurança](#segurança)

## Arquitetura do Sistema

A aplicação segue uma arquitetura cliente-servidor distribuída:

```mermaid
graph TD
    Client[React Frontend - :5173] -->|API Requests /api| ViteProxy[Vite Dev Server Proxy]
    ViteProxy -->|Port :8080| SpringBoot[Spring Boot Backend]
    SpringBoot -->|Persistência| PostgreSQL[(PostgreSQL Database - :5432)]
    SpringBoot -->|Pagamentos| Stripe[Gateway Stripe]
    SpringBoot -->|Uploads| CloudflareR2[Cloudflare R2 Storage]
    SpringBoot -->|Notificações| SMTP[Servidor SMTP Gmail]
```

## Requisitos

- JDK 21
- Node.js 20 ou superior
- npm
- PostgreSQL 15 ou superior
- Docker, opcional mas recomendado para testes Gradle com base de dados
- Conta/credenciais Stripe, SMTP e Cloudflare R2 para executar todos os fluxos reais

## Configuração

1. Copiar o exemplo de ambiente:

```powershell
Copy-Item .env.example .env
```

2. Preencher os valores do `.env`.

Nunca submeter (commit) credenciais reais. O backend lê várias variáveis obrigatórias no arranque, incluindo `DB_URL`, credenciais SMTP (incluindo `EMAIL_FROM_NAME`), Stripe e R2.

3. Criar a base de dados PostgreSQL local:

```sql
CREATE DATABASE jagoz;
```

4. Aplicar o esquema e, se pretender dados de desenvolvimento, os dados de teste:

```powershell
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f kotlin/project/modules/repository-jdbi/src/sql/JagozSchema.sql
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f kotlin/project/modules/repository-jdbi/src/sql/insert-test-data.sql
```

O `DB_URL` usado pela aplicação deve apontar para essa base de dados, por exemplo:

```text
DB_URL=jdbc:postgresql://localhost:5432/jagoz?user=postgres&password=postgres
```

## Como correr

Abrir dois terminais.

Terminal 1, backend:

```powershell
cd kotlin/project
./gradlew.bat :host:bootRun
```

Por omissão, o Spring Boot arranca em `http://localhost:8080`.

Terminal 2, frontend:

```powershell
cd js
npm install
npm run dev
```

Abrir `http://localhost:5173`. O Vite faz proxy de `/api` para `http://localhost:8080`, configurado em `js/vite.config.ts`.

## Como correr com Docker

Na raiz do repositório:

```powershell
docker compose up --build
```

Serviços expostos:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`, base `jagoz`, user `postgres`, password `postgres`

O Compose aplica automaticamente `JagozSchema.sql` e `insert-test-data.sql` quando o volume da base de dados é criado pela primeira vez. Para recriar a base do zero:

```powershell
docker compose down -v
docker compose up --build
```

O backend recebe placeholders para Stripe, SMTP e R2 se essas variáveis não existirem no ambiente. Isto permite arrancar a aplicação localmente, mas os fluxos reais de pagamentos, email e upload para R2 precisam de credenciais verdadeiras.

## Contas de desenvolvimento

Quando `insert-test-data.sql` é aplicado, existem utilizadores de exemplo. A palavra-passe dos utilizadores inseridos é a mesma hash usada no script de seed (tomas123);

Exemplos de nomes de utilizador (usernames) presentes no seed:

- `tomas`, role `ADMIN`
- `tomas22`, role `SECRETARIA`
- `ana.costa`, role `NORMAL`
- `sponsor.atlantico`, role `NORMAL`

## Testes

Backend:

```powershell
cd kotlin/project
./gradlew.bat test
```

Os testes dos módulos que precisam de PostgreSQL usam `kotlin/project/docker-compose.yml`, com o serviço `db-tests` na porta `5433`.

## Documentação adicional

- API: `docs/openapi.yaml`
- Backend: `kotlin/project/README.md`
- Frontend: `js/README.md`
- Relatório e recursos do projeto: `docs/`

## Guias de serviços externos

Para configurar integrações reais em desenvolvimento/testes:

- Stripe: `docs/stripe_setup.md`
- Cloudflare R2: `docs/cloudflare_r2_setup.md`
- Email/SMTP: `docs/smtp_setup.md`

## Segurança

O ficheiro `.env` deve ficar apenas local. Se algum segredo real tiver sido partilhado ou submetido, deve ser substituído no fornecedor respetivo: Stripe, SMTP/email e Cloudflare R2.
