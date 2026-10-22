# AGENTS.md

Orientação unificada para qualquer agente IA (Jules, Cursor, Antigravity) neste repositório. O `CLAUDE.md`, `CODEX.md`, `GEMINI.md` e `LINEAR.md` originais apontam para cá.

## Arquitetura e Negócio

* **Backend:** `src/backend/` tem IA, Supabase, numerologia. O Frontend NUNCA importa do backend; fala por `/api/*` e sempre valida inputs via Zod. O Supabase service key é só server-side.
* **Frontend:** Seguir `DESIGN.md`. Astro 5, React, Tailwind (sem custom css para layout básico), no-line design (use spacing/shadows em vez de borders 1px).
* **Numerologia:** 4 triângulos sempre (Vida, Pessoal, Social, Destino), bloqueios (sequências repetidas >=3) com códigos em `triangle.ts`, lições kármicas. ZERO referências à radiestesia ou pêndulo - apenas critérios formais e objetivos.
* **Pagamentos:** Checkout hospedado via Stripe (`STRIPE_SECRET_KEY` no env). O bot Suporte só vê read-only e não acessa PDFs ou logs financeiros.
* Documentação técnica (arquitetura, configs, snippets) fica sempre dentro de `/docs`. Se não achar algo aqui, procure em `docs/`.

## Stack e Comandos

* Stack: Astro 5 SSR, React islands, Tailwind CSS, Supabase Cloud, Stripe.
* `npm ci`
* `npm run dev`
* `npm run build`
* `npx astro check`

## Regras e Fluxo de Trabalho (Obrigatório)

* **Frontend/Segurança:** Sem mutação de DB no front, sem segredos no código. Sem migrations sem pedido explícito.
* **Design:** Não mude design nem animações da landing, apenas texto.
* **Branching e PRs:** PR **sempre** em draft e feito a partir de uma branch `dev-###...` Nunca merge nem tags de deploy manual.
* Título PR: `DEV-### ...`
* Rode o build antes de commitar para garantir que o código continua funcional.

---

## Template de issue (copiar para toda issue nova)

```markdown
## Objetivo (1 frase)
## Repo, branch e arquivos prováveis
## Critério de aceite (checklist)
## Como testar (comando)
## Não pode mudar
## Risco: produção | banco | pagamentos | auth | nenhum
```

Labels: um `agent:` (cursor/jules/antigravity) + um `tier:`. Risco diferente de nenhum = `agent:cursor`. O Jules é disparado só pelo Guilherme.
