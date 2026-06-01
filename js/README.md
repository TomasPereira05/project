# Jagoz Frontend

Frontend React + TypeScript servido por Vite.

## Requisitos

- Node.js 20 ou superior
- npm
- Backend a correr em `http://localhost:8080`

## Instalar dependencias

```powershell
npm install
```

## Correr em desenvolvimento

```powershell
npm run dev
```

A aplicacao fica em `http://localhost:5173`.

O ficheiro `vite.config.ts` tem proxy para `/api`, apontando para `http://localhost:8080`. Por isso, durante desenvolvimento, o frontend chama `/api/...` e o Vite reencaminha para o backend.

Dentro de Docker Compose, o proxy usa `VITE_API_PROXY_TARGET=http://backend:8080`.

## Estrutura

- `src/features`: paginas, componentes, hooks e chamadas API por dominio.
- `src/shared`: componentes, hooks, estilos, configuracao e i18n reutilizaveis.
- `public/images`: imagens servidas estaticamente pelo Vite.

## Comandos

```powershell
npm run dev
```

O script `test` ainda e o placeholder original do `package.json`.
