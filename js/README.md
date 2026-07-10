# Jagoz Frontend

Frontend React + TypeScript servido por Vite.

## Índice

- [Requisitos](#requisitos)
- [Instalar dependências](#instalar-dependências)
- [Correr em desenvolvimento](#correr-em-desenvolvimento)
- [Estrutura](#estrutura)
- [Comandos](#comandos)
- [Tecnologias e Bibliotecas Utilizadas](#tecnologias-e-bibliotecas-utilizadas)
- [Internacionalização (i18n)](#internacionalização-i18n)
- [Documentação relacionada](#documentação-relacionada)

## Requisitos

- Node.js 20 ou superior
- npm
- Backend a correr em `http://localhost:8080`

## Instalar dependências

```powershell
npm install
```

## Correr em desenvolvimento

```powershell
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

O ficheiro `vite.config.ts` tem um proxy para `/api` que aponta para `http://localhost:8080`. Por isso, durante o desenvolvimento, o frontend faz chamadas para `/api/...` e o Vite reencaminha-as para o backend.

Dentro do Docker Compose, o proxy utiliza a variável `VITE_API_PROXY_TARGET=http://backend:8080`.

Os fluxos de pagamento, upload de ficheiros e envio de emails dependem das configurações do backend. Ver:

- `../docs/stripe_setup.md`
- `../docs/cloudflare_r2_setup.md`
- `../docs/smtp_setup.md`

## Estrutura

- `src/features`: páginas, componentes, hooks e chamadas de API por domínio.
- `src/shared`: componentes, hooks, estilos, configuração e i18n reutilizáveis.
- `public/images`: imagens servidas estaticamente pelo Vite.

## Comandos

```powershell
npm run dev      # Iniciar o servidor de desenvolvimento
npm run build    # Compilar TypeScript e construir o bundle para produção (dist/)
npm run preview  # Pré-visualizar o build de produção localmente
```

## Tecnologias e Bibliotecas Utilizadas

- **React Router Dom (v7)**: Gestão de rotas dinâmicas e proteção de acessos com base em papéis (`ADMIN`, `SECRETARIA`, `NORMAL`).
- **Tailwind CSS (v3)**: Framework utilitária de CSS combinada com estilos específicos por funcionalidade.
- **i18next**: Tradução dinâmica e deteção automática do idioma do utilizador (Português/Inglês).
- **@yudiel/react-qr-scanner**: Integração com a câmara para digitalização dos códigos QR dos bilhetes durante o check-in.

## Internacionalização (i18n)

Os ficheiros de tradução encontram-se estruturados por idioma em:
- `src/shared/i18n/locales/pt.ts` (Português)
- `src/shared/i18n/locales/en.ts` (Ingles)

Para adicionar novas chaves ou idiomas, basta atualizar estes dicionários mantendo a paridade de chaves entre ambos os ficheiros.

## Documentação relacionada

- API: `../docs/openapi.yaml`
- Configuração Stripe: `../docs/stripe_setup.md`
- Configuração Cloudflare R2: `../docs/cloudflare_r2_setup.md`
- Configuração Email/SMTP: `../docs/smtp_setup.md`
