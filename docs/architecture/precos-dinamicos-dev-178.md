# Preços dinâmicos (DEV-178)

Fonte única: Supabase (`product_prices` + `promotions` + cupons em `access_codes`).

- Cálculo: `getEffectivePrice` / `getEffectivePriceCore` em `src/backend/pricing/`.
- Leitura pública: páginas SSR (cache 60 s) e `GET /api/pricing`.
- Checkout recalcula no servidor; metadata Stripe inclui `base_cents`, `final_cents`, `promo_id`.
- Admin ops: aba **Preços base** em `/ops/promocoes` (`PATCH /api/ops/product-prices`).
- Migration: `supabase/migrations/040_product_prices.sql` (aplicar manualmente em produção).

Regra cupom × promoção: `DISCOUNT_EXCLUSIVE_RULE = 'lowest_wins'` em `src/shared/pricing-display.ts`.
