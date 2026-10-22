# AGENTS.md

Orientação unificada para qualquer agente IA (Jules, Cursor, Antigravity) neste repositório, substituindo os antigos arquivos específicos.

## Playbooks Studio MLK

* FE/BE = labels `area:frontend` / `area:backend` — não criar times separados.
* Antes de mudar UI/layout/mobile/fold/tipografia/SVG/containers: seguir o [Playbook Frontend](https://linear.app/studio-mlk/document/playbook-frontend-layout-tipografia-mobilefold-4ad2081fba87).
* Antes de mudar API/auth/DB/migrations/LGPD/segurança: seguir o [Playbook Backend](https://linear.app/studio-mlk/document/playbook-backend-seguranca-api-lgpd-400dc095d4f4).
* Guia Linear: https://linear.app/studio-mlk/document/guia-linear-regras-e-suporte-b9d5bfb39654

## Stack e Comandos

* Stack: Astro 5 SSR, React islands, Tailwind CSS, Supabase Cloud, Stripe.
* `npm ci`
* `npm run dev`
* `npm test`
* `npm run build`

## Regras

* **Frontend:** Sem mutação de banco no front.
* **Segurança:** Sem segredos no código.
* **Banco:** Sem migrations sem pedido explícito.
* **Design:** Não mudar design nem animações da landing (só texto/copy).

## Fluxo de Trabalho

* **PR em draft**.
* **Título:** `DEV-### ...`
* **NUNCA** merge.
* **NUNCA** tag.

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
