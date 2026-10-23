# Checklist de validação — DEV-223 (migration 055)

Projeto: `nome_magnetico` (`bhxneaeuhybtucmbmpvg`). **Não aplicar em produção** sem OK do Guilherme.

## Antes de aplicar

- [ ] Backup / janela acordada
- [ ] Revisar diff da `055_security_advisors_dev223.sql`
- [ ] Rollback: `docs/architecture/security-advisors-dev223-rollback.sql`

## Após aplicar

### Security Advisors

- [ ] Sem WARN de `public.is_admin()` na REST
- [ ] Extensão `vector` em `extensions` (se a 055 for aplicada integralmente)
- [ ] Sem INFO de RLS sem policy nas 3 tabelas service-only

### SQL — `private.is_admin` e anon

```sql
-- anon NÃO deve ter EXECUTE em is_admin (nem public nem private)
SELECT routine_schema, routine_name, grantee
FROM information_schema.routine_privileges
WHERE routine_name = 'is_admin'
ORDER BY routine_schema, grantee;

-- Policies de leitura anon sem is_admin
SELECT c.relname, p.polname, p.polroles::regrole[], pg_get_expr(p.polqual, p.polrelid)
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
WHERE p.polname LIKE '%_select_anon'
ORDER BY 1, 2;
```

### Teste REST como **anon** (publishable key, sem JWT)

Deve retornar **200** com linhas (ou `[]`), **não** `42501 permission denied`:

```bash
ANON_KEY="<SUPABASE_ANON_KEY>"
API="${SUPABASE_URL}/rest/v1"

curl -s -o /dev/null -w "%{http_code}" \
  "$API/faq_items?select=id&is_active=eq.true&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

curl -s -o /dev/null -w "%{http_code}" \
  "$API/faq_categories?select=id&is_active=eq.true&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

curl -s -o /dev/null -w "%{http_code}" \
  "$API/blog_posts?select=slug&is_published=eq.true&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

curl -s -o /dev/null -w "%{http_code}" \
  "$API/glossary_terms?select=slug&is_published=eq.true&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
```

Esperado: códigos `200` em todas.

### Smoke autenticado / admin / checkout

- [ ] Login `/app`
- [ ] Admin vê conteúdo inativo/rascunho (policy `*_select_authenticated` + `private.is_admin()`)
- [ ] Checkout Stripe OK

### Repositório

- [ ] `npm test`

## Senha vazada (Auth)

- [ ] Painel Supabase — Guilherme
