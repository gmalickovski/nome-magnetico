-- DEV-284: alinhar CHECK de public.analyses.product_type ao schema já aplicado em produção.
--
-- Contexto: em produção foi aplicado um hotfix (referido internamente como "023") que inclui
-- 'analise_gratuita' na CHECK. No repositório, 023_refund_tracking.sql cobre outro assunto;
-- a última CHECK versionada para analyses é 005_rename_product_type (sem analise_gratuita).
-- Num banco criado só a partir das migrations do repo, inserts de análise grátis falhariam.
--
-- Nome da constraint: analyses_product_type_check (padrão Postgres / migration 005).
-- subscriptions não é alterada: analise_gratuita existe só em analyses (AnalysisProductType).

ALTER TABLE public.analyses
  DROP CONSTRAINT IF EXISTS analyses_product_type_check;

ALTER TABLE public.analyses
  ADD CONSTRAINT analyses_product_type_check
  CHECK (
    product_type IN (
      'nome_social',
      'nome_bebe',
      'nome_empresa',
      'analise_gratuita'
    )
  );
