-- DEV-248: private projection only, deliberately owner-evaluated across accounts.
-- Not exposed through PostgREST. No contact fields, names, analysis text or raw errors.
CREATE SCHEMA nm_ops_alerts AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA nm_ops_alerts FROM PUBLIC, anon, authenticated, service_role;
CREATE ROLE nm_alerts_reader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS CONNECTION LIMIT 2;
ALTER ROLE nm_alerts_reader SET default_transaction_read_only = on;
ALTER ROLE nm_alerts_reader SET statement_timeout = '15s';
ALTER ROLE nm_alerts_reader SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE nm_alerts_reader SET search_path = pg_catalog;
CREATE VIEW nm_ops_alerts.incidents WITH (security_barrier=true, security_invoker=false) AS
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

ALTER VIEW nm_ops_alerts.incidents OWNER TO postgres;
REVOKE ALL ON nm_ops_alerts.incidents FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA nm_ops_alerts TO nm_alerts_reader;
GRANT SELECT ON nm_ops_alerts.incidents TO nm_alerts_reader;
COMMENT ON VIEW nm_ops_alerts.incidents IS 'DEV-248: internal operational projection; intentional owner evaluation; restricted reader only; no PII/contact/error payload.';
-- LOGIN/password is provisioned out of band with op; no secret in this migration.
