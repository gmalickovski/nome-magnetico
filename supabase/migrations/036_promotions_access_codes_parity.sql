-- Migration 036: paridade com o HQ para promoções, cupons e trials (DEV-114)
-- Aditiva e idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- discount_value de tipo fixed continua em CENTAVOS de BRL (regra da 035).
-- legacy_hq_id é a chave de idempotência da importação HQ → NM.

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS banner_text TEXT CHECK (banner_text IS NULL OR char_length(banner_text) BETWEEN 1 AND 280),
  ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_promo_code TEXT,
  ADD COLUMN IF NOT EXISTS legacy_hq_id UUID;

ALTER TABLE public.access_codes
  ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_promo_code_id TEXT,
  ADD COLUMN IF NOT EXISTS max_uses INTEGER CHECK (max_uses IS NULL OR max_uses >= 1),
  ADD COLUMN IF NOT EXISTS legacy_hq_id UUID;

-- Lookup de cupom/trial case-insensitive e com ou sem hífen.
ALTER TABLE public.access_codes
  ADD COLUMN IF NOT EXISTS code_normalized TEXT
    GENERATED ALWAYS AS (upper(replace(code, '-', ''))) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_legacy_hq_id
  ON public.promotions (legacy_hq_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_codes_legacy_hq_id
  ON public.access_codes (legacy_hq_id);

CREATE INDEX IF NOT EXISTS idx_access_codes_code_normalized
  ON public.access_codes (code_normalized);

CREATE INDEX IF NOT EXISTS idx_promotions_active_window
  ON public.promotions (is_active, starts_at, ends_at, created_at DESC);

CREATE TABLE IF NOT EXISTS public.access_code_uses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id       UUID        NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    TEXT,
  product_type  TEXT        CHECK (
    product_type IS NULL
    OR product_type = 'all'
    OR product_type = ANY (ARRAY['nome_social', 'nome_bebe', 'nome_empresa']::text[])
  ),
  source        TEXT        NOT NULL DEFAULT 'redeem'
                CHECK (source IN ('redeem', 'webhook', 'import', 'ops')),
  used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Um uso por código + usuário autenticado.
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_code_uses_code_user
  ON public.access_code_uses (code_id, user_id)
  WHERE user_id IS NOT NULL;

-- Sem user_id, um uso por código + e-mail (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_code_uses_code_email
  ON public.access_code_uses (code_id, (lower(user_email)))
  WHERE user_id IS NULL AND user_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_access_code_uses_code_id
  ON public.access_code_uses (code_id, used_at DESC);

ALTER TABLE public.access_code_uses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.access_code_uses FROM anon, authenticated;

DROP POLICY IF EXISTS "access_code_uses_service_all" ON public.access_code_uses;
CREATE POLICY "access_code_uses_service_all" ON public.access_code_uses
  FOR ALL TO service_role USING (true) WITH CHECK (true);
