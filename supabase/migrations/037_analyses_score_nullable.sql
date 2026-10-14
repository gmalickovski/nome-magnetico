-- DEV-148: score da análise grátis autenticada.
-- A análise grátis de /api/analyze persiste em public.analyses
-- (is_free ou product_type = analise_gratuita).
-- 008_add_score_to_analyses.sql já cria score INTEGER nullable (CHECK 0–100).
-- Este ALTER é idempotente para ambientes em que a coluna ainda não exista.
-- Sem NOT NULL: a linha nasce antes do cálculo e o score entra no update.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS score INTEGER;
