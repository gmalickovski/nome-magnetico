-- DEV-215: registrar migrations já aplicadas em supabase_migrations.schema_migrations
-- IDEMPOTENTE — não executa DDL das migrations; só alinha o histórico quando o fingerprint confere.
-- Rodar no SQL Editor (produção) somente após OK do Guilherme e checklist em docs/devops/supabase-migration-history-repair.md

CREATE OR REPLACE FUNCTION pg_temp._nm_register_migration_if(
  p_version text,
  p_name text,
  p_fingerprint_ok boolean
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT p_fingerprint_ok THEN
    RAISE NOTICE 'SKIP % (%): fingerprint não confere', p_version, p_name;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations m WHERE m.version = p_version
  ) THEN
    RAISE NOTICE 'SKIP % (%): já registrada', p_version, p_name;
    RETURN;
  END IF;

  INSERT INTO supabase_migrations.schema_migrations (version, name)
  VALUES (p_version, p_name);

  RAISE NOTICE 'REGISTERED % (%)', p_version, p_name;
END;
$$;

-- Ajuste p_version se o seu projeto usar prefixo numérico curto (ex.: '048') ou nome completo do arquivo.
-- Conferir: SELECT version FROM supabase_migrations.schema_migrations LIMIT 3;

SELECT pg_temp._nm_register_migration_if(
  '042',
  '042_analyses_recalculation_v3',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'analyses' AND column_name = 'parent_analysis_id'
  )
);

SELECT pg_temp._nm_register_migration_if(
  '043',
  '043_product_votes_and_social_form_v3',
  to_regclass('public.product_votes') IS NOT NULL
);

SELECT pg_temp._nm_register_migration_if(
  '044',
  '044_mcp_admin',
  to_regclass('mcp_admin.mcp_audit') IS NOT NULL
);

SELECT pg_temp._nm_register_migration_if(
  '045',
  '045_mcp_admin_fase2',
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'mcp_admin' AND p.proname = 'get_lead_360'
  )
);

SELECT pg_temp._nm_register_migration_if(
  '046',
  '046_client_mcp',
  EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'client_mcp')
);

SELECT pg_temp._nm_register_migration_if(
  '047',
  '047_fk_indexes',
  -- Heurística: nenhuma FK sem índice cobrindo a coluna de referência (simplificado)
  NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE c.contype = 'f' AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND (i.indkey::int[])[1] = ANY (
            SELECT unnest(c.conkey::int[])
          )
      )
  )
);

SELECT pg_temp._nm_register_migration_if(
  '048',
  '048_drop_duplicate_glossary_indexes',
  NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'glossary_terms' AND indexname = 'idx_glossary_number'
  )
);

SELECT pg_temp._nm_register_migration_if(
  '049',
  '049_rls_initplan',
  pg_get_functiondef('public.is_admin()'::regprocedure) LIKE '%search_path%'
);

SELECT pg_temp._nm_register_migration_if(
  '050',
  '050_rls_consolidate_permissive',
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') >= 70
);

SELECT pg_temp._nm_register_migration_if(
  '051',
  '051_security_advisors_fixes',
  EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'crm_funil_leads'
      AND definition LIKE '%security_invoker%'
  )
  OR EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'crm_funil_leads' AND c.reloptions IS NOT NULL
  )
);

SELECT pg_temp._nm_register_migration_if(
  '052',
  '052_free_analyses_leads_pdf_path',
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'free_analyses_leads'
      AND column_name = 'pdf_path'
  )
);

DROP FUNCTION pg_temp._nm_register_migration_if(text, text, boolean);
