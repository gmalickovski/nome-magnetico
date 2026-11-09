-- Executar apenas com credencial dedicada de leitura; nenhum dado de contato é selecionado.
WITH clock AS (SELECT now() AS at),
incidents AS (
 SELECT 'payment_without_analysis'::text AS kind, s.id AS entity_id,
        s.product_type, s.starts_at AS incident_at
 FROM public.subscriptions s
 JOIN public.profiles p ON p.id = s.user_id
 CROSS JOIN clock c
 WHERE s.product_type IN ('nome_magnetico','nome_social','nome_bebe','nome_empresa')
   AND s.payment_provider <> 'test' AND s.amount_paid > 0
   AND s.refunded_at IS NULL AND s.ends_at > c.at
   AND s.starts_at < c.at - interval '24 hours'
   AND p.is_test IS FALSE
   AND NOT EXISTS (
     SELECT 1 FROM public.analyses a
     WHERE a.user_id = s.user_id AND a.product_type = s.product_type
       AND a.created_at >= s.starts_at
   )
 UNION ALL
 SELECT CASE WHEN a.status = 'error' THEN 'analysis_error' ELSE 'analysis_stalled' END,
        a.id, a.product_type, a.updated_at
 FROM public.analyses a
 JOIN public.profiles p ON p.id = a.user_id
 CROSS JOIN clock c
 WHERE p.is_test IS FALSE
   AND a.product_type IN ('nome_magnetico','nome_social','nome_bebe','nome_empresa')
   AND ((a.status = 'error' AND a.updated_at >= c.at - interval '60 minutes')
     OR (a.status = 'processing' AND a.updated_at < c.at - interval '30 minutes'))
)
SELECT kind, entity_id, product_type, incident_at
FROM incidents
ORDER BY incident_at, kind, entity_id;
