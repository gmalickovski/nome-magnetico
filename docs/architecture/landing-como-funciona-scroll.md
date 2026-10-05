# Seção "Como funciona" — Pinned Scroll & 4 Passos

Documentação da arquitetura de animação e conteúdo da seção "Como funciona" da Landing Page do Nome Magnético ([DEV-109](https://linear.app/studio-mlk/issue/DEV-109/landing-como-funciona-em-4-passos-com-scroll-fixado-e-animacao-de)).

## 1. Conteúdo e Propósito

Apresenta os 4 passos reais do fluxo da análise de Nome Social de forma objetiva, self-service e sem termos proibidos (sem menção a pêndulo, radiestesia, entrega manual ou "incompatível"):

1. **Passo 01 — Preencha seus dados**: Nome de nascimento, data e objetivos pessoais no formulário inicial.
2. **Passo 02 — Gere a análise**: O algoritmo cabalístico cruza os 4 triângulos e avalia bloqueios.
3. **Passo 03 — Escolha seu nome**: Nome indicado no ranking e alternativas com score harmônico.
4. **Passo 04 — Baixe o relatório**: PDF instantâneo com mapa completo e guia de ativação da assinatura.

## 2. Padrão de Animação (Pinned / Sticky Scroll)

Inspirado nas melhores práticas de interfaces de produtos de ponta (Linear, Stripe, Apple):

- **Zero dependência externa**: 100% implementado em React + CSS transform acelerado por GPU (`will-change: transform`).
- **Hook `useScrollProgress`**:
  - Monitora o deslocamento do container wrapper (`h-[340vh]` no desktop).
  - Executa medições via `getBoundingClientRect()` amortecidas por `requestAnimationFrame` e listener de scroll passivo.
  - Retorna `progress` normalizado entre `0.0` e `1.0`.
- **Efeito de agrupamento e deslocamento lateral**:
  - **Início ($p \le 0.15$)**: Card 1 surge centralizado na tela (offset do trilho em $+37.5\%$).
  - **Fase 2 ($p \in [0.15, 0.40]$)**: Card 2 surge; o trilho desliza suavemente para a esquerda ($+25.0\%$); a Seta 1→2 acende e ganha destaque.
  - **Fase 3 ($p \in [0.40, 0.65]$)**: Card 3 surge; o trilho desliza para $+12.5\%$; a Seta 2→3 acende.
  - **Fase 4 ($p \in [0.65, 0.88]$)**: Card 4 surge; o trilho alinha em $0.0\%$; a Seta 3→4 acende.
  - **Fixação final ($p \in [0.88, 1.00]$)**: Os 4 cards repousam perfeitamente alinhados e centralizados antes da transição suave para a próxima seção.

## 3. Responsividade e Acessibilidade

- **Mobile e Tablet (< 1024px)**:
  - Mantém o scroll natural nativo (sem aprisionamento de 340vh) para garantir ergonomia do toque e prevenir scroll locks em telas pequenas.
  - Exibe os 4 cards empilhados verticalmente com setas para baixo.
- **`prefers-reduced-motion`**:
  - Detectado automaticamente pelo hook.
  - Desativa o sticky container e renderiza a grade estática completa dos 4 cards.
- **Leitores de Tela (A11y)**:
  - Estrutura semântica mantida com `<ol>` e `<article>`, permitindo leitura linear e indexação para SEO.
