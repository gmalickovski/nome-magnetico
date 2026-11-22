# DEV-326 — Caminho do bebê no chat do Jev

Base: [DEV-320](dev-320-nome-artistico-motivo.md) (pergunta de motivo), [DEV-321](dev-321-nome-artistico-motor.md) (desenho de módulos separados) e [DEV-324](dev-324-chat-botao-voltar.md) (Voltar). Plano de lançamento no Notion (Growth).

## 1. O que o usuário vê

### Primeira pergunta: o caminho (antes de qualquer confirmação de nome)

A **primeira mensagem do chat** é "O que você quer fazer hoje?", com três caminhos. Nada de nome é pedido antes. Só para assinantes e com o fluxo ligado (o fluxo gratuito continua começando pela certidão).

| Caminho | O que pede em seguida |
| --- | --- |
| **Harmonizar o meu nome** (o caminho que já existia) | a confirmação da certidão do usuário e o questionário de sempre |
| **Criar um nome artístico** | a certidão do usuário e o ramo artístico (DEV-320 e DEV-321) |
| **Escolher o nome do meu bebê** | **o nome de nascimento da mãe e do pai** (basta um, para mães e pais solos). A certidão do usuário **não** é pedida |

Os rótulos evitam a palavra "assinatura" (DEV-325). A pergunta de motivo da DEV-320 foi **absorvida**: a escolha do caminho é o motivo, e o questionário não repete a pergunta. Os motivos antigos "carreira" e "novo ciclo" não mudavam nada no motor e deixaram de ser oferecidos.

### Caminho do bebê (sem palpite, roda inteiro no navegador)

| Passo | Quando aparece | Opções |
| --- | --- | --- |
| `bebe_pais` | sempre | **formulário**: nome completo de nascimento da mãe e do pai, pelo menos um. Só aceita nome e sobrenome, só letras |
| `bebe_situacao` | sempre | Ainda não nasceu · Já nasceu, ainda não foi registrado · Já nasceu e já foi registrado |
| `bebe_data_tipo` | ainda não nasceu | Tenho a data marcada · Só tenho a data prevista |
| `bebe_sexo` | não registrado | Menina · Menino · Ainda não sei |
| `bebe_dados` | sempre | **formulário**: data (máscara dd/mm/aaaa), sobrenomes (**já sugeridos a partir da mãe e do pai: o último sobrenome de cada**, editáveis) e até 5 nomes que os pais já pensaram (opcional). Para o bebê registrado: data e nome completo |
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
- **Ordem dos sobrenomes** (`index.ts`): testa as permutações (até 3 sobrenomes) e usa a melhor. **Atenção:** o motor pode inverter a ordem que a pessoa digitou (ex.: "Lima, Silva" vira "Silva Lima") quando a outra ordem forma menos bloqueios.
- **Estilo é preferência, não filtro**: só desempata nomes de mesma nota, e não elimina os outros (com certos sobrenomes, poucos nomes passam nas regras). O cartão avisa "Fora do estilo escolhido, mas combina com o mapa do bebê".
- **Sexo escolhido sem nenhuma sugestão**: o chat avisa (ex.: "Não encontrei nomes de menina que combinem com o mapa do bebê com esses sobrenomes").
- **Regras das sugestões**: zero bloqueio nos 4 triângulos, sem tensão vibracional com o Destino e **nota mínima de 80** (regra geral de 21/11/2026 para nomes novos), e **bom (nota 80 ou mais, sem bloqueio) em pelo menos metade dos dias** da janela. A ordem é do mais próximo de 100 para baixo; depois a média da janela e a aderência ao estilo. Nomes digitados (dos pais ou já registrado) não são sugestões: o usuário quer saber se há bloqueio, então a regra de zero bloqueio não se aplica a eles. Passam só pelo cálculo padrão, sem IA, igual em todos os caminhos, e mostram o bloqueio quando houver. Motor separado do Nome Social, que não muda.
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
| `backend/env/chat-flags.ts` | `isFluxoMotivoAtivo()`: o servidor lê a flag e passa ao chat pela prop `caminhoInicialAtivo` |
| `chat/BabyParentsForm.tsx` | formulário da mãe e do pai |
| `chat/baby-suggestions-client.ts`, `chat/BabyDataForm.tsx` | cliente e formulário do chat |
| `chat/SuggestionPicker.tsx` | seções do bebê |

Mexer no bebê não exige mexer no Nome Social nem no artístico.

## 4. Privacidade e contrato

- **O caminho do bebê não chama o `/api/decide-live`.** O roteador é código puro compartilhado e roda no navegador (`routeBabyLocally`). Nomes da mãe e do pai, sobrenomes, data e nomes em mente vão **só** para `/api/baby-names`, que não grava nem registra em log.
- No chat, a resposta dos pais aparece só como "Mãe e pai informados" (ou "Só a mãe/o pai"); a dos dados, como data, sobrenomes e a **quantidade** de nomes em mente.
- `/api/baby-names`: 40 chamadas por 10 minutos por visitante (hash em memória, sem IP em claro).

## 5. Limitações conhecidas

- Os nomes da mãe e do pai servem hoje só para **sugerir os sobrenomes** do bebê. A leitura numerológica dos pais (ou a compatibilidade deles com o bebê) não existe ainda.
- O painel lateral do nome do usuário fica escondido enquanto o caminho não foi escolhido e durante todo o caminho do bebê (até um nome ser selecionado). O teste "Teste um nome da sua escolha" não aparece no caminho do bebê (usa o nome de nascimento do usuário).
- Não há PDF do bebê (DEV-322) e o perfil do bebê não é salvo na análise.
- O Jev não escolhe o caminho: a escolha é sempre por toque.

## 6. Liga e desliga

Mesmo interruptor da DEV-320: `NM_CHAT_MOTIVO_ARTISTICO=false` desliga a pergunta de caminho (volta a certidão como primeira mensagem) e, com ela, o nome artístico e o caminho do bebê.

## 7. Rollback

Sem migration. Reverter o PR remove o caminho do bebê.
