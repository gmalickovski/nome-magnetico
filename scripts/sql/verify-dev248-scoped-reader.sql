BEGIN;
SET LOCAL statement_timeout='15s';
DO $verify$
BEGIN
 IF NOT has_schema_privilege('nm_alerts_reader','nm_ops_alerts','USAGE')
 OR NOT has_table_privilege('nm_alerts_reader','nm_ops_alerts.incidents','SELECT')
 OR has_table_privilege('anon','nm_ops_alerts.incidents','SELECT')
 OR has_table_privilege('authenticated','nm_ops_alerts.incidents','SELECT')
 OR has_table_privilege('service_role','nm_ops_alerts.incidents','SELECT')
 OR has_table_privilege('nm_alerts_reader','nm_ops_alerts.incidents','INSERT,UPDATE,DELETE,TRUNCATE')
 OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname='nm_alerts_reader' AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb))
 OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='nm_alerts_reader')
 OR EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='nm_ops_alerts' AND table_name='incidents' AND column_name NOT IN ('kind','entity_id','product_type','incident_at'))
 THEN RAISE EXCEPTION 'DEV248 role/view privilege regression'; END IF;
END $verify$;
GRANT nm_alerts_reader TO postgres;
SET LOCAL ROLE nm_alerts_reader;
SELECT count(*) >= 0 AS restricted_view_readable FROM nm_ops_alerts.incidents;
DO $verify$
BEGIN
 BEGIN
  PERFORM email FROM public.profiles LIMIT 1;
  RAISE EXCEPTION 'reader accessed profiles';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM nome_completo FROM public.analyses LIMIT 1;
  RAISE EXCEPTION 'reader accessed analyses';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  DELETE FROM public.subscriptions WHERE false;
  RAISE EXCEPTION 'reader mutated subscriptions';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $verify$;
RESET ROLE;
SELECT 'DEV248 restricted reader checks passed' AS result;
ROLLBACK;