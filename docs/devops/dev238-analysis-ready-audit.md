# DEV-238 — Auditoria do e-mail de análise pronta

Data: 2026-11-08. Workflow 6RcWDhG0S3EzFzik, versão publicada c2d7d529-4da9-494d-9a47-80356e04bd38, ativo, 27 nós.

O ramo user.analysis_complete já existe, incluindo verificação de e-mail e envio SMTP. Não criar ramo duplicado. O botão usa /app/analise/nome-social; a aplicação já envia payload.analysisUrl com /app/resultado/{UUID}.

Proposta em docs/snippets/dev238-analysis-ready-proposed.html: substituir somente um href por expressão que aceita exclusivamente HTTPS, host www.nomemagnetico.com.br, rota /app/resultado/ e UUID. Ausência ou valor inválido usa o link genérico atual. HTML restante preservado; destinatários, credenciais, conexões e publicação não alterados.

Sete casos sintéticos passaram: URL válida, ausente, domínio externo, UUID inválido, query string, HTTP e injeção HTML. Nenhum workflow executado ou e-mail enviado. Configuração do nó validada separadamente; não representa validação de entrega SMTP.

Aplicação pendente: MCP retorna Workflow is not available in MCP. Habilitar acesso no workflow alvo: https://n8n.studiomlk.com.br/workflow/6RcWDhG0S3EzFzik?settings=true. Antes de aplicar, reler versão e conferir ausência de alterações concorrentes. Backup publicado privado no container; rollback deve restaurar apenas o href anterior. Proposta não publicada e issue não concluída.
