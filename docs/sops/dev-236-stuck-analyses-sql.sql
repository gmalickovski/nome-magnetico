-- DEV-236 — somente leitura: análises presas em processing (ajuste a data se necessário)
-- Não executar em produção sem revisão humana.

-- Diagnóstico: processing há mais de 20 minutos
SELECT
  id,
  user_id,
  product_type,
  nome_completo,
  status,
  error_message,
  created_at,
  updated_at,
  completed_at,
  NOW() - created_at AS idade
FROM public.analyses
WHERE status IN ('pending', 'processing')
  AND created_at < NOW() - INTERVAL '20 minutes'
ORDER BY created_at ASC;

-- As 4 análises citadas (desde 20/07/2025 — confirme o ano no ambiente)
SELECT
  id,
  user_id,
  product_type,
  status,
  created_at,
  updated_at
FROM public.analyses
WHERE status = 'processing'
  AND created_at >= TIMESTAMPTZ '2025-07-20'
  AND created_at < TIMESTAMPTZ '2025-07-21'
ORDER BY created_at;

-- Correção manual: marcar como error (permite nova tentativa pelo app)
-- UPDATE public.analyses
-- SET
--   status = 'error',
--   error_message = 'Reprocessamento manual DEV-236: análise expirou em processing.',
--   updated_at = NOW()
-- WHERE id IN (
--   'uuid-1',
--   'uuid-2',
--   'uuid-3',
--   'uuid-4'
-- );

-- Alternativa: voltar para pending (não recomendado — preferir nova análise pelo usuário)
-- UPDATE public.analyses SET status = 'pending', error_message = NULL WHERE id IN (...);
