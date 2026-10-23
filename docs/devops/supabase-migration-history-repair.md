# Reparo do histórico `supabase_migrations.schema_migrations` (DEV-215)

Situação observada em produção (`bhxneaeuhybtucmbmpvg`, out/2026): migrations **048–052** (e possivelmente **042–047**) já refletidas no banco, mas `schema_migrations` parou em versões anteriores (ex.: até **041** em 16/10). Isso faz o próximo `supabase db push` tentar reaplicar SQL já executado.

**Este repositório não aplica o reparo automaticamente.** Use o script SQL idempotente ou a CLI após conferência humana.

## 1. Conferência (somente leitura)

```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;

-- Objetos típicos por migration (ajuste se o banco divergir)
SELECT to_regclass('public.product_votes');                    -- 043
SELECT to_regclass('mcp_admin.mcp_audit');                    -- 044
SELECT to_regclass('client_mcp.client_mcp_audit');            -- 046 (se existir)
SELECT indexname FROM pg_indexes
  WHERE tablename = 'glossary_terms' AND indexname LIKE 'idx_glossary_terms_%'; -- 048
SELECT pg_get_functiondef('public.is_admin()'::regprocedure); -- 049/051
SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'free_analyses_leads' AND column_name = 'pdf_path'; -- 052
```

Monte uma tabela **aplicada sim/não** antes de registrar qualquer versão.

## 2. Opção A — Supabase CLI (preferida)

```bash
supabase link --project-ref bhxneaeuhybtucmbmpvg
supabase migration list
# Registrar só versões confirmadas como já aplicadas (não executa SQL):
supabase migration repair --status applied 042 043 047 048 049 050 051 052
supabase migration list
```

Inclua **044–046** somente depois de aplicar essas migrations no banco (ou se os objetos MCP já existirem e tiverem sido criados manualmente).

## 3. Opção B — Script SQL idempotente

Arquivo: [`scripts/sql/register-applied-migrations-idempotent.sql`](../../scripts/sql/register-applied-migrations-idempotent.sql)

- Insere em `schema_migrations` **somente** quando um “fingerprint” do banco confirma que a migration já rodou.
- Não executa o corpo das migrations.
- **Não** substitui backup / PITR antes de mudanças destrutivas (ex.: 053).

## 4. Idempotência das migrations 048–052

| Arquivo | Idempotência |
|---------|----------------|
| `048_drop_duplicate_glossary_indexes` | `DROP INDEX IF EXISTS` |
| `049_rls_initplan` | `CREATE OR REPLACE` + `ALTER POLICY` (reaplicar pode falhar se política renomeada — conferir antes) |
| `050_rls_consolidate_permissive` | `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| `051_security_advisors_fixes` | `REVOKE`/`GRANT`/`ALTER VIEW`/`ALTER FUNCTION` repetíveis |
| `052_free_analyses_leads_pdf_path` | `ADD COLUMN IF NOT EXISTS` |
| `053_free_analyses_leads_drop_pdf_base64` | Guard + `DROP COLUMN IF EXISTS` (destrutiva) |
| `054_security_advisors_residual` | `REVOKE`/`GRANT`/`COMMENT` condicionais |

## 5. Rollback do registro

- CLI: `supabase migration repair --status reverted <versão>` (só o histórico, não desfaz DDL).
- SQL: `DELETE FROM supabase_migrations.schema_migrations WHERE version = '<versão>';` (com cuidado).
