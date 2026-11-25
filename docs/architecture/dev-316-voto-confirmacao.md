# DEV-316 — Confirmar o voto do próximo produto em caixa acessível

Base: votação sem cadastro e sem dados pessoais da DEV-190. O endpoint `/api/product-vote`, as contagens agregadas e as opções **não mudaram**.

## 1. Comportamento (landing, resultado e obrigado)

1. Escolher uma opção **só abre a confirmação**. Nenhuma requisição e nenhum evento até confirmar.
2. A caixa diz qual opção foi escolhida ("Votar em Nome do Bebê?").
3. **Cancelar, clicar fora ou Escape** fecham sem enviar nada e devolvem o foco ao cartão de origem.
4. **Confirmar** faz **uma** requisição. O botão fica desabilitado e a caixa não fecha durante o envio. Clique duplo ou triplo vira um único envio (trava em `useRef` antes do re-render).
5. O sucesso só aparece depois da resposta de sucesso da API, e o evento `product_vote_submitted` só sai nesse momento (o PostHog continua dependendo do consentimento de cookies).
6. Texto da introdução: "Escolha uma opção e confirme seu voto. Não precisa de cadastro."

O visual e as animações das seções existentes foram preservados; só a caixa é nova.

## 2. Erros

| Situação | O que o usuário vê | Por quê |
| --- | --- | --- |
| A API respondeu com erro (400, 429, 500) | mensagem da API ou genérica, botão "Tentar de novo" | o incremento é uma única operação atômica; erro significa que o voto não foi somado |
| Resposta perdida (rede, tempo esgotado) | "Não conseguimos confirmar se o seu voto foi registrado… Se tentar de novo, o voto pode ser contado mais de uma vez." | resultado desconhecido: sem chave de idempotência no servidor, **não prometemos retry seguro** |

Sem retry automático.

## 3. Acessibilidade

`role="dialog"`, `aria-modal`, `aria-labelledby` e `aria-describedby`; foco inicial em "Confirmar voto"; Tab e Shift+Tab em ciclo dentro da caixa; foco devolvido ao botão de origem; botões de 44 px; foco visível; rolagem do `body` travada enquanto aberta. A caixa é renderizada no `body` (portal) para não herdar transformações das animações de revelação da seção.

## 4. Código

| Arquivo | Papel |
| --- | --- |
| `landing/product-vote-flow.ts` | `submitVote`, classificação de falhas e textos (puro e testado) |
| `landing/VoteConfirmDialog.tsx` | a caixa acessível |
| `landing/ProductVotingSection.tsx` | estado, confirmação e as duas variações visuais |
| `landing/product-vote-flow.test.ts` | testes do fluxo |

## 5. Decisão pendente: idempotência no servidor

A issue pede uma operação idempotente no backend para o caso de resposta perdida (uma repetição da mesma tentativa não pode gerar segundo incremento). Isso exige **guardar uma chave aleatória por tentativa**, o que conflita com a regra histórica de armazenar **só contadores agregados**. Não foi implementado: precisa da decisão do Guilherme sobre o trade-off (ciclo de vida e retenção mínima da chave, sem vínculo com pessoa ou dispositivo). Até lá o resultado desconhecido é tratado como acima.

## 6. Testes

- Automáticos: `product-vote-flow.test.ts` (sucesso, erro da API, rede, falha do analytics, 429) e o teste do endpoint da DEV-190, que seguiu verde.
- Navegador (landing, `fetch` do voto interceptado, **nenhum voto gravado**): cancelar, clicar fora e Escape sem requisição nem evento; foco; Tab em ciclo; erro da API; falha de rede; sucesso com triplo clique (uma requisição, um evento); 375 px sem rolagem horizontal.
- Não testado: resultado e obrigado no navegador (exigem login e pagamento), leitor de tela de verdade.

## 7. Rollback

Sem migration. Reverter o PR volta ao voto em um clique.
