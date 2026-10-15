-- Migration 040: preços base por produto (DEV-178)
-- Fonte única de preço no Supabase. Leitura pública via API server-side; escrita só service_role.

CREATE TABLE IF NOT EXISTS public.product_prices (
  product_type  TEXT        PRIMARY KEY
    CHECK (product_type IN ('nome_social', 'nome_bebe', 'nome_empresa')),
  base_cents    INTEGER     NOT NULL CHECK (base_cents > 0),
  min_cents     INTEGER     NOT NULL CHECK (min_cents > 0),
  label         TEXT        NOT NULL CHECK (char_length(label) BETWEEN 2 AND 80),
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT product_prices_min_lte_base CHECK (min_cents <= base_cents)
);

CREATE TABLE IF NOT EXISTS public.product_price_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type  TEXT        NOT NULL
    CHECK (product_type IN ('nome_social', 'nome_bebe', 'nome_empresa')),
  base_cents    INTEGER     NOT NULL CHECK (base_cents > 0),
  min_cents     INTEGER     NOT NULL CHECK (min_cents > 0),
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_price_history_product_changed
  ON public.product_price_history (product_type, changed_at DESC);

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.product_prices FROM anon, authenticated;
REVOKE ALL ON public.product_price_history FROM anon, authenticated;

DROP POLICY IF EXISTS "product_prices_service_all" ON public.product_prices;
CREATE POLICY "product_prices_service_all" ON public.product_prices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "product_price_history_service_all" ON public.product_price_history;
CREATE POLICY "product_price_history_service_all" ON public.product_price_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.product_prices (product_type, base_cents, min_cents, label)
VALUES
  ('nome_social', 9800, 100, 'Nome Social'),
  ('nome_bebe', 8000, 100, 'Nome de Bebê'),
  ('nome_empresa', 12500, 100, 'Nome Empresarial')
ON CONFLICT (product_type) DO NOTHING;
