# DEV-266 · Export PDF e ranking só do chat

## Contrato

- O histórico cumulativo de sugestões exibidas no chat vive no **cliente** (`localStorage` / estado da sessão, versão `CHAT_SESSION_STORAGE_VERSION`). Não há tabela de “sugestões vistas” no Supabase neste PR.
- `mergeChatSuggestionsCumulative` no chat: rodadas “+3” **acumulam** (dedupe por nome), não substituem a lista anterior.
- Reabertura local: sessão com `analysisId` continua restaurando mensagens, sugestões e seleção; se a lista exportada mudar, `analysisId` é invalidado e o próximo PDF dispara novo `/api/analyze` (fingerprint em `buildChatPdfEnsureKey`).
- No export PDF, `buildChatPdfAnalyzePayload` envia:
  - `nomes_candidatos`: ordem cumulativa, sem duplicatas (`chatSuggestionsToExportNames`);
  - `ranking_somente_chat: true` sempre no fluxo chat;
  - `ranking_vazio_sem_autogeracao: true` quando não há histórico — backend não chama autogeração de candidatos.
- `/api/analyze` repassa `somenteCandidatosInformados` para `analisarNomesSocial`, **sem** `gerarSugestoesAutoSocial`.
- `frequencias_numeros.rankingSomenteChat` persiste na análise para o template PDF respeitar ordem e quantidade no ranking.

## Sumário PDF (runtime)

- `renderProductPdfBuffer` usa **pdfjs-dist** no Node para inspecionar destinos; fallback opcional `python3` + `pypdf` (CI/dev).
- `renderFreeLeadPdfBase64` (`/api/teste-bloqueio`, leads gratuitos) usa o mesmo two-pass e números no sumário.

## O que não faz

- Não reconstrói histórico se o usuário limpar storage ou trocar dispositivo (sem persistência server-side).
- Não altera migrations nem schema de produção.

## Aprovação adicional

Persistir sugestões do chat no servidor (reabertura cross-device) exigiria **migration + política LGPD** — fora deste PR; pedir issue/aprovação humana antes.
