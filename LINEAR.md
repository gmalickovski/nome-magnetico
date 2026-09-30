# LINEAR.md

Regras de execução no Linear para o Nome Magnético. Linear guarda o próximo passo; o detalhe de arquitetura fica em `docs/`.

## Bot Suporte — FAQ read-only

O bot Suporte de cada SaaS lê só a FAQ ativa. O resto do banco fica negado: clientes, pagamentos, leads, auth e HQ.

Modelo deste repositório, para repetir em Simulaweb, Vibraweb e SaaS novos (a FAQ desses produtos não é criada aqui):

- View `support_faq.support_faq_v`: categorias e itens com `is_active = true`. Sem `faq_embeddings`.
- Role `support_bot`: `NOLOGIN`, `NOINHERIT`, `SELECT` só nessa view. Sem `GRANT` em outras tabelas.
- A migration não cria senha, JWT nem mexe na service role.
- Aplicar em `nome_magnetico` e criar a credencial só depois do ok do Guilherme.

Detalhe, grants e checklist de aceite: `docs/architecture/support-bot-faq-readonly.md`.
