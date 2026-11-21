# DEV-324 — Botão "Voltar" no chat do Jev

Base: lógica de passo anterior da [DEV-303](dev-303-questionario-adaptativo-jev.md) e ramo artístico da [DEV-320](dev-320-nome-artistico-motivo.md).

## 1. Comportamento

- **Voltar** desfaz **uma** pergunta de cada vez, sem recomeçar a entrevista. **Recomeçar** (dock) continua como estava e zera tudo. Os dois convivem.
- O botão é um **círculo só com ícone** (seta para a esquerda), **primeiro item da linha de opções**, na mesma linha das pills de resposta. Aparece a partir da 2ª pergunta (o primeiro passo não tem como voltar).
- Onde aparece:
  - perguntas do questionário (única e múltipla escolha);
  - o palpite ("Será que é isso?"), ao lado de "Na mosca", "Em parte" e "Não é bem isso";
  - as sugestões (rótulo "Voltar ao palpite"), antes do "Gerar outras opções";
  - o campo de texto de "Outro" (volta às opções, sem mudar de pergunta).
- Ao voltar:
  1. o chat é cortado até a pergunta de destino, que volta a ser a pendente (as respostas e os avisos seguintes saem);
  2. o estado da coleta é restaurado com `rewindCollectStateToStep` (apaga o destino e tudo depois);
  3. as opções são reapresentadas **sem chamar a API** (zero custo);
  4. o contador de passos devolve as respostas desfeitas; as transições de bloco já exibidas são recalculadas;
  5. se vinha das sugestões, as sugestões, a análise salva e o aviso são limpos.
- Não volta quando: carregando, gerando novas opções, testando nome manual, paywall gratuito aberto, ou o palpite já virou campo de texto ("Em parte" e "Não é bem isso").
- Respeita o fluxo ligado ou desligado (`NM_CHAT_MOTIVO_ARTISTICO`): com o fluxo desligado a primeira pergunta é `nome_uso` e ela não tem Voltar.

## 2. Acessibilidade e visual

- `aria-label` e `title` ("Voltar à pergunta anterior", "Voltar ao palpite", "Voltar às opções"), área de toque de 44 px, foco visível e ícone `aria-hidden`.
- Visual "fantasma", sem borda (regra NO-LINE): fundo `#131313` e ícone dourado, para não parecer mais uma resposta. Hover com dourado a 15%.
- Fica fora do `role="group"` das opções, para o leitor de tela não ler como uma resposta.
- Testado em 375 px: o círculo ocupa o primeiro lugar da linha sem quebrar as pills.

## 3. Onde está o código

| Arquivo | Papel |
| --- | --- |
| `chat/chat-dock-step-back.ts` | `getPreviousFlowStep`, `rewindCollectStateToStep` e `planBackNavigation` (puro e testado) |
| `chat/ChatBackButton.tsx` | o círculo |
| `chat/ChatAdaptivePills.tsx`, `GuessButtons.tsx`, `SuggestionPicker.tsx` | recebem `onBack` e mostram o círculo |
| `chat/NomeSocialChat.tsx` | `previousStepFor` e `handleGoBack` (liga o estado do React) |
| `chat/chat-back-navigation.test.ts` | testes do plano e do destino |

Evento no PostHog: `chat_step_back` com `from` e `to` (nenhum dado pessoal).

## 4. Fora desta entrega

- Voltar a partir do palpite já virado em campo de texto.
- Atalho de teclado para voltar.
- Item "Voltar" na dock móvel (o círculo nas perguntas já resolve o celular).

## 5. Rollback

Sem migration. Reverter o PR remove o botão e mantém o "Recomeçar".
