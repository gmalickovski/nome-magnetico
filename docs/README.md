# Documentação do Sistema - Nome Magnético

Esta pasta é o repositório centralizado de todo o conhecimento técnico e operacional do SaaS Nome Magnético. Ela é estruturada para que qualquer engenheiro, agente de IA ou membro da equipe consiga rapidamente entender o contexto, replicar o sistema, operar em produção e reutilizar código.

## 📂 Estrutura de Diretórios

- `architecture/` - Documentações robustas sobre como as diferentes engrenagens do projeto se encaixam (ex: integração de suporte, regras de negócio numerológicas, arquitetura do Supabase). Painel operacional: [`architecture/admin-ops.md`](architecture/admin-ops.md).
- `business/` - Visão macro do produto, roadmap estratégico, pitches, apresentações e contexto comercial (ex: pitch para investidores).
- `sops/` - *Standard Operating Procedures* (Procedimentos Operacionais Padrão). Guias passo-a-passo detalhados para executar tarefas repetitivas ou complexas sem depender de intuição.
- `snippets/` - Trechos de código fundamentais e repetitivos (Componentes React, padrões Astro, hooks) isolados e testados para acelerar o desenvolvimento de novas features e páginas.
- `devops/` - Comandos vitais, guias de deploy, rollback, CI/CD, monitoramento e configuração de servidores (PM2, Nginx). Host admin: [`devops/admin-host-nginx.md`](devops/admin-host-nginx.md).

> **Atenção aos agentes IA:** Esta estrutura é obrigatória. Nunca deixe arquivos `.md` soltos na raiz da pasta `docs/`. Sempre categorize de acordo com a taxonomia acima. Se estiver documentando uma integração complexa, use `architecture/`. Se for um guia de como realizar algo passo-a-passo, use `sops/`.
