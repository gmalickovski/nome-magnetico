# Checklist de validação — DEV-223 (migration 055)

Projeto: `nome_magnetico` (`bhxneaeuhybtucmbmpvg`). **Não aplicar em produção** sem OK do Guilherme.

## Antes de aplicar

- [ ] Backup / janela acordada
- [ ] Revisar diff da `055_security_advisors_dev223.sql`
- [ ] Rollback à mão: `docs/architecture/security-advisors-dev223-rollback.sql`

## Após aplicar (staging ou produção)

### Security Advisors (`get_advisors` → Security)

- [ ] Sem WARN de `public.is_admin()` exposto à REST (`authenticated` não deve ter RPC em `public`)
- [ ] Sem WARN de extensão `vector` em `public` (deve estar em `extensions`)
- [ ] Sem INFO de RLS sem policy em `access_lifecycle_sends`, `analise_leads`, `error_logs`

### SQL de sanidade

```sql
-- is_admin só em private
SELECT n.nspname, p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'is_admin';

SELECT grantee FROM information_schema.routine_privileges
WHERE routine_schema = 'private' AND routine_name = 'is_admin';

-- vector em extensions
SELECT e.extname, n.nspname
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';

-- policies service_role
SELECT c.relname, p.polname, p.polroles::regrole[]
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
WHERE c.relname IN ('access_lifecycle_sends', 'analise_leads', 'error_logs');
```

### App (smoke)

- [ ] Login / sessão em `/app`
- [ ] Usuário admin: leitura de dados admin via app (políticas RLS com `private.is_admin()`)
- [ ] Checkout Stripe (criação de sessão) sem erro
- [ ] `POST /api/save-lead` grava em `analise_leads` (service_role)
- [ ] Busca FAQ / embeddings (`match_faq_embeddings`) se usada no fluxo de suporte

### Repositório

- [ ] `npm test`
- [ ] `npx astro check` e `npm run build` (se alterou TS — esta issue só DB/docs)

## Senha vazada (HaveIBeenPwned)

- [ ] Guilherme: ativar no painel Supabase Auth (fora do escopo desta migration)
