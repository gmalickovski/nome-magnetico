# Pagamentos Stripe (cartão + PIX)

## Resumo

Nome Magnético cobra acesso de 30 dias (pagamento único, não recorrente) via **Stripe Checkout hospedado**.

| Método | Onde o cliente escolhe | Confirmação |
| --- | --- | --- |
| Cartão | Stripe Checkout | `checkout.session.completed` (`payment_status=paid`) |
| PIX | Stripe Checkout | `checkout.session.async_payment_succeeded` |

Não há modal PIX custom nem integração Asaas no fluxo ativo. O modal do app só resume o produto/cupom e redireciona para o Checkout Stripe.

## Conta e Dashboard

Usar sempre a conta Stripe **Nome Magnético**.

Formas de pagamento gerenciadas no Dashboard ([Payment methods](https://dashboard.stripe.com/settings/payment_methods)):

- Cartão: ativo
- PIX: ativo

O código **não** lista `payment_method_types` manualmente. Assim o Stripe usa [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods) e mostra cartão/PIX conforme elegibilidade (moeda BRL, localização, etc.).

Se o Dashboard mostrar produtos de outro negócio (ex.: “Sincro Sinergia”), a chave `.env` está errada.

## Fluxo

1. Frontend abre `CheckoutModal` (resumo + cupom opcional).
2. Usuário clica **Continuar para o pagamento**.
3. Backend cria Checkout Session em `POST /api/create-checkout` (`src/backend/payments/stripe.ts`).
4. Browser redireciona para o Stripe Checkout.
5. Cliente escolhe cartão ou PIX na UI do Stripe.
6. Webhook em `src/pages/api/stripe-webhook.ts` libera a subscription.

### PIX assíncrono

Quando o cliente escolhe PIX:

1. `checkout.session.completed` pode chegar com `payment_status = unpaid` → **não liberar acesso**.
2. Após o pagamento no banco: `checkout.session.async_payment_succeeded` → liberar.
3. Expiração/falha: `checkout.session.async_payment_failed` → notificar.
4. Sessão expirada sem pagamento: `checkout.session.expired` → evento `checkout_abandoned` no PostHog. Não altera acesso.

## Endpoints

- `POST /api/create-checkout` — cria sessão Stripe (único caminho de cobrança)
- `POST /api/stripe-webhook` — fulfillment
- `POST /api/asaas-webhook` — **410 Gone** (legado)

## Opções PIX na sessão

```ts
payment_method_options: {
  pix: { expires_after_seconds: 1800 }, // 30 min
}
```

## Cupons

Aplicados antes de criar a sessão (desconto local / coupon / promotion_code Stripe). O campo nativo de cupom do Checkout fica oculto para evitar duplicidade.

## Eventos de webhook recomendados

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `payment_intent.payment_failed`
- `charge.refunded`

## Operação

- Remover `ASAAS_*` do ambiente quando não houver cobranças Asaas pendentes.
- Manter `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `STRIPE_PRODUCT_*`.
- Ligar/desligar PIX/cartão pelo Dashboard, sem deploy.
