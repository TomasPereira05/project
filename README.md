# Jagoz

Aplicacao web para apoio a gestao do GDUE: socios, atletas, patrocinadores, eventos, bilhetes, pagamentos e ficheiros.

O repositorio esta dividido em dois blocos principais:

- `kotlin/project`: backend Kotlin + Spring Boot, organizado por modulos Gradle.
- `js`: frontend React + Vite.

A documentacao da API esta em `docs/openapi.yaml`.

## Requisitos

- JDK 21
- Node.js 20 ou superior
- npm
- PostgreSQL 15 ou superior
- Docker, opcional mas recomendado para testes Gradle com base de dados
- Conta/credenciais Stripe, SMTP e Cloudflare R2 para executar todos os fluxos reais

## Configuracao

1. Copiar o exemplo de ambiente:

```powershell
Copy-Item .env.example .env
```

2. Preencher os valores da `.env`.

Nunca commitar credenciais reais. O backend le varias variaveis obrigatorias no arranque, incluindo `DB_URL`, credenciais SMTP, Stripe e R2.

3. Criar a base de dados PostgreSQL local:

```sql
CREATE DATABASE jagoz;
```

4. Aplicar o schema e, se quiser dados de desenvolvimento, os dados de teste:

```powershell
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f kotlin/project/modules/repository-jdbi/src/sql/JagozSchema.sql
psql "postgresql://postgres:postgres@localhost:5432/jagoz" -f kotlin/project/modules/repository-jdbi/src/sql/insert-test-data.sql
```

O `DB_URL` usado pela aplicacao deve apontar para essa base de dados, por exemplo:

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

Por omissao o Spring Boot arranca em `http://localhost:8080`.

Terminal 2, frontend:

```powershell
cd js
npm install
npm run dev
```

Abrir `http://localhost:5173`. O Vite faz proxy de `/api` para `http://localhost:8080`, configurado em `js/vite.config.ts`.

## Contas de desenvolvimento

Quando `insert-test-data.sql` e aplicado, existem utilizadores de exemplo. A password dos utilizadores inseridos e a mesma hash usada no script de seed (tomas123);

Exemplos de usernames presentes no seed:

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

Os testes dos modulos que precisam de PostgreSQL usam tarefas Gradle/Docker definidas em `repository-jdbi` e `host`.

Frontend:

```powershell
cd js
npm run dev
```

Neste momento o `package.json` nao tem uma suite de testes real configurada.

## Documentacao adicional

- API: `docs/openapi.yaml`
- Backend: `kotlin/project/README.md`
- Frontend: `js/README.md`
- Relatorio e recursos do projeto: `docs/`

## Seguranca

O ficheiro `.env` deve ficar apenas local. Se algum segredo real tiver sido partilhado ou commitado, deve ser trocado no fornecedor respetivo: Stripe, SMTP/email e Cloudflare R2.
