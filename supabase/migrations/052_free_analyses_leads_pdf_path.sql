-- Migration 052: Adicionar coluna pdf_path em free_analyses_leads para Fase 2 de Storage (DEV-211)
-- Permite armazenar o caminho do arquivo no Supabase Storage (bucket free-pdfs)
-- mantendo pdf_base64 como fallback para compatibilidade durante o período de transição.

ALTER TABLE public.free_analyses_leads ADD COLUMN IF NOT EXISTS pdf_path text;

-- Garantir privilégios para service_role
GRANT SELECT, INSERT, UPDATE ON public.free_analyses_leads TO service_role;
