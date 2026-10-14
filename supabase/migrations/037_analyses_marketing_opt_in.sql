-- Migration 037: score e consentimento de marketing na análise (DEV-148)
-- Aditiva e idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- `score` já pode existir desde a 008; IF NOT EXISTS não recria a coluna nem o CHECK.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS opt_in_data TIMESTAMPTZ NULL;
