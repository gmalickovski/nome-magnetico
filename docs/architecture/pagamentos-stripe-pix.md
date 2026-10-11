# Pagamentos Stripe (cartão + PIX)

## Resumo

Nome Magnético cobra acesso de 30 dias (pagamento único, não recorrente) via **Stripe**:

| Método | API | UX |
| --- | --- | --- |
| Cartão | Checkout Session (`mode: payment`, `payment_method_types: ['card']`) | Redirect para Stripe Checkout |
| PIX | PaymentIntent confirmado com `payment_method_types: ['pix']` | Modal in-app com QR + copia e cola |

O Asaas foi removido do fluxo ativo (DEV-127). Registros históricos podem ainda ter `payment_provider = 'asaas'`.

## Conta

Usar sempre a conta Stripe **Nome Magnético**. PIX e cartão devem estar ativos em [Payment methods](https://dashboard.stripe.com/settings/payment_methods).

Se o Dashboard mostrar produtos de outro negócio (ex.: “Sincro Sinergia”), a chave `.env` está errada.

## Fluxos

### Cartão

1. Frontend chama `POST /api/create-checkout`.
2. Backend cria Checkout Session (`src/backend/payments/stripe.ts`).
3. Usuário paga no hosted Checkout.
4. Webhook `checkout.session.completed` com `payment_status = paid` libera a subscription.

### PIX

1. Frontend (`CheckoutModal`) chama `POST /api/create-pix`.
2. Backend cria/confirma PaymentIntent PIX e devolve:
   - `chargeId` = `pi_...`
   - `pixCopiaECola` = `next_action.pix_display_qr_code.data`
   - `qrCodeImage` = URL PNG do QR Stripe
   - `expiresAt`
3. Modal faz polling em `GET /api/check-pix-status?chargeId=pi_...`.
4. Webhook `payment_intent.succeeded` com `metadata.payment_method = 'pix'` cria a subscription e notifica.

O filtro `metadata.payment_method = 'pix'` evita liberar duas vezes o cartão (que também emite `payment_intent.succeeded`, mas é cumprido em `checkout.session.completed`).

## Endpoints

- `POST /api/create-checkout` — cartão
- `POST /api/create-pix` — PIX Stripe
- `GET /api/check-pix-status` — polling pós-PIX
- `POST /api/stripe-webhook` — fulfillment
- `POST /api/asaas-webhook` — **410 Gone** (legado)

## Metadados obrigatórios no PIX

```text
user_id
product_type
access_duration_days=30
coupon_code
ga_client_id
payment_method=pix
```

## Cupons

O desconto do PIX é aplicado **antes** de criar o PaymentIntent (centavos finais). O cartão pode usar coupon/promotion_code nativo do Stripe Checkout.

## Operação

- Remover `ASAAS_*` do ambiente de produção quando não houver cobranças Asaas pendentes.
- Manter `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `STRIPE_PRODUCT_*`.
- No Dashboard Stripe, garantir eventos:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
