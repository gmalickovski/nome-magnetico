# DEV-266 · Export PDF e ranking só do chat

## Contrato

- O histórico cumulativo de sugestões exibidas no chat vive no **cliente** (`localStorage` / estado da sessão). Não há tabela de “sugestões vistas” no Supabase neste PR.
- No export PDF, `buildChatPdfAnalyzePayload` envia:
  - `nomes_candidatos`: ordem cumulativa, sem duplicatas (`chatSuggestionsToExportNames`);
  - `ranking_somente_chat: true` quando há pelo menos um nome.
- `/api/analyze` repassa `somenteCandidatosInformados` para `analisarNomesSocial`, **sem** `gerarSugestoesAutoSocial`.
- `frequencias_numeros.rankingSomenteChat` persiste na análise para o template PDF respeitar ordem e quantidade no ranking.

## O que não faz

- Não reconstrói histórico de sessões antigas se o usuário limpar storage ou trocar dispositivo.
- Não altera migrations nem schema de produção.

## Aprovação adicional

Persistir sugestões do chat no servidor (reabertura cross-device) exigiria **migration + política LGPD** — fora deste PR; pedir issue/aprovação humana antes.
