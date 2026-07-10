# Guia de Configuração do Cloudflare R2

Este guia explica como configurar o Cloudflare R2 para armazenamento de fotos e documentos do projeto.

O R2 é compativel com a API S3, por isso o backend pode usar credenciais S3: Access Key ID, Secret Access Key, bucket e endpoint.

## 1. Criar um bucket no R2

1. Aceda ao Cloudflare Dashboard: https://dash.cloudflare.com.
2. Escolha a conta correta.
3. Vá a **R2 Object Storage**.
4. Crie um bucket, por exemplo:

```txt
jagoz-dev
```

5. Guarde o nome do bucket para o `.env`:

```env
R2_BUCKET=jagoz-dev
```

## 2. Criar credenciais S3/API

1. No Dashboard da Cloudflare, vá a **R2**.
2. Abra a área de **API tokens** / **Manage R2 API tokens**.
3. Crie um token com permissões apenas para o bucket do projeto.
4. Para desenvolvimento, pode usar permissões de leitura/escrita no bucket.
5. Copie:
   - Access Key ID
   - Secret Access Key

No `.env`:

```env
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

Nunca commite estas chaves.

## 3. Obter o endpoint correto

O endpoint S3 do R2 normalmente segue este formato:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

No `.env`:

```env
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

O `ACCOUNT_ID` aparece no dashboard da Cloudflare.

## 4. Variáveis necessárias no projeto

```env
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=jagoz-dev
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=10MB
```

## 5. Políticas de acesso recomendadas

Para fotos/documentos de atletas, use estas regras:

- O bucket deve ser privado.
- Uploads devem passar pelo backend autenticado.
- O backend válida:
  - tipo de dono: `USER`, `MEMBER`, `ATHLETE`
  - tipo de ficheiro: foto, cartão de cidadão, exame médico
  - tamanho máximo
  - content type
  - permissões do utilizador
- Documentos sensíveis, como cartão de cidadão e exame médico, não devem ter URL público direto.
- Fotos públicas podem ser expostas via endpoint controlado do backend.

## 6. Boas práticas

- Use buckets separados para dev/prod, por exemplo `jagoz-dev` e `jagoz-prod`.
- Use tokens diferentes para dev/prod.
- De ao token apenas acesso ao bucket necessário.
- Nao guarde chaves em ficheiros versionados.
- Se precisar de URLs públicos, prefira URLs assinados ou endpoints do backend.

## Referências oficiais

- Cloudflare R2 API tokens: https://developers.cloudflare.com/r2/api/tokens/
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/

