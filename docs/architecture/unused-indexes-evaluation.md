# Avaliação de Índices Sem Uso no Banco de Dados (DEV-214)

Este documento registra a auditoria e as decisões tomadas a respeito dos 16 índices reportados como "sem uso" (`idx_scan = 0`) pelo index advisor do Supabase em 23/10/2026.

## Contexto

Os contadores de estatísticas de uso de índices (`pg_stat_user_indexes`) refletem a atividade acumulada desde o último reset em 12/02/2026. Em tabelas com volume baixo ou consultas especializadas/esporádicas, um índice com `idx_scan = 0` não significa necessariamente que deva ser removido. A remoção precipitada pode penalizar tarefas em lote, busca semântica, verificações de rate limit ou jobs administrativos.

---

## 1. Índices Duplicados em `public.glossary_terms` (Removidos)

Na migration `048_drop_duplicate_glossary_indexes.sql`, os seguintes 3 índices duplicados foram eliminados:
- `public.idx_glossary_number` (duplicado de `idx_glossary_terms_number` em `related_number`)
- `public.idx_glossary_slug` (duplicado de `idx_glossary_terms_slug` e do constraint único `glossary_terms_slug_key` em `slug`)
- `public.idx_glossary_term` (duplicado de `idx_glossary_terms_term` em `term`)

**Decisão:** Removidos via migration 048. Mantidos os equivalentes canônicos `idx_glossary_terms_*`.

---

## 2. Índices Avaliados e Mantidos (13 índices)

| Tabela / Schema | Índice | Coluna(s) | Decisão | Justificativa Técnica |
|---|---|---|---|---|
| `public.faq_embeddings` | `faq_embeddings_vector_idx` | `embedding vector_cosine_ops` | **Manter** | Índice vetorial IVFFlat/HNSW para busca semântica (RAG) de suporte. O uso é sob demanda e esporádico via bot de suporte. Sem o índice, a busca vetorial fará scan sequencial caro de embeddings. |
| `public.access_codes` | `idx_access_codes_code_normalized` | `code_normalized` | **Manter** | Utilizado na validação e resgate case-insensitive de códigos de cupom/trial no painel `/acesso/resgatar`. Essencial com o crescimento de campanhas. |
| `public.access_codes` | `idx_access_codes_created_at` | `created_at DESC` | **Manter** | Usado na ordenação e listagem paginada do painel administrativo Ops (`/ops/access-codes`). |
| `public.support_contact_rate_limits` | `idx_support_contact_rate_limits_ip_created` | `(ip, created_at)` | **Manter** | Usado para verificação de janela de rate limit por IP no envio de formulário de suporte (`/api/support/contact`). O tráfego de abuso é pontual, mas o índice previne DoS. |
| `public.product_price_history` | `idx_product_price_history_product_changed` | `(product_type, changed_at DESC)` | **Manter** | Histórico de auditoria de alterações de preços. O painel consulta histórico sob demanda. |
| `public.blog_reactions` | `idx_blog_reactions_slug` | `slug` | **Manter** | Agregação de reações por artigo de blog. Tabela pequena atualmente, mas índice previne sequential scans à medida que os artigos recebem engajamento. |
| `public.blog_posts` | `idx_blog_posts_featured` | `is_featured` | **Manter** | Filtro para destacar artigos no topo do blog (`/blog`). |
| `public.blog_posts` | `idx_blog_posts_cover_published` | `(published_at DESC)` | **Manter** | Ordenação cronológica de posts públicos publicados. |
| `public.error_logs` | `idx_error_logs_type` | `error_type` | **Manter** | Filtro de logs de erro por categoria para diagnóstico administrativo. |
| `public.error_logs` | `idx_error_logs_resolved` | `resolved` | **Manter** | Filtro de erros não resolvidos no painel Ops/Admin. |
| `suporte.tickets` | `tickets_status_idx` | `status` | **Manter** | Filtro de fila de atendimento por status (aberto, pendente, fechado) no sistema de suporte. |
| `suporte.tickets` | `tickets_customer_email_idx` | `customer_email` | **Manter** | Busca de histórico de tickets por e-mail do cliente durante atendimento. |
| `suporte.tickets` | `tickets_gmail_thread_id_idx` | `gmail_thread_id` | **Manter** | Sincronização e threading de mensagens de e-mail via n8n/Gmail. |

---

## 3. Resumo das Ações na DEV-214

1. **21 Foreign Keys Indexadas**: Migration `047_fk_indexes.sql` adiciona índices para todas as chaves estrangeiras pendentes, otimizando cascades de deleção, joins e filtros de RLS.
2. **3 Índices Duplicados Removidos**: Migration `048_drop_duplicate_glossary_indexes.sql` limpa os índices redundantes em `glossary_terms`.
3. **13 Índices Preservados**: Nenhuma remoção adicional nos 13 índices listados acima para garantir estabilidade operacional e desempenho futuro.
