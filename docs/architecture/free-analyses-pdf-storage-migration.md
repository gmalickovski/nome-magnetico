# Arquitetura e Plano de Migração: Disk IO & PDFs da Análise Gratuita (DEV-211)

## 1. Contexto e Diagnóstico

Em 21/10/2026, foi emitido um alerta crítico de consumo do **Disk IO Budget** no Supabase Cloud (`bhxneaeuhybtucmbmpvg`).
- A tabela `public.free_analyses_leads` atingiu **331 MB** em disco, enquanto a segunda maior tabela (`analyses`) possui apenas **3,8 MB**.
- Das 522 linhas, 521 possuem a coluna `pdf_base64` preenchida com uma média de ~627 kB por arquivo.
- O histórico registrou 1.669 updates e 1.352 seq scans, evidenciando consultas `select *` que traziam o TOAST de 627 kB para a memória, além de reescritas completas da coluna em operações de download e reprocessamento.
- **LGPD:** A permanência de arquivos PDF em texto codificado dentro da tabela relacional amplia a superfície de dados pessoais em backups do banco.

---

## 2. Mapeamento de Leituras e Escritas (`free_analyses_leads`)

| Arquivo e Linha | Operação | Toca `pdf_base64`? | Status / Ação DEV-211 |
| --- | --- | --- | --- |
| `supabase/functions/send-free-pdf/index.ts:39` | `select` por ID | Sim (para anexo de e-mail) | **Corrigido:** `select("*")` substituído por colunas estritas `id, email, nome_completo, pdf_base64`. |
| `supabase/functions/send-free-pdf/index.ts:193` | `update` status complete | Não | Mantido (`status`, `completed_at`). Não toca em PDF. |
| `supabase/functions/send-free-pdf/index.ts:217` | `update` status error | Não | Mantido (`status`, `error_message`). Não toca em PDF. |
| `src/pages/api/download-pdf.ts:98` | `select` colunas necessárias | Sim (para download) | Mantido colunas explícitas. |
| `src/pages/api/download-pdf.ts:131` | Condição de regeneração | **Regravação desnecessária** | **Corrigido:** Apenas regenera e regrava se `isPdfMissing` (`!lead.pdf_base64`). Não regrava mais a cada download. |
| `src/pages/api/teste-bloqueio.ts:46` | `insert` inicial do lead | Não | Mantido status `processing`. |
| `src/pages/api/teste-bloqueio.ts:92` | `update` com PDF gerado | Sim (gravação inicial) | Preparado para Fase 2 (gravar `pdf_path`). |
| `src/pages/api/teste-bloqueio.ts:69, 128, 138` | `update` status | Não | Mantido sem tocar em `pdf_base64`. |
| `src/backend/public-free-analysis/email-lead-guard.ts:17` | `select id, created_at` | Não | Mantido. |
| `src/backend/public-free-analysis/reprocess-free-leads.ts:100` | `select` de colunas explícitas | Não | Mantido. |
| `src/pages/app/index.astro:102` | `select id, nome, data` | Não | Mantido. |

---

## 3. Fases de Execução

### Fase 1: Otimizações de Código (Implementada na DEV-211)
- **Eliminação de `select *`:** A Edge Function `send-free-pdf` agora solicita exclusivamente `id, email, nome_completo, pdf_base64`.
- **Fim da regravação de PDF em download:** No endpoint `/api/download-pdf`, o bloco de geração do PDF agora só é disparado se `isPdfMissing` for verdadeiro. Se a linha já possuir o PDF gerado anteriormente, o buffer existente é servido imediatamente sem emitir nenhum `UPDATE` no PostgreSQL.

---

### Fase 2: Migração para Supabase Storage (Requer Aprovação)
1. **Infraestrutura:** Criação de bucket privado `free-pdfs` no Supabase Storage (sem acesso anônimo público; acesso exclusivo via `service_role`).
2. **Coluna Aditiva:** Migration aditiva com GRANT explícito (padrão DEV-210):
   ```sql
   ALTER TABLE public.free_analyses_leads ADD COLUMN IF NOT EXISTS pdf_path text;
   GRANT SELECT, INSERT, UPDATE ON public.free_analyses_leads TO service_role;
   ```
3. **Escrita Dupla / Storage-First:**
   - Em novos cadastros (`teste-bloqueio.ts`), o arquivo é gravado no storage em `free-pdfs/<lead_id>.pdf` e a referência salva em `pdf_path`.
   - Na leitura (`download-pdf.ts` e `send-free-pdf`), lê-se do Storage se `pdf_path` existir; caso contrário, utiliza-se `pdf_base64` (retrocompatibilidade transparente).
4. **Script de Migração em Lotes:**
   - `scripts/migrate-free-pdfs-to-storage.ts` que executa em modo `--dry-run` por padrão e realiza upload em lotes de 20 com checagem de integridade SHA/tamanho antes de registrar o `pdf_path`.

---

### Fase 3: Desocupação de Disco (Destrutiva / Requer Backup e Janela de Manutenção)
1. Após 7 dias de estabilidade na Fase 2:
   ```sql
   UPDATE public.free_analyses_leads
   SET pdf_base64 = NULL
   WHERE pdf_path IS NOT NULL AND pdf_base64 IS NOT NULL;
   ```
2. Execução de `VACUUM FULL public.free_analyses_leads` em janela de baixa demanda para devolver os ~330 MB ao sistema operacional.
3. Futuro: `ALTER TABLE public.free_analyses_leads DROP COLUMN pdf_base64;`.

---

## 4. Plano de Reversão e Rollback
- **Fase 1:** Reversão do PR de código restaura o comportamento anterior sem impacto no schema do banco.
- **Fase 2:** Se o Storage apresentar instabilidade, o código retorna à leitura de `pdf_base64`. Nenhuma linha ou dado antigo é apagado.
- **Fase 3:** Apenas executada após backup pontual da tabela (`pg_dump -t free_analyses_leads`).
