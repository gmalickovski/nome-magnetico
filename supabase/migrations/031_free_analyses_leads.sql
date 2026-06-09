-- Migration 031: Tabela de leads e PDFs para análise gratuita
-- Armazena os PDFs em base64 e dados básicos de nascimento captados antes do cadastro

CREATE TABLE IF NOT EXISTS public.free_analyses_leads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL,
  nome_completo    TEXT        NOT NULL,
  data_nascimento  DATE        NOT NULL,
  pdf_base64       TEXT,                          -- PDF codificado em base64
  status           TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'error')),
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE public.free_analyses_leads ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: apenas service_role (backend/edge functions) tem acesso total
DROP POLICY IF EXISTS "free_analyses_service_all" ON public.free_analyses_leads;
CREATE POLICY "free_analyses_service_all" ON public.free_analyses_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Índices para otimização de buscas
CREATE INDEX IF NOT EXISTS idx_free_analyses_leads_email ON public.free_analyses_leads (lower(email));
CREATE INDEX IF NOT EXISTS idx_free_analyses_leads_created_at ON public.free_analyses_leads (created_at DESC);
