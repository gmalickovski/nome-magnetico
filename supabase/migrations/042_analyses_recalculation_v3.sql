-- Migration 042 (DEV-189): campos aditivos para versionamento de análises e recálculo v3
-- Sem DROP, sem backfill destrutivo.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS parent_analysis_id uuid REFERENCES public.analyses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recalculated_from_version text,
  ADD COLUMN IF NOT EXISTS recalculated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_analyses_parent_id ON public.analyses(parent_analysis_id);
