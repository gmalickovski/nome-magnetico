# LINEAR.md

Regras de execução no Linear para o Nome Magnético. Linear guarda o próximo passo; o detalhe de arquitetura fica em `docs/`.

## Playbooks Studio MLK <!-- pragma: allowlist secret -->

Um time Linear: **Desenvolvimento** (`DEV-*`). FE/BE = labels `area:frontend` / `area:backend`, sem times separados.

- UI/layout/mobile/fold/tipografia/SVG/containers: [Playbook Frontend](https://linear.app/studio-mlk/document/playbook-frontend-layout-tipografia-mobilefold-4ad2081fba87). <!-- pragma: allowlist secret -->
- API/auth/DB/migrations/LGPD/segurança: [Playbook Backend](https://linear.app/studio-mlk/document/playbook-backend-seguranca-api-lgpd-400dc095d4f4). <!-- pragma: allowlist secret -->
- Guia Linear: https://linear.app/studio-mlk/document/guia-linear-regras-e-suporte-b9d5bfb39654 <!-- pragma: allowlist secret -->

## Bot Suporte — FAQ read-only

O bot Suporte de cada SaaS lê a FAQ ativa e consulta o status mínimo de um contato por e-mail. O resto do banco fica negado: conteúdo de análise, pagamentos detalhados, leads além da presença, auth e HQ.

Modelo deste repositório, para repetir em Simulaweb, Vibraweb e SaaS novos (a FAQ desses produtos não é criada aqui):

- View `support_faq.support_faq_v`: categorias e itens com `is_active = true`. Sem `faq_embeddings`.
- Função `support_faq.support_lookup_contact(email)`: uma linha com `is_registered`, `is_subscriber`, `is_lead_only` e os campos mínimos (perfil, produtos e `ends_at`, ou datas/status de lead). Sem ids Stripe/Asaas, valores, metadata, PDF ou texto de análise.
- Role `support_bot`: `NOLOGIN`, `NOINHERIT`. `SELECT` só na view e `EXECUTE` só na função. Sem `GRANT` em `profiles`, `subscriptions`, `analise_leads`, `free_analyses_leads` ou qualquer outra tabela.
- A migration não cria senha nem mexe na service role. Guilherme autorizou o apply em `nome_magnetico` depois do PR alinhado; a senha continua fora do git.

Detalhe, grants e checklist de aceite: `docs/architecture/support-bot-faq-readonly.md`.
