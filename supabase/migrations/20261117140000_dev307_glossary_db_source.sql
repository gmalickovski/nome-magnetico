-- DEV-307 · Glossário 100% no banco.
-- public.glossary_terms passa a ser a fonte única dos textos do glossário. O catálogo em
-- src/shared/glossary/canonical-terms*.ts vira só reserva (banco fora do ar).
-- Esta migration cria só a estrutura e o backup. A carga dos verbetes é feita por
-- `scripts/glossary-sync.mts` (idempotente; mantém o texto já existente no banco).

-- 1. Backup antes de mexer (sem acesso público).
CREATE TABLE IF NOT EXISTS public.glossary_terms_bkp_20261117 AS TABLE public.glossary_terms;
ALTER TABLE public.glossary_terms_bkp_20261117 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.glossary_terms_bkp_20261117 FROM anon, authenticated;

-- 2. Colunas editoriais.
ALTER TABLE public.glossary_terms
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS related_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exact_case_aliases text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order integer;

ALTER TABLE public.glossary_terms DROP CONSTRAINT IF EXISTS glossary_terms_category_check;
ALTER TABLE public.glossary_terms ADD CONSTRAINT glossary_terms_category_check
  CHECK (category IS NULL OR category IN ('numeros','calculo','triangulos','bloqueios','karma','assinatura','arcanos'));

COMMENT ON COLUMN public.glossary_terms.category IS 'Categoria: numeros, calculo, triangulos, bloqueios, karma, assinatura, arcanos';
COMMENT ON COLUMN public.glossary_terms.summary IS 'Resumo curto (1 a 2 frases) para card e tooltip';
COMMENT ON COLUMN public.glossary_terms.synonyms IS 'Formas que viram link no texto (sem diferenciar maiúsculas)';
COMMENT ON COLUMN public.glossary_terms.exact_case_aliases IS 'Formas que só viram link com inicial maiúscula (ex.: Impressão)';
COMMENT ON COLUMN public.glossary_terms.related_slugs IS 'Slugs dos verbetes relacionados';
COMMENT ON COLUMN public.glossary_terms.sort_order IS 'Ordem de exibição (menor primeiro)';
