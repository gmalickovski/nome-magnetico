-- Migration 041 (DEV-185): colunas aditivas para score v3 — sem DROP nem backfill.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS score_version text,
  ADD COLUMN IF NOT EXISTS score_v3 integer,
  ADD COLUMN IF NOT EXISTS nivel text,
  ADD COLUMN IF NOT EXISTS potencial integer,
  ADD COLUMN IF NOT EXISTS score_detalhe jsonb;
