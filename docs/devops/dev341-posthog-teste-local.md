# DEV-341 · Testar a origem no PostHog

## Configuração local

Use o Supabase, a Stripe e o PostHog de teste. Carregue as credenciais pelo cofre `Studio MLK - TESTE`. Defina a origem exata em que o navegador vai abrir o app, inclusive a porta.

```powershell
$env:APP_URL = 'http://localhost:4321'
npm run dev:1p
```

O formulário da análise grátis usa `APP_URL` como origem permitida por padrão. Se o ambiente já tiver `FREE_ANALYSIS_ALLOWED_ORIGINS`, a lista explícita prevalece e precisa incluir a origem local. Use valores separados por vírgula se precisar testar em mais de uma origem.

```powershell
$env:FREE_ANALYSIS_ALLOWED_ORIGINS = 'http://localhost:4321,http://127.0.0.1:4321'
```

`FREE_ANALYSIS_ALLOWED_ORIGINS` só libera o formulário. Para o checkout completo, mantenha `APP_URL` configurado também. O app usa essa variável para montar os URLs de sucesso e cancelamento da Stripe e, na ausência dela, usa o domínio público.

## Roteiro

1. Abra uma sessão nova do navegador, aceite os cookies de analytics e entre por `/analise-gratuita?utm_source=qa_dev341&utm_medium=teste&utm_campaign=origem`.
2. Envie a análise com dados fictícios. Abra o CTA do modal e confira `from=modal_resultado_gratis` no destino e o evento `upsell_modal_click`.
3. Faça login, abra o checkout e clique uma vez para pagar no modo teste. No PostHog, confira uma ocorrência de `checkout_redirect_start` para esse clique. Se uma tentativa falhar, um novo clique pode emitir outro evento.
4. Confirme que a análise, o checkout e o `purchase` aparecem na mesma pessoa. Confira `initial_utm_source=qa_dev341` ou `$initial_utm_source=qa_dev341` no perfil, conforme a versão do emissor. A origem da campanha deve continuar sendo a da entrada.

O PR da DEV-341 corrige os links e a duplicação. Para repetir a validação da identidade e da sessão de ponta a ponta, use também a base da DEV-289, que foi a base do teste que abriu esta issue. [DEV-289](https://linear.app/studio-mlk/issue/DEV-289/posthog-identificar-a-analise-gratis-e-incluir-product-type-no-analise) · [DEV-341](https://linear.app/studio-mlk/issue/DEV-341/posthog-tirar-utms-internas-do-modal-da-analise-gratis-e-evitar)
