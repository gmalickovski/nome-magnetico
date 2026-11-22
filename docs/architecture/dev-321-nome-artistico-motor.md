# DEV-321 — Motor do nome artístico (3 próximos + 3 novos)

Parte 2 da DEV-319. Base: [DEV-320](dev-320-nome-artistico-motivo.md) (perguntas) e DEV-301 (zero bloqueio e nota mínima).

## 1. O que o usuário vê

No ramo artístico, depois do palpite, o chat mostra duas seções dentro de "Sugestões do sistema":

| Tipo de nome escolhido | Seção "Nomes artísticos próximos do seu" | Seção "Nomes totalmente novos" |
| --- | --- | --- |
| Próximo do meu nome | até 3 | nenhuma |
| Totalmente diferente | nenhuma | até 3 |
| As duas coisas | até 3 | até 3 |

"Gerar outras opções" traz mais nomes das mesmas seções, sem repetir os já vistos (respeita o limite de `podePedirGerarMais`).

Todo nome sugerido tem **zero bloqueio nos 4 triângulos**, **sem tensão vibracional** com o Destino e **nota de 70 ou mais** nos nomes próximos do nascimento. Nos **nomes totalmente novos** (que não partem do nome de nascimento) a nota mínima é **80**, listados do mais próximo de 100 para baixo (a afinidade com a área só desempata). Regra geral definida em 21/11/2026. O motor do Nome Social não é afetado: este motor é separado. Cada card explica por que o número favorece a área (sem dígitos no texto).

## 2. Separação dos motores (regra de manutenção)

Cada produto tem a sua pasta e **não importa dos outros**. O que é comum fica em `shared/` e só depende do núcleo numerológico.

```
src/backend/numerology/
  core.ts, numbers.ts, triangle.ts, karmic.ts, harmonization.ts, score.ts   ← núcleo compartilhado
  products/
    nome-social.ts        ← Nome Social (não mudou)
    nome-bebe.ts          ← Bebê (não mudou)
    nome-empresa.ts
    nome-artistico/       ← DEV-321 (novo)
      index.ts            ← orquestra: gerarNomesArtisticos
      proximos.ts         ← apelido, prenome, sobrenome, grafia, acento (reserva)
      novos.ts            ← filtro das ideias da IA e banco determinístico
      afinidade-area.ts   ← tabela número × área e frase explicativa
      nome-artistico.test.ts
    shared/
      avaliar-candidato.ts ← avaliador neutro de nome livre (para artístico e futuro bebê no chat)

src/shared/interactive-engine/
  questionnaire-adaptive.ts, questionnaire-map.ts, chat-profile-copy.ts, router.ts  ← roteiro padrão
  ramos/
    artistico.ts          ← opções, rótulos, aviso, mapeamento e palpite do ramo artístico

src/backend/ai/
  prompts/artistic-prompt.ts        ← prompt das ideias de nome
  config/models.ts, temperatures.ts ← tarefa `artistic_names`
  brain.ts                          ← generateArtisticNameIdeas (LoopGuard)

src/pages/api/artistic-names.ts     ← endpoint do ramo artístico
src/frontend/components/app/chat/
  artistic-suggestions-client.ts    ← fetch, mapeamento e seções (só o ramo artístico)
```

Para um novo caminho (ex.: bebê no chat), seguir o mesmo desenho: `ramos/<caminho>.ts` no front compartilhado, `products/<caminho>/` no backend, um endpoint próprio e um cliente próprio no chat. Mexer em um caminho não deve exigir mexer nos outros.

## 3. Como os nomes são escolhidos

### Próximos (`proximos.ts`)
Do nome de nascimento viram nome de palco: prenome isolado, segundo prenome, sobrenome como nome, prenome + sobrenome, **apelido** (corte em vogal: Larissa → Lari/Lary; Guilherme → Gui) e **grafia artística** (dobrar consoante, y, k, th, w, ph). **Acento novo só entra se as formas naturais não completarem a lista** e nunca em apelido. Respeita sobrenomes excluídos, "manter meu primeiro nome" e "prefiro sem acento".

### Novos (`novos.ts` e IA)
1. A IA (`artistic_names`, pelo LoopGuard, temperatura 0,9) devolve até 12 ideias em JSON. O prompt proíbe nome famoso, partes do nome de nascimento, números e símbolos.
2. `filtrarIdeiasNovas` aceita só letras, até 3 palavras, sem repetir e sem usar nenhuma parte do nome de nascimento.
3. Cada ideia passa pelo mesmo cálculo (`avaliarCandidatoLivre`) e só segue se for ofertável.
4. Se faltar nome, o **banco determinístico** completa (nomes de palco por tom feminino, masculino ou neutro, mais segundas palavras por imagem). Resultado estável: a mesma entrada dá a mesma saída.
5. Não repete a primeira palavra entre os 3 nomes.

### Ordem
`nota + 15 × afinidade + ajuste da técnica` (acento −8, grafia +1, prenome e apelido +4, IA +3). A afinidade (0 a 1) vem da tabela **número de Expressão × área artística** em `afinidade-area.ts`: só desempata e **não entra na fórmula do score** (DEV-260). Editar a tabela muda apenas o artístico.

## 4. Custo, limites e falha da IA

- Chamadas de IA só quando o tipo de nome inclui "novos". Mesmo teto do JEV (`jevBudget`: por visitante, por usuário, por hora e tokens) e mesmo interruptor `NM_JEV_REMOTE_DISABLED=true`.
- Timeout de 25 s. Sem IA, sem chave, acima do teto ou com erro: o banco determinístico responde, **sem travar o chat**. O motivo vai ao log, nunca a mensagem de erro ao cliente.
- Cada resposta da IA grava uma linha em `ai_usage` (`task = 'artistic_names'`).
- Provedor: o mesmo de sempre (Groq por padrão, OpenAI de reserva), editável no admin por tarefa.

## 5. Contrato do endpoint

`POST /api/artistic-names` (público como `/api/decide-live`). Entrada validada com Zod: `nome_completo`, `data_nascimento` (dd/mm/aaaa), `area_artistica`, `detalhe_artistico`, `genero_persona`, `imagem_artistica`, `tipo_nome_artistico`, `sobrenomes_excluidos`, `manter_primeiro_nome`, `sem_acento`, `excluir`. Saída: `proximos[]`, `novos[]`, `semProximos`, `semNovos`, `providerUsed` (`ia` ou `banco`). Cada item traz os 5 números, compatibilidade, bloqueios (vazio), nota, `explicacaoPerfil` e `secao`.

## 6. Fora desta entrega

- Verificação de conflito com artistas e marcas (DEV-323).
- Chaves de IA: estão no cofre TESTE (`NM-TESTE-LLM` com `GROQ_API_KEY` e `OPENAI_API_KEY`; `NM-TESTE-JEV` com `TYPESAFE_API_KEY`) e o `.env.1password` já as referencia (`npm run env:1p`). Com elas, a chamada real a `/api/artistic-names` devolveu `providerUsed: ia` com 3 nomes novos válidos (1,6 s); sem elas, o banco determinístico responde.
- Caminho do bebê no chat (usará `products/shared/avaliar-candidato.ts`).
- PDF do caminho artístico (DEV-322).
- Chat do artístico só tem 2 a 3 próximos quando o nome de nascimento é curto ou tem sobrenomes excluídos.

## 7. Rollback

Sem migration. `NM_CHAT_MOTIVO_ARTISTICO=false` desliga o ramo (volta ao roteiro e motor da DEV-303). Os arquivos novos não são importados por nenhum outro produto.
