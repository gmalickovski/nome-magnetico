# Analytics e conversoes de pagamento

Ultima atualizacao: 2026-05-19

Este documento descreve a arquitetura de analytics do Nome Magnetico para eventos
de marketing, checkout e conversao de pagamento confirmado.

## Objetivo

Medir conversoes com a maior precisao possivel sem depender apenas do navegador
do usuario. O evento canonico de receita deve nascer no backend, depois da
confirmacao real do pagamento pelo provedor.

## Camadas de medicao

### 1. GA4 no navegador

Arquivo principal:

- `src/layouts/BaseLayout.astro`

O script do Google Analytics 4 e carregado apenas depois do consentimento de
cookies (`nm-cookie-consent=all`). O ID publico vem de:

```env
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Se a variavel nao existir, o layout mantem fallback para o ID historico do
projeto.

Eventos client-side continuam passando por:

- `src/frontend/lib/analytics.ts`

Esses eventos medem comportamento, funil e cliques:

- `checkout_start`
- `checkout_redirect_start`
- `checkout_failed`
- `pix_start`
- `pix_failed`
- `purchase_complete`

`purchase_complete` e apenas um evento de retorno visual ao app
(`/app?checkout=success`). Ele nao e a fonte canonica de receita, porque depende
do usuario voltar ao site, manter cookies e permitir Analytics.

### 2. Captura de atribuicao no checkout

Arquivos:

- `src/pages/api/create-checkout.ts`
- `src/pages/api/create-pix.ts`
- `src/backend/analytics/ga4.ts`

Ao iniciar checkout Stripe ou PIX Asaas, o backend tenta extrair o `client_id`
do cookie `_ga` via `getGaClientIdFromRequest`.

Esse `client_id` e preservado:

- Stripe: metadata da Checkout Session e do Payment Intent (`ga_client_id`).
- Asaas: `externalReference` no formato
  `nomemagnetico:userId:productType:couponCode:gaClientId`.

Isso permite que o webhook envie a compra server-side e, quando o cookie existir,
o GA4 consiga ligar a compra aos dados de origem/campanha da sessao.

### 3. Conversao canonica server-side

Arquivo principal:

- `src/backend/analytics/ga4.ts`

Webhooks que disparam a conversao:

- `src/pages/api/stripe-webhook.ts`
- `src/pages/api/asaas-webhook.ts`

Quando o pagamento e confirmado, o backend envia para o GA4 Measurement Protocol
o evento recomendado:

```ts
purchase
```

Parametros enviados:

- `transaction_id`: `checkout.session.id` no Stripe ou `asaas_${payment.id}` no Asaas.
- `value`: valor pago em reais.
- `currency`: `BRL`.
- `affiliation`: `Nome Magnetico`.
- `payment_provider`: `stripe` ou `asaas`.
- `product_type`: `nome_social`, `nome_bebe` ou `nome_empresa`.
- `coupon`: codigo de cupom, quando houver.
- `items[]`: item comprado com `item_id`, `item_name`, `item_brand`,
  `item_category`, `price` e `quantity`.

O evento server-side nao bloqueia liberacao de acesso. Se o GA4 estiver fora,
mal configurado ou indisponivel, o erro e apenas logado.

## Variaveis de ambiente obrigatorias

Frontend:

```env
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Backend:

```env
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=xxxxxxxx
GA4_CLIENT_ID_HASH_SECRET=uuid_ou_string_aleatoria
```

`GA4_API_SECRET` deve ser criado no GA4:

`Admin -> Data collection and modification -> Data streams -> Web stream -> Measurement Protocol API secrets`

Nunca expor `GA4_API_SECRET` no cliente.

## Fallback de client_id

Quando o cookie `_ga` nao existe, o backend gera um `client_id` pseudonimo com
HMAC do `userId`. Isso preserva a contagem absoluta de compras confirmadas, mas
com menor qualidade de atribuicao de campanha do que uma compra ligada ao cookie
real do GA.

Ordem de segredo para o HMAC:

1. `GA4_CLIENT_ID_HASH_SECRET`
2. `INTERNAL_API_SECRET`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. fallback local `nome-magnetico`

Em producao, configurar sempre `GA4_CLIENT_ID_HASH_SECRET`.

## Configuracao no Google Analytics

No GA4:

1. Criar o `GA4_API_SECRET` do Measurement Protocol no Web stream.
2. Conferir se o evento `purchase` chega no Realtime/DebugView apos uma compra
   real ou teste controlado.
3. O evento recomendado `purchase` e tratado pelo GA4 como evento principal de
   ecommerce; ainda assim, conferir em `Admin -> Data display -> Events` se ele
   aparece como key event.
4. Para usar em campanhas, criar/importar uma conversao no Google Ads a partir
   do evento `purchase` do GA4.

## Fonte da verdade

Para receita e conversao de pagamento confirmado, a fonte da verdade e:

```text
Webhook Stripe/Asaas -> createSubscription -> trackPurchaseConfirmed -> GA4 purchase
```

O evento client-side `purchase_complete` deve ser usado apenas para diagnostico
do retorno ao app e UX pos-checkout, nao para receita oficial.

## Cuidados

- Nao disparar `purchase` no navegador para evitar duplicidade.
- Nao enviar dados pessoais como email, nome ou telefone ao GA4.
- Usar `transaction_id` unico para deduplicacao.
- Manter `purchase_complete` separado de `purchase`.
- Se alterar provedores de pagamento, integrar o novo webhook em
  `trackPurchaseConfirmed`.
