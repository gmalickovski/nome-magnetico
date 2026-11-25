# SOP · Editar o glossário (DEV-307)

Os textos do glossário (`/glossario`, `/app/glossario` e os termos clicáveis do relatório) vêm **só** da tabela `public.glossary_terms`. O catálogo em `src/shared/glossary/canonical-terms*.ts` é reserva: só aparece se o banco não responder.

Há dois caminhos:

1. **Admin** (`admin.nomemagnetico.com.br/glossario`): listar, buscar, criar, editar, publicar e despublicar. Salvar já atualiza o site.
2. **Agente de IA via Supabase MCP** (o caminho mais comum): SQL direto na tabela. O site atualiza em até 10 minutos (cache do servidor).

## Projetos

| Ambiente | Projeto Supabase | ref |
| --- | --- | --- |
| TESTE | `nome_magnetico_teste` | `kbqrkkltjvmxomrgsrbc` |
| Produção | `nome_magnetico` | `bhxneaeuhybtucmbmpvg` |

Faça primeiro no TESTE, confira e depois repita em produção. Nunca apague linhas: despublique (`is_published = false`).

## Campos

| Coluna | Uso |
| --- | --- |
| `slug` | Endereço (`/glossario/<slug>`). Minúsculas, números e hífen. Não mude o slug de um termo publicado. |
| `term` | Título |
| `summary` | Resumo de 1 a 2 frases (card e tooltip) |
| `definition_markdown` | Texto completo em markdown (use `###` para seções) |
| `category` | `numeros`, `calculo`, `triangulos`, `bloqueios`, `karma`, `assinatura` ou `arcanos` |
| `synonyms` | Formas que viram link no relatório, sem diferenciar maiúsculas |
| `exact_case_aliases` | Formas que só viram link com inicial maiúscula (ex.: `Impressão`) |
| `related_slugs` | Verbetes relacionados |
| `related_number` | Número de 1 a 22, se houver |
| `tags`, `meta_title`, `meta_description` | Filtro e SEO |
| `sort_order` | Ordem (menor primeiro) |
| `is_published` | Aparece no site |

Um mesmo sinônimo não pode estar em dois termos: o link iria para o lugar errado.

## Exemplos

Criar:

```sql
insert into public.glossary_terms
  (slug, term, summary, definition_markdown, category, synonyms, related_slugs, sort_order, is_published)
values (
  'exemplo-de-termo', 'Exemplo de Termo',
  'Resumo curto do termo.',
  E'### O que é\n\nExplicação do termo.',
  'calculo', array['Exemplo de Termo'], array['nota-do-nome'], 1000, true
);
```

Editar o texto:

```sql
update public.glossary_terms
set definition_markdown = E'### Novo texto\n\n...', summary = 'Novo resumo.', updated_at = now()
where slug = 'exemplo-de-termo';
```

Tirar do site:

```sql
update public.glossary_terms set is_published = false, updated_at = now() where slug = 'exemplo-de-termo';
```

## Regras de conteúdo

- Fiel ao motor: tabela de letras e acentos (`src/backend/numerology/numbers.ts`), nota v3 (`src/shared/score-v3.ts`), compatibilidade (`src/backend/numerology/harmonization.ts`) e as regras de sugestão (zero bloqueio, nota mínima 70 e acima do nascimento).
- Proibido: radiestesia, pêndulo, "incompatível" (use "Tensão Vibracional"), promessa de entrega ("receba sua análise", "entrega em X horas").
- Linguagem simples, para o cliente leigo.

## Carga e duplicados

- `scripts/glossary-sync.mts` sincroniza o catálogo do código com o banco sem sobrescrever texto existente (use `--dry-run` antes).
- Slugs antigos duplicados ficam em `GLOSSARY_SLUG_REDIRECTS` (`canonical-terms.ts`): despublicados no banco e redirecionados (301) no site.
- Backup da carga de 17/11/2026: `public.glossary_terms_bkp_20261117`.
