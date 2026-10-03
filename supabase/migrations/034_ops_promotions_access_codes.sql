-- Migration 034: promoções e códigos de acesso do painel ops (DEV-40)
-- Registro gerenciado pela equipe no host admin. Só o servidor (service_role) lê e grava.
-- Esta migration não altera checkout, Stripe, Asaas nem o resgate de trial.

CREATE TABLE IF NOT EXISTS public.promotions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  product_types   TEXT[]      NOT NULL DEFAULT '{}'
    CHECK (product_types <@ ARRAY['nome_social', 'nome_bebe', 'nome_empresa']::text[]),
  discount_type   TEXT        NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  -- percent: 1 a 100. fixed: centavos de BRL.
  discount_value  INTEGER     NOT NULL CHECK (discount_value > 0),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at         TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  deactivated_at  TIMESTAMPTZ,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promotions_window_check CHECK (ends_at > starts_at),
  CONSTRAINT promotions_percent_check CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

CREATE TABLE IF NOT EXISTS public.access_codes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT        NOT NULL CHECK (code ~ '^[A-Z0-9_-]{3,40}$'),
  kind            TEXT        NOT NULL CHECK (kind IN ('trial', 'gift', 'coupon')),
  product_types   TEXT[]      NOT NULL DEFAULT '{}'
    CHECK (product_types <@ ARRAY['nome_social', 'nome_bebe', 'nome_empresa']::text[]),
  -- trial e gift: dias de acesso (1 a 365)
  trial_days      INTEGER     CHECK (trial_days BETWEEN 1 AND 365),
  -- coupon: percent 1 a 100, fixed em centavos de BRL
  discount_type   TEXT        CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  INTEGER     CHECK (discount_value > 0),
  expires_at      TIMESTAMPTZ,
  note            TEXT        CHECK (note IS NULL OR char_length(note) <= 200),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  deactivated_at  TIMESTAMPTZ,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT access_codes_kind_fields_check CHECK (
    (kind IN ('trial', 'gift') AND trial_days IS NOT NULL AND discount_type IS NULL AND discount_value IS NULL)
    OR
    (kind = 'coupon' AND trial_days IS NULL AND discount_type IS NOT NULL AND discount_value IS NOT NULL)
  ),
  CONSTRAINT access_codes_percent_check CHECK (discount_type IS DISTINCT FROM 'percent' OR discount_value <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes (code);
CREATE INDEX IF NOT EXISTS idx_access_codes_created_at ON public.access_codes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON public.promotions (created_at DESC);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.promotions FROM anon, authenticated;
REVOKE ALL ON public.access_codes FROM anon, authenticated;

DROP POLICY IF EXISTS "promotions_service_all" ON public.promotions;
CREATE POLICY "promotions_service_all" ON public.promotions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "access_codes_service_all" ON public.access_codes;
CREATE POLICY "access_codes_service_all" ON public.access_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
