-- Exemplo idempotente de importação HQ → Nome Magnético (DEV-114).
-- Sem dados reais. Substitua os UUIDs, códigos e valores antes de rodar.
-- Rodar no SQL Editor do Supabase cloud do NM (service role), DEPOIS da migration 036.
--
-- Promoções: ON CONFLICT (legacy_hq_id)
-- Códigos:   ON CONFLICT (code)
-- Usos:      índices únicos parciais (code_id, user_id) e (code_id, lower(email))
--
-- discount_value de tipo fixed é CENTAVOS de BRL.
-- Se o HQ guardou reais, multiplique por 100 na extração.

BEGIN;

INSERT INTO public.promotions (
  name,
  product_types,
  discount_type,
  discount_value,
  starts_at,
  ends_at,
  is_active,
  banner_text,
  stripe_coupon_id,
  stripe_promo_code,
  legacy_hq_id
) VALUES (
  'Lua Cheia (exemplo)',
  ARRAY['nome_social']::text[],
  'percent',
  20,
  TIMESTAMPTZ '2026-10-01 00:00:00+00',
  TIMESTAMPTZ '2026-10-31 23:59:59+00',
  TRUE,
  'Lua Cheia — 20% até o fim do mês',
  'coupon_exemplo_hq',
  'LUACHEIA',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (legacy_hq_id)
DO UPDATE SET
  name = EXCLUDED.name,
  product_types = EXCLUDED.product_types,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  is_active = EXCLUDED.is_active,
  banner_text = EXCLUDED.banner_text,
  stripe_coupon_id = EXCLUDED.stripe_coupon_id,
  stripe_promo_code = EXCLUDED.stripe_promo_code,
  updated_at = NOW();

INSERT INTO public.access_codes (
  code,
  kind,
  product_types,
  trial_days,
  discount_type,
  discount_value,
  expires_at,
  note,
  is_active,
  stripe_coupon_id,
  stripe_promo_code_id,
  max_uses,
  legacy_hq_id
) VALUES
(
  'DEHB-W6KS-RZY6',
  'coupon',
  ARRAY[]::text[],
  NULL,
  'percent',
  15,
  TIMESTAMPTZ '2026-12-31 23:59:59+00',
  'Cupom de exemplo importado do HQ',
  TRUE,
  'coupon_dehb_exemplo',
  'promo_dehb_exemplo',
  100,
  '00000000-0000-0000-0000-000000000011'
),
(
  'TESTE7',
  'trial',
  ARRAY['nome_social']::text[],
  7,
  NULL,
  NULL,
  TIMESTAMPTZ '2026-12-31 23:59:59+00',
  'Trial de exemplo importado do HQ',
  TRUE,
  NULL,
  NULL,
  50,
  '00000000-0000-0000-0000-000000000012'
)
ON CONFLICT (code) DO UPDATE SET
  kind = EXCLUDED.kind,
  product_types = EXCLUDED.product_types,
  trial_days = EXCLUDED.trial_days,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  expires_at = EXCLUDED.expires_at,
  note = EXCLUDED.note,
  is_active = EXCLUDED.is_active,
  stripe_coupon_id = EXCLUDED.stripe_coupon_id,
  stripe_promo_code_id = EXCLUDED.stripe_promo_code_id,
  max_uses = EXCLUDED.max_uses,
  legacy_hq_id = COALESCE(public.access_codes.legacy_hq_id, EXCLUDED.legacy_hq_id),
  updated_at = NOW();

INSERT INTO public.access_code_uses (
  code_id,
  user_id,
  user_email,
  product_type,
  source,
  used_at
)
SELECT
  c.id,
  NULL,
  'exemplo.importado@nomemagnetico.com.br',
  'nome_social',
  'import',
  TIMESTAMPTZ '2026-09-01 12:00:00+00'
FROM public.access_codes c
WHERE c.code = 'DEHB-W6KS-RZY6'
ON CONFLICT (code_id, (lower(user_email))) WHERE user_id IS NULL AND user_email IS NOT NULL
DO NOTHING;

COMMIT;

-- Conferência (ajuste os filtros):
-- SELECT count(*) FROM public.promotions;
-- SELECT count(*) FROM public.access_codes;
-- SELECT count(*) FROM public.access_code_uses;
