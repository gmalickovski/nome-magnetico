# DEV-326 — Caminho do bebê no chat do Jev

Base: [DEV-320](dev-320-nome-artistico-motivo.md) (pergunta de motivo), [DEV-321](dev-321-nome-artistico-motor.md) (desenho de módulos separados) e [DEV-324](dev-324-chat-botao-voltar.md) (Voltar). Plano de lançamento no Notion (Growth).

## 1. O que o usuário vê

A primeira pergunta do chat passou a ser **"Para quem ou para quê é esse nome?"**, com a opção nova **"Escolher o nome do meu bebê"**. Quem escolhe segue um caminho só do bebê, sem palpite:

| Passo | Quando aparece | Opções |
| --- | --- | --- |
| `bebe_situacao` | sempre | Ainda não nasceu · Já nasceu, ainda não foi registrado · Já nasceu e já foi registrado |
| `bebe_data_tipo` | ainda não nasceu | Tenho a data marcada · Só tenho a data prevista |
| `bebe_sexo` | não registrado | Menina · Menino · Ainda não sei |
| `bebe_dados` | sempre | **formulário**: data (máscara dd/mm/aaaa), sobrenomes, até 5 nomes que os pais já pensaram (opcional). Para o bebê registrado: data e nome completo |
| `bebe_estilo` | não registrado | Clássico, Moderno, Curto, Bíblico, Internacional, Tanto faz (até 2) |

Quem já nasceu vê um **aviso só informativo** (cartório e advogado), **sem prazos em número**: os prazos legais só entram depois de confirmados com advogado.

### Resultado (seções no chat)

| Seção | Conteúdo |
| --- | --- |
| Os nomes que vocês pensaram | a leitura de cada nome dos pais, **mesmo quando não passa nas regras**, com a explicação ("pede atenção") |
| Sugestões para menina / menino | até 4 (menina ou menino escolhido) ou 3 de cada (ainda não sei) |
| Nomes neutros | até 2 |

Cada cartão mostra "Bom em X dos Y dias possíveis para o nascimento" quando a data é prevista. "Gerar outras opções" traz mais, sem repetir. O bebê registrado vê só a leitura do nome já escolhido. Não há botão de PDF no caminho do bebê (DEV-322).

## 2. Motor (`products/nome-bebe-chat/`)

Separado do Nome Social, do artístico e do `nome-bebe.ts` antigo. Só compartilha o avaliador neutro (`products/shared/avaliar-candidato.ts`).

- **Janela de datas** (`janela.ts`): com data prevista, cada nome é calculado em todos os dias de 14 antes até 14 depois (29 dias; máximo de 21 para cada lado). Data inválida (31/02) é rejeitada.
- **Banco de nomes** (`pool.ts`): menina, menino e neutros, com etiquetas de estilo. "Ainda não sei" mistura os três grupos.
- **Ordem dos sobrenomes** (`index.ts`): testa as permutações (até 3 sobrenomes) e usa a melhor.
- **Regras das sugestões**: zero bloqueio nos 4 triângulos, sem tensão vibracional com o Destino e nota mínima de 70, e **bom em pelo menos metade dos dias** da janela. Ganha quem fica bom em mais dias; depois a média da nota e a aderência ao estilo.
- **Nomes dos pais**: analisados sempre, com a etiqueta própria, sem repetir nas sugestões. Texto inválido (números, símbolos) é ignorado e avisado.
- **Sobrenome que bloqueia tudo**: se todos os nomes testados formam bloqueio por causa do sobrenome, o motor devolve `motivoSemSugestoes: sobrenomes_bloqueiam` e o chat explica, em vez de uma lista vazia sem explicação.

Sem IA e sem banco: só cálculo, determinístico.

## 3. Onde está o código

| Arquivo | Papel |
| --- | --- |
| `shared/interactive-engine/ramos/bebe.ts` | opções, rótulos, máscara e validações do formulário, avisos, títulos das seções |
| `shared/interactive-engine/questionnaire-adaptive.ts`, `router.ts` | passos novos, regras de pular e o bebê sem palpite (só importam do `ramos/bebe.ts`) |
| `backend/numerology/products/nome-bebe-chat/` | motor (`index.ts`, `janela.ts`, `pool.ts`) e testes |
| `pages/api/baby-names.ts` | endpoint (Zod, limite por visitante em memória, sem log de nomes) |
| `chat/baby-suggestions-client.ts`, `chat/BabyDataForm.tsx` | cliente e formulário do chat |
| `chat/SuggestionPicker.tsx` | seções do bebê |

Mexer no bebê não exige mexer no Nome Social nem no artístico.

## 4. Privacidade e contrato

- `POST /api/decide-live` recebe só o que o roteador precisa (`bebe_situacao`, `bebe_data_tipo`, `bebe_sexo`, `bebe_dados_ok`, `bebe_estilos`). **Nomes, sobrenomes e data do bebê não vão para o `decide-live`**; vão só para `/api/baby-names`, que não grava nem registra em log.
- A resposta do usuário no chat mostra a data, os sobrenomes e só a **quantidade** de nomes em mente.
- `/api/baby-names`: 40 chamadas por 10 minutos por visitante (hash em memória, sem IP em claro).

## 5. Limitações conhecidas

- A escolha "Para quem é esse nome?" vem **depois** da confirmação dos dados de certidão do usuário (que o chat sempre mostra primeiro), não antes. Mover antes exige reabrir o onboarding do chat. Para o bebê, esses dados do usuário não são usados.
- O painel lateral do nome de nascimento do usuário fica escondido no caminho do bebê até um nome ser selecionado.
- Não há PDF do bebê (DEV-322) e o perfil do bebê não é salvo na análise.
- A opção "Nome artístico" na primeira pergunta continua a mesma pergunta de motivo da DEV-320 (não foi separada).
- O Jev não pré-seleciona o caminho a partir do texto livre.

## 6. Liga e desliga

Mesmo interruptor da DEV-320: `NM_CHAT_MOTIVO_ARTISTICO=false` desliga a pergunta de motivo e, com ela, o caminho do bebê.

## 7. Rollback

Sem migration. Reverter o PR remove o caminho do bebê.
