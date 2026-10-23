-- Migration 048: drop de índices duplicados em public.glossary_terms (DEV-214)
-- Idempotente. NÃO aplicar da máquina do agente: o Dev aplica depois do ok.
-- Mantém idx_glossary_terms_number, idx_glossary_terms_slug, idx_glossary_terms_term e o constraint único glossary_terms_slug_key.

DROP INDEX IF EXISTS public.idx_glossary_number;
DROP INDEX IF EXISTS public.idx_glossary_slug;
DROP INDEX IF EXISTS public.idx_glossary_term;
