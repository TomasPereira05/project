# Guia de Configuração de Email/SMTP

Este guia explica como configurar SMTP no projeto, com foco em Gmail.

## 1. Variáveis necessárias no projeto

O backend usa estas variáveis:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=o-teu-email@gmail.com
EMAIL_PASSWORD=palavra-passe-de-aplicacao
EMAIL_FROM_NAME=Jagoz
```

Para Gmail, `EMAIL_PASSWORD` não deve ser a password normal da conta. Deve ser uma **App Password**.

## 2. Ativar verificação em dois passos no Google

Para gerar uma App Password, a conta Google precisa de ter verificação em dois passos ativa.

1. Vá a https://myaccount.google.com/security.
2. Entre em **2-Step Verification** / **Verificação em dois passos**.
3. Ative a verificação com telemóvel, Google Prompt, Authenticator ou outro método.
4. Confirme que a verificação em dois passos ficou ativa.

## 3. Gerar uma App Password

1. Vá a https://myaccount.google.com/apppasswords.
2. Escolha a aplicação, por exemplo **Mail**.
3. Escolha o dispositivo ou use um nome personalizado, por exemplo:

```txt
Jagoz local dev
```

4. Gera a password.
5. Copie a password de 16 caracteres.
6. Coloque no `.env`:

```env
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

Pode guardar sem espacos se preferir:

```env
EMAIL_PASSWORD=xxxxxxxxxxxxxxxx
```

## 4. Configuração SMTP recomendada para Gmail

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=o-teu-email@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=Jagoz
```

Porta recomendada:

| Porta | Segurança | Recomendação |
| --- | --- | --- |
| `587` | STARTTLS | Recomendada |
| `465` | SSL/TLS direto | Alternativa |

O projeto deve usar STARTTLS com a porta `587`.

## 5. Erros comuns

### Authentication failed

Possíveis causas:

- A conta não tem verificação em dois passos ativa.
- Foi usada a password normal da conta em vez da App Password.
- A App Password foi copiada com erro.
- O email em `EMAIL_USERNAME` não corresponde à conta que gerou a App Password.

### Required key EMAIL_FROM_NAME not found

Adicione ao `.env`:

```env
EMAIL_FROM_NAME=Jagoz
```

### Connection timed out

Possíveis causas:

- Firewall ou rede a bloquear SMTP.
- Porta errada.
- `EMAIL_HOST` incorreto.

## 6. Teste recomendado

1. Confirme que o `.env` tem todas as variáveis.
2. Arranque o backend.
3. Execute uma funcionalidade que envie email, por exemplo:
   - compra de bilhete
   - lembrete de pagamento
4. Confirme nos logs do backend se aparece envio com sucesso.
5. Confirme se o email chegou ao destinatário.

## 7. Boas práticas

- Use uma conta dedicada para emails da aplicação.
- Nao use a tua conta pessoal principal em produção.
- Não commites passwords.
- Use App Passwords separadas para dev/prod.

## Referências oficiais

- Google App Passwords: https://support.google.com/accounts/answer/185833
- Gmail SMTP/IMAP settings: https://support.google.com/mail/answer/7126229

