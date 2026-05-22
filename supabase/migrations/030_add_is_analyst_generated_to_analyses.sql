-- Migration: 030_add_is_analyst_generated_to_analyses
-- Adds is_analyst_generated column to public.analyses to differentiate analyst-generated client reports.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS is_analyst_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for optimized queries of analyst-generated analyses
CREATE INDEX IF NOT EXISTS idx_analyses_is_analyst_generated
  ON public.analyses(is_analyst_generated)
  WHERE is_analyst_generated = TRUE;
