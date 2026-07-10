# Guia de Configuração do Stripe

Este guia explica como configurar uma conta de testes do Stripe para o projeto Jagoz.

## 1. Criar e usar uma conta de testes

1. Aceda ao Stripe Dashboard: https://dashboard.stripe.com.
2. Crie conta ou entre numa conta existente.
3. Garanta que está a trabalhar em modo de testes/sandbox.
4. Nunca use dados reais de cartão multibanco em modo live para testar.

O Stripe disponibiliza ambientes sandbox/teste onde os pagamentos simulados não movimentam dinheiro real.

## 2. Obter a Secret Key

1. No Dashboard, entre no modo de testes.
2. Vá a **Developers** > **API keys**.
3. Copie a **Secret key** de teste.
4. No `.env` do projeto, defina:

```env
STRIPE_SECRET_KEY=sk_test_...
```

Use sempre `sk_test_...` em desenvolvimento. A chave `sk_live_...` só deve ser usada em produção.

## 3. Configurar webhook local com Stripe CLI

O backend precisa de receber confirmações do Stripe para marcar pagamentos como pagos.

No projeto, o endpoint atual do webhook e:

```txt
http://localhost:8080/api/payments/stripe/webhook
```

Se o backend estiver a correr localmente na porta `8080`, execute:

```bash
stripe listen --forward-to localhost:8080/api/payments/stripe/webhook
```

Enquanto este comando estiver ativo, a Stripe CLI recebe eventos da sua conta de testes e reencaminha-os para o backend local.

## 4. Obter a chave do webhook

Depois de correr:

```bash
stripe listen --forward-to localhost:8080/api/payments/stripe/webhook
```

A CLI mostra uma linha parecida com:

```txt
Ready! You are using Stripe API Version [...]. Your webhook signing secret is whsec_...
```

Copie o valor `whsec_...` para o `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Esta chave é obrigatória para o backend validar que os eventos vieram mesmo do Stripe.

## 5. Eventos de webhook recomendados

Para o fluxo atual de Checkout, o evento mais importante é:

```txt
checkout.session.completed
```

Também pode ouvir estes eventos durante testes:

```txt
payment_intent.succeeded
payment_intent.payment_failed
charge.succeeded
charge.failed
```

O backend deve ignorar eventos que não usa.

## 6. Cartões de teste

Use uma data futura, qualquer CVC valido e qualquer código postal.

| Cenário | Cartão |
| --- | --- |
| Pagamento com sucesso | `4242 4242 4242 4242` |
| Mastercard com sucesso | `5555 5555 5555 4444` |
| Cartão recusado genérico | `4000 0000 0000 0002` |
| Fundos insuficientes | `4000 0000 0000 9995` |
| Requer 3D Secure/autenticação | `4000 0025 0000 3155` |

## 7. Variáveis necessárias no projeto

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_VERSION=2026-02-25.clover
APP_PUBLIC_URL=http://localhost:5173
```

`APP_PUBLIC_URL` é usado para redirecionar o utilizador depois do Checkout.

## 8. Fluxo de teste recomendado

1. Arranque PostgreSQL e backend.
2. Arranque o frontend.
3. Corra:

```bash
stripe listen --forward-to localhost:8080/api/payments/stripe/webhook
```

4. Inicie um pagamento pela aplicação.
5. Use `4242 4242 4242 4242`.
6. Confirme na CLI que chegou `checkout.session.completed`.
7. Confirme na aplicação/base de dados que o pagamento passou para pago.

## Referências oficiais

- Stripe testing: https://docs.stripe.com/testing
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe CLI: https://docs.stripe.com/stripe-cli

