# DEV-266 · Entrega Growth 05/11/2026 (18h34)

## Plano (curto)

1. **Layout PDF** — gratuito sem páginas `#131313`; mapa + próximo passo fundidos; score sem aviso duplicado (só `PDFFooter`); CTA final em fundo claro.
2. **Sumário** — hierárquico (nível/recuo/número de página); render **two-pass** (`pdfDynamicRender.ts`); destinos incl. `pdf-harmonizacao-comparativa`.
3. **Ranking chat** — payload + flag `ranking_somente_chat`; PDF mostra só nomes exportados, ordem preservada.
4. **Validação** — `npm test` (suíte DEV-266 offline), `npm run pdf:dev266-fixtures`, capturas `pdftoppm` em artefatos.

## Testes

| Ambiente | Comando | Notas |
|----------|---------|--------|
| Local | `npm test` | Baseline conhecido: `motor.test.ts`, `test-checkout-success.test.ts` podem falhar sem env Stripe. |
| CI | workflow `ci.yml` step PDF offline | 472+ pass; motor 1 fail baseline documentado. |
| Offline PDF | `npm run pdf:dev266-fixtures` | Requer Poppler + pypdf (mesmo harness DEV-266). |

## Rollback

Reverter merge do PR #124 e redeploy tag anterior em produção (ação humana).

## SHA

Preencher com `git rev-parse HEAD` após push desta rodada (ver `manifest.json` gerado).
