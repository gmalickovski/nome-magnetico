-- Migration 032: Tabela de rate limit para o testador público de nomes (analyze-live)
-- Referenciada em src/pages/api/analyze-live.ts desde a introdução do rate limit por IP,
-- mas a migration nunca foi criada — causava erro em toda consulta anônima:
-- "Could not find the table 'public.public_analysis_rate_limits' in the schema cache"
-- (não bloqueava a resposta, o erro era só logado, mas o rate limit real nunca funcionou).

CREATE TABLE IF NOT EXISTS public.public_analysis_rate_limits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash          TEXT        NOT NULL,
  nome_consultado  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.public_analysis_rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: apenas service_role (backend) tem acesso — mesmo padrão das demais tabelas internas
DROP POLICY IF EXISTS "public_analysis_rate_limits_service_all" ON public.public_analysis_rate_limits;
CREATE POLICY "public_analysis_rate_limits_service_all" ON public.public_analysis_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Índices: a query em analyze-live.ts filtra por ip_hash + created_at (janela de 24h)
CREATE INDEX IF NOT EXISTS idx_public_analysis_rate_limits_ip_created
  ON public.public_analysis_rate_limits (ip_hash, created_at DESC);

-- Limpeza automática: linhas com mais de 7 dias não têm mais utilidade (janela de rate limit é 24h)
CREATE INDEX IF NOT EXISTS idx_public_analysis_rate_limits_created_at
  ON public.public_analysis_rate_limits (created_at);
