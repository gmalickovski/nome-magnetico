# DEV-320 — Motivo da harmonização e caminho artístico no chat

Parte 1 da DEV-319. Base: roteiro adaptativo da [DEV-303](dev-303-questionario-adaptativo-jev.md).

## 1. O que muda

O chat do Nome Social passa a perguntar **o motivo principal** logo depois do nome de nascimento. Quem escolhe "Nome artístico ou persona" segue um ramo próprio. Os outros motivos seguem o roteiro da DEV-303. Todos respondem **outros usos do nome** no fim.

| Passo | Quando aparece | Opções |
| --- | --- | --- |
| `motivo_harmonizacao` | fluxo ligado | **Atualizado na DEV-326:** é a primeira mensagem do chat ("O que você quer fazer hoje?"), antes da certidão, com **Harmonizar o meu nome · Criar um nome artístico · Escolher o nome do meu bebê**. Os motivos "carreira" e "novo ciclo" não mudavam nada e saíram. Ver [DEV-326](dev-326-caminho-bebe-chat.md) |
| `area_artistica` | motivo artístico | Cantor ou cantora · Ator ou atriz · Personagem, drag ou humor · Criação de conteúdo · Escrita · DJ ou produção musical · Outra área (texto até 60) |
| `detalhe_artistico` (até 2) | artístico e área cantor, ator ou personagem | cantor: pop, funk, sertanejo, rap ou trap, MPB/samba/pagode, gospel, rock, eletrônica · ator: drama e novela, comédia, teatro e musical, publicidade e apresentação · personagem: drag, humor e stand-up, personagem infantil, persona digital |
| `genero_persona` | motivo artístico | Feminino · Masculino · Neutro ou ambíguo (sobre a persona, nunca sobre a pessoa) |
| `imagem_artistica` (até 2) | motivo artístico | Marcante · Sofisticada · Divertida · Misteriosa · Popular |
| `tipo_nome_artistico` | motivo artístico | Próximo do meu nome · Totalmente diferente · As duas coisas |
| `outros_usos` (múltipla) | fluxo ligado | Empresa ou CNPJ · Contratos · Redes sociais · Registro de marca · Documentos · Nenhum outro |

O ramo artístico **não pergunta** `relacao_nome`, `onde_assina`, `estilo_presenca`, `area_foco`, `subfoco`, `abertura_mudanca` e `prioridade_conflito` (regra em `isQuestionnaireStepSkipped`).

Caminhos (sem contar o palpite): fluxo desligado 10 perguntas (igual DEV-303) · motivo padrão 12 · artístico com detalhe 10 · artístico sem detalhe 9.

## 2. Motor (F1: nome próximo do nascimento)

`profileToRankingOpcoesArtistico` em `src/shared/interactive-engine/questionnaire-map.ts`:

- `estiloPreferido = curto_direto` e `aceitaEncurtarOuApelido = true` (prenome isolado, apelido, forma curta);
- sem teto de nível e **sem restrição legal**: contratos seguem o nome civil (ver aviso abaixo);
- `imagem_artistica` vira afinidade de estilo da DEV-302 (marcante → criatividade, sofisticada e misteriosa → elegância discreta, divertida e popular → leveza e acolhimento); área `autoestima_expressao`;
- `tipo_nome = proximo` → menor mudança primeiro; `diferente` e `ambos` → maior nota primeiro;
- zero bloqueio e nota mínima da DEV-301 continuam valendo; nada na fórmula do score muda.

"Totalmente diferente" ainda usa o motor de nomes próximos. A geração de nomes novos é a F2 ([DEV-321]).

Com motivo diferente de artístico, o mapeamento é idêntico ao de antes (teste em `questionnaire-dev320.test.ts`).

## 3. Aviso informativo de contratos e documentos

No ramo artístico, se `outros_usos` tiver contratos, documentos, registro de marca ou empresa, o chat mostra uma mensagem **só informativa** (`AVISO_ARTISTICO_CONTRATOS_TEXT`): contratos e cadastros seguem o nome civil e o CPF, o nome artístico aparece como "conhecido artisticamente como", marca no INPI, DRT para artes cênicas e regras do cartório, com recomendação de falar com um advogado. Sem orientação jurídica e sem promessa.

## 4. Onde o perfil fica guardado

Sem migration. O perfil do chat (`PerfilChatPersistido`) vai em JSONB que já existe:

- `/api/analyze` (PDF do chat): `analyses.frequencias_numeros.perfilChat`;
- `/api/regenerate-suggestions`: `frequencias_numeros.parametros_usuario.perfilChat`.

Campos: `motivo`, `areaArtistica`, `areaArtisticaOutro`, `detalheArtistico`, `generoPersona`, `imagemArtistica`, `tipoNomeArtistico`, `outrosUsos`. Validados com Zod nos dois endpoints.

## 5. Liga e desliga

- Env `NM_CHAT_MOTIVO_ARTISTICO` (lido em `/api/decide-live`). Ligado por padrão; `false`, `0` ou `off` desliga e volta ao roteiro e ao motor da DEV-303.
- O servidor devolve `fluxoMotivoAtivo` em cada resposta; o chat guarda no estado e usa no "voltar".

## 6. Fora desta entrega

- Nomes totalmente novos e a tabela número × área (DEV-321).
- Caminho do bebê e a escolha "Para quem é esse nome?" antes do chat.
- PDF por caminho (DEV-322).
- JEV ou LLM sugerindo o motivo a partir do relato livre: a escolha continua por chip.
- Verificação de conflito com artistas e marcas (DEV-323).

## 7. Rollback

`NM_CHAT_MOTIVO_ARTISTICO=false`. Sem migration e sem mudança de schema.
