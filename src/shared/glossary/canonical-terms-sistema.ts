/**
 * DEV-306 · Verbetes dos termos que o cliente vê no sistema (chat, resultado, dashboard e PDF)
 * e que ainda não tinham significado no glossário. Texto fiel ao motor atual:
 * tabela de letras e acentos de `numbers.ts`, score v3 de `score-v3.ts`, compatibilidade
 * de `harmonization.ts` e regras de sugestão R1–R4 (DEV-301).
 */
import type { GlossaryTermEntry } from './canonical-terms.js';

export const TERMOS_DO_SISTEMA: GlossaryTermEntry[] = [
  // ── Cálculo ────────────────────────────────────────────────────────────────
  {
    slug: 'tabela-cabalistica-das-letras',
    term: 'Tabela Cabalística das Letras',
    category: 'calculo',
    aliases: ['Tabela Cabalística', 'tabela de conversão das letras', 'valor das letras'],
    relatedNumber: null,
    tags: ['Cálculo', 'Letras'],
    relatedSlugs: ['acentos-no-calculo', 'reducao-numerica', 'numero-de-expressao'],
    shortSummary:
      'Cada letra do nome vale um número de 1 a 8. É a base de todos os cálculos do seu mapa.',
    definitionMarkdown: `### Como cada letra vira número

Na Numerologia Cabalística usada pelo Nome Magnético, cada letra tem um valor fixo:

| Valor | Letras |
| --- | --- |
| 1 | A, I, Q, J, Y |
| 2 | B, K, R |
| 3 | C, G, L, S |
| 4 | D, M, T |
| 5 | E, H, N |
| 6 | U, V, W, X, Ç |
| 7 | O, Z |
| 8 | F, P |

Não existe valor 9 para letras. Acentos mudam o valor da letra (veja **Acentos no Cálculo**).

### Exemplo

"ANA" = A (1) + N (5) + A (1) = **7**.`,
  },
  {
    slug: 'acentos-no-calculo',
    term: 'Acentos no Cálculo',
    category: 'calculo',
    aliases: ['Acentos no Cálculo', 'acento no cálculo', 'peso dos acentos'],
    relatedNumber: null,
    tags: ['Cálculo', 'Acentos', 'Grafia'],
    relatedSlugs: ['tabela-cabalistica-das-letras', 'grafia-natural', 'harmonizacao-do-nome'],
    shortSummary:
      'Acentos alteram o valor da letra. Por isso um único acento pode mudar a nota de uma sugestão.',
    definitionMarkdown: `### Quanto cada acento soma

| Sinal | Efeito no valor da letra |
| --- | --- |
| Agudo (´) | soma 2 |
| Til (~) | soma 3 |
| Circunflexo (^) | soma 7 |
| Anel (°, como em Å) | soma 7 |
| Grave (\`) | multiplica por 2 |
| Trema (¨) | multiplica por 2 |
| Apóstrofo (' ou ’) | soma 2 na letra anterior (ex.: D'Angelo) |

### Por que isso importa

Na harmonização, um acento sutil pode tirar um bloqueio ou melhorar a compatibilidade sem mudar o som do nome. O sistema só sugere acentos com grafia natural do português, e você pode pedir na entrevista para evitar acentos.`,
  },
  {
    slug: 'reducao-numerica',
    term: 'Redução Numérica',
    category: 'calculo',
    aliases: ['Redução Numérica', 'redução teosófica', 'soma dos dígitos'],
    relatedNumber: null,
    tags: ['Cálculo'],
    relatedSlugs: ['numeros-mestres', 'regra-do-2-e-4', 'tabela-cabalistica-das-letras'],
    shortSummary:
      'Somar os dígitos de um número até chegar a um só algarismo (1 a 9), preservando 11 e 22 quando a regra permite.',
    definitionMarkdown: `### Como funciona

Um total como 34 vira 3 + 4 = **7**. Um total como 29 vira 2 + 9 = 11, que é preservado como **Número Mestre** na Expressão, no Destino, na Motivação e na Missão.

### Exceção

A **Impressão** é sempre reduzida até 1–9, mesmo quando a soma passa por 11 ou 22.`,
  },
  {
    slug: 'regra-do-2-e-4',
    term: 'Regra do 2 e do 4',
    category: 'calculo',
    aliases: ['Regra do 2/4', 'Regra do 2 e do 4', 'regra 2/4'],
    relatedNumber: null,
    tags: ['Cálculo', 'Números Mestres'],
    relatedSlugs: ['numeros-mestres', 'reducao-numerica', 'numero-de-destino'],
    shortSummary:
      'Quando Destino, Motivação ou Expressão chegam a 2 ou 4, o cálculo é refeito por partes para não perder um 11 ou 22 escondido.',
    definitionMarkdown: `### Por que existe

Somando tudo de uma vez, um 11 pode virar 2 e um 22 pode virar 4 sem ninguém perceber. A regra refaz o cálculo por partes e mantém o mestre de cada parte:

- **Destino:** dia, mês e ano separados.
- **Motivação e Expressão:** palavra por palavra.

A Impressão e a Missão não usam essa regra.`,
  },
  {
    slug: 'dia-natalicio',
    term: 'Dia Natalício',
    category: 'calculo',
    aliases: ['Dia Natalício', 'dia de nascimento'],
    relatedNumber: null,
    tags: ['Cálculo', 'Data de nascimento'],
    relatedSlugs: ['triangulo-pessoal', 'numero-de-destino', 'debitos-karmicos'],
    shortSummary:
      'O dia do mês em que você nasceu. Entra no Destino, no Triângulo Pessoal e pode reforçar um Débito Kármico.',
    definitionMarkdown: `### Onde ele aparece

- Soma no **Número de Destino** junto com o mês e o ano.
- Reduzido, modifica a linha base do **Triângulo Pessoal**; somado ao mês, a do **Triângulo do Destino**.
- Se for 13, 14, 16 ou 19, conta como uma fonte de **Débito Kármico** (e o débito fica acentuado se ele se repetir em outra fonte, como o Destino).`,
  },
  {
    slug: 'vogais-e-consoantes',
    term: 'Vogais e Consoantes',
    category: 'calculo',
    aliases: ['Vogais e Consoantes'],
    relatedNumber: null,
    tags: ['Cálculo'],
    relatedSlugs: ['numero-de-motivacao', 'numero-de-personalidade', 'numero-de-expressao'],
    shortSummary:
      'As vogais formam a Motivação (o que move você por dentro) e as consoantes formam a Impressão (como os outros te percebem).',
    definitionMarkdown: `### Como o nome é dividido

- **Todas as letras** → Número de Expressão.
- **Só as vogais** → Número de Motivação.
- **Só as consoantes** → Número de Impressão.

Acentos entram no valor da letra em qualquer um dos três.`,
  },
  {
    slug: 'frequencia-dos-numeros',
    term: 'Frequência dos Números',
    category: 'calculo',
    aliases: ['Frequência dos Números', 'frequências do nome', 'barra de frequências'],
    relatedNumber: null,
    tags: ['Cálculo', 'Karma'],
    relatedSlugs: ['licoes-karmicas', 'tendencias-ocultas'],
    shortSummary:
      'Quantas vezes cada número de 1 a 8 aparece nas letras do nome. Número ausente vira Lição Kármica; repetido 4 vezes ou mais vira Tendência Oculta.',
    definitionMarkdown: `### Como ler

O gráfico conta, letra por letra, quantas vezes cada valor aparece.

- **Zero vezes:** Lição Kármica, uma qualidade a desenvolver.
- **4 vezes ou mais:** Tendência Oculta, um excesso daquela qualidade.
- **Entre 1 e 3:** presença equilibrada.`,
  },
  {
    slug: 'sequencia-numerica',
    term: 'Sequência Numérica',
    category: 'calculo',
    aliases: ['Sequência Numérica', 'sequência repetida'],
    relatedNumber: null,
    tags: ['Triângulos', 'Bloqueios'],
    relatedSlugs: ['bloqueios-energeticos', 'triangulo-da-vida', 'reflexos-nos-triangulos'],
    shortSummary:
      'Três ou mais números iguais seguidos em uma linha de um triângulo (ex.: 444). É o que o sistema chama de bloqueio.',
    definitionMarkdown: `### Do número ao bloqueio

Cada linha do triângulo é formada pela soma, dois a dois, dos números da linha de cima. Quando aparece 111, 222 … 999 em qualquer linha, o padrão é um **Bloqueio Energético** daquele número.

No **Triângulo da Vida**, cada sequência desconta pontos da nota. Nos outros três, elas aparecem como **reflexos**.`,
  },
  {
    slug: 'reflexos-nos-triangulos',
    term: 'Reflexos nos Triângulos',
    category: 'calculo',
    aliases: ['Reflexos nos Triângulos', 'reflexos', 'reflexo do bloqueio'],
    relatedNumber: null,
    tags: ['Triângulos', 'Bloqueios', 'Score'],
    relatedSlugs: ['triangulo-pessoal', 'triangulo-social', 'triangulo-do-destino', 'sequencia-numerica'],
    shortSummary:
      'Sequências que aparecem nos Triângulos Pessoal, Social ou do Destino. Mostram em que área um bloqueio repercute.',
    definitionMarkdown: `### O que muda na leitura

O Triângulo da Vida mostra o quadro geral e é o que pesa na nota. Os reflexos nos outros três triângulos indicam onde o padrão se manifesta: vida íntima (Pessoal), relação com o mundo (Social) ou resultados (Destino).

Uma sugestão de nome só é oferecida se tiver **zero bloqueios nos quatro triângulos**.`,
  },
  // ── Nota e compatibilidade ────────────────────────────────────────────────
  {
    slug: 'nota-do-nome',
    term: 'Nota do Nome (Score)',
    category: 'calculo',
    aliases: ['Nota do Nome', 'Score do Nome', 'score de harmonia', 'nota de harmonia'],
    exactCaseAliases: ['Score'],
    relatedNumber: null,
    tags: ['Score', 'Cálculo'],
    relatedSlugs: ['niveis-da-nota', 'compatibilidade-expressao-destino', 'bloqueios-energeticos'],
    shortSummary:
      'Pontuação de 0 a 100 que resume a harmonia do nome com a sua data de nascimento. Começa em 100 e perde pontos por cada ponto de tensão.',
    definitionMarkdown: `### Como a nota é calculada

O nome começa com **100 pontos** e recebe descontos, cada grupo com teto:

| O que desconta | Quanto | Teto |
| --- | --- | --- |
| Sequências no Triângulo da Vida | 15 por bloqueio, +2 por linha extra | 45 |
| Compatibilidade Expressão × Destino | Neutra: 6 · Tensão Vibracional: 18 | 18 |
| Débitos Kármicos | 8 por origem, +4 se acentuado | 20 |
| Tendências Ocultas | 3 cada | 9 |
| Lições Kármicas | 2 cada | 8 |

A nota nunca fica abaixo de 5.

### Como usar

Compare a nota do nome de nascimento com a das sugestões. Toda sugestão oferecida tem nota **mínima de 70** e, se o seu nome já passa de 70, **sempre maior** que a dele.`,
  },
  {
    slug: 'niveis-da-nota',
    term: 'Níveis da Nota',
    category: 'calculo',
    aliases: ['Níveis da Nota', 'faixas de nota', 'nível do score'],
    exactCaseAliases: ['Harmonioso', 'Equilíbrio Parcial', 'Pede Atenção', 'Em Tensão'],
    relatedNumber: null,
    tags: ['Score'],
    relatedSlugs: ['nota-do-nome'],
    shortSummary:
      'Cinco faixas que traduzem a nota: Harmonioso (85–100), Favorável (70–84), Equilíbrio Parcial (50–69), Pede Atenção (30–49) e Em Tensão (0–29).',
    definitionMarkdown: `### As cinco faixas

| Nota | Nível | Leitura |
| --- | --- | --- |
| 85–100 | Harmonioso | Vibração integrada, sem bloqueios primários |
| 70–84 | Favorável | Fluxo positivo predomina sobre tensões menores |
| 50–69 | Equilíbrio Parcial | Pontos de atenção e oportunidades convivem |
| 30–49 | Pede Atenção | Sequências ou resistências pedem reorganização |
| 0–29 | Em Tensão | Bloqueios ativos geram forte resistência |

As sugestões do sistema começam sempre em **Favorável** ou acima.`,
  },
  {
    slug: 'compatibilidade-expressao-destino',
    term: 'Compatibilidade Expressão × Destino',
    category: 'calculo',
    aliases: [
      'Compatibilidade Expressão × Destino',
      'Compatibilidade Expressão x Destino',
      'compatibilidade vibracional',
    ],
    exactCaseAliases: ['Compatibilidade'],
    relatedNumber: null,
    tags: ['Compatibilidade', 'Score'],
    relatedSlugs: [
      'compatibilidade-harmonica',
      'compatibilidade-neutra',
      'tensao-vibracional',
      'numero-de-expressao',
      'numero-de-destino',
    ],
    shortSummary:
      'Mostra se o número do seu nome (Expressão) conversa bem com o número da sua data (Destino): Harmônica, Neutra ou Tensão Vibracional.',
    definitionMarkdown: `### Como é avaliada

O sistema usa uma tabela fixa: para cada Destino, alguns números de Expressão são favoráveis, outros neutros e outros em tensão. Exemplo: com Destino 1, Expressões 3, 5 e 9 são **Harmônicas**; 6 está em **Tensão Vibracional**.

### Por que importa

É um dos pesos da nota (Neutra desconta 6 pontos; Tensão, 18). Ajustar a grafia pode levar a Expressão para um número harmônico com o seu Destino, que não muda.`,
  },
  {
    slug: 'compatibilidade-harmonica',
    term: 'Compatibilidade Harmônica (Favorável)',
    category: 'calculo',
    aliases: ['Compatibilidade Harmônica', 'Harmônica / Favorável', 'compatibilidade favorável'],
    relatedNumber: null,
    tags: ['Compatibilidade'],
    relatedSlugs: ['compatibilidade-expressao-destino', 'compatibilidade-neutra', 'tensao-vibracional'],
    shortSummary:
      'Expressão e Destino em sintonia: o nome impulsiona o seu propósito. Não desconta pontos da nota.',
    definitionMarkdown: `### O que significa

O número do nome está entre os favoráveis para o seu Destino na tabela de harmonização. É o melhor cenário e o que o sistema busca nas sugestões.`,
  },
  {
    slug: 'compatibilidade-neutra',
    term: 'Compatibilidade Neutra',
    category: 'calculo',
    aliases: ['Compatibilidade Neutra', 'Vibração Neutra'],
    relatedNumber: null,
    tags: ['Compatibilidade'],
    relatedSlugs: ['compatibilidade-expressao-destino', 'compatibilidade-harmonica', 'tensao-vibracional'],
    shortSummary:
      'Expressão e Destino convivem sem conflito, mas também sem impulso especial. Desconta 6 pontos da nota.',
    definitionMarkdown: `### O que significa

Não há atrito nem sinergia entre o nome e a data. Uma sugestão pode subir para Harmônica com um ajuste de grafia, quando isso não criar bloqueios.`,
  },
  // ── Produto e sugestões ───────────────────────────────────────────────────
  {
    slug: 'nome-de-nascimento',
    term: 'Nome de Nascimento',
    category: 'assinatura',
    aliases: ['Nome de Nascimento', 'nome de registro'],
    relatedNumber: null,
    tags: ['Nome Social'],
    relatedSlugs: ['nome-social', 'nota-do-nome', 'numero-de-destino'],
    shortSummary:
      'O nome completo da certidão. É o ponto de partida da análise e a base de comparação das sugestões.',
    definitionMarkdown: `### Por que ele é a referência

A análise começa pelo nome de registro com a data de nascimento: números, triângulos, bloqueios e nota. As sugestões precisam superar essa nota.

O Nome Magnético **não muda documentos**. A harmonização acontece no nome que você usa e assina no dia a dia.`,
  },
  {
    slug: 'nome-social',
    term: 'Nome Social',
    category: 'assinatura',
    aliases: ['Nome Social', 'nome de uso'],
    relatedNumber: null,
    tags: ['Nome Social', 'Produto'],
    relatedSlugs: ['nome-de-nascimento', 'nome-de-ouro', 'assinatura-magnetica', 'harmonizacao-do-nome'],
    shortSummary:
      'A variação do seu nome para usar e assinar no dia a dia, sem bloqueios e com nota maior que a do nome de nascimento.',
    definitionMarkdown: `### O que é

É como você passa a se apresentar: assinatura, redes, cartão, e-mail. Pode ser o primeiro nome com um sobrenome, a troca de um sobrenome ou um acento sutil, conforme o que você escolheu na entrevista.

### Regras de toda sugestão

1. Zero bloqueios nos quatro triângulos.
2. Nota mínima de 70 e sempre acima da nota do nome de nascimento.
3. Grafia natural do português.`,
  },
  {
    slug: 'nome-de-ouro',
    term: 'Nome de Ouro',
    category: 'assinatura',
    aliases: ['Nome de Ouro'],
    relatedNumber: null,
    tags: ['Nome Social', 'Sugestões'],
    relatedSlugs: ['nome-social', 'selo-maior-nota', 'entrevista-de-perfil'],
    shortSummary:
      'A primeira sugestão da lista: a que melhor equilibra nota alta e o que você pediu na entrevista.',
    definitionMarkdown: `### Como é escolhido

Entre as sugestões válidas, vence a que atende as suas preferências (sobrenomes, manter o primeiro nome, acento, estilo) com a melhor nota. Sem preferência definida, vence a que muda menos o seu nome, entre as de nota próxima da maior.

Por isso o Nome de Ouro nem sempre é o de maior nota. A de maior nota aparece sempre ao lado, com o selo **Maior nota**.`,
  },
  {
    slug: 'selo-maior-nota',
    term: 'Selo Maior Nota',
    category: 'assinatura',
    aliases: ['Maior nota', 'selo Maior nota'],
    relatedNumber: null,
    tags: ['Sugestões', 'Score'],
    relatedSlugs: ['nome-de-ouro', 'nota-do-nome'],
    shortSummary:
      'Marca a sugestão com a nota mais alta. Ela sempre aparece, mesmo fora do estilo que você escolheu.',
    definitionMarkdown: `### Por que ela sempre aparece

A sua preferência guia a ordem, mas você pode mudar de ideia ao ver os números. Por isso a opção de maior nota fica visível desde as primeiras sugestões.`,
  },
  {
    slug: 'grafia-natural',
    term: 'Grafia Natural',
    category: 'assinatura',
    aliases: ['Grafia Natural', 'grafia plausível'],
    relatedNumber: null,
    tags: ['Grafia', 'Acentos'],
    relatedSlugs: ['acentos-no-calculo', 'nome-social'],
    shortSummary:
      'Escrita que soa e parece português de verdade. Grafias forçadas, como til fora de lugar, nunca são sugeridas antes das naturais.',
    definitionMarkdown: `### O que o sistema evita

- Til fora de posição nasal (ex.: til no meio de uma vogal comum).
- Mais de um acento novo por palavra.
- Acento na vogal inicial de sobrenome.
- Anel (°).

Grafias artificiais só aparecem como último recurso, sempre depois das naturais.`,
  },
  {
    slug: 'entrevista-de-perfil',
    term: 'Entrevista de Perfil',
    category: 'assinatura',
    aliases: ['Entrevista de Perfil', 'entrevista guiada', 'questionário do chat'],
    relatedNumber: null,
    tags: ['Nome Social', 'Chat'],
    relatedSlugs: ['nome-de-ouro', 'nome-social'],
    shortSummary:
      'As perguntas do chat que definem o que você quer no nome: sobrenomes, primeiro nome, acento, onde vai usar e como quer ser percebida(o).',
    definitionMarkdown: `### O que ela muda

As respostas não alteram a nota de nenhum nome. Elas definem a **ordem** das sugestões válidas:

1. Primeiro, as que atendem as suas escolhas (ex.: só o primeiro nome, um sobrenome específico), da maior nota para a menor.
2. Depois, as demais, da que muda menos o nome para a que muda mais.

A sugestão de maior nota aparece sempre.`,
  },
  {
    slug: 'gerar-mais-sugestoes',
    term: 'Gerar Mais Sugestões',
    category: 'assinatura',
    aliases: ['Gerar mais', 'Gerar Mais Sugestões'],
    relatedNumber: null,
    tags: ['Sugestões', 'Chat'],
    relatedSlugs: ['nome-para-testar', 'nome-de-ouro'],
    shortSummary:
      'Traz mais 3 sugestões do sistema, sem repetir as já mostradas, até o limite de 9 por rodada.',
    definitionMarkdown: `### Como funciona

As sugestões vêm de 3 em 3: 3 iniciais e até dois pedidos de "Gerar mais". Todas seguem as mesmas regras (sem bloqueios, nota mínima) e a mesma ordem de preferência.

Para testar um nome que **você** escolheu, use o campo de nome para testar.`,
  },
  {
    slug: 'nome-para-testar',
    term: 'Nome para Testar',
    category: 'assinatura',
    aliases: ['Nome para Testar', 'nome manual', 'Avaliar este nome'],
    relatedNumber: null,
    tags: ['Sugestões', 'Chat'],
    relatedSlugs: ['gerar-mais-sugestoes', 'nota-do-nome'],
    shortSummary:
      'Campo para você digitar um nome da sua preferência e ver a nota e os bloqueios dele. Até 5 nomes por sessão.',
    definitionMarkdown: `### Diferença para "Gerar mais"

- **Nome para testar:** você escolhe o nome; o sistema calcula e mostra o resultado, mesmo que tenha bloqueios.
- **Gerar mais:** o sistema escolhe novas opções válidas.

Os nomes testados têm cota própria (5) e não contam nas 9 sugestões automáticas.`,
  },
  {
    slug: 'tipos-de-sugestao',
    term: 'Tipos de Sugestão',
    category: 'assinatura',
    aliases: ['Tipos de Sugestão', 'Mudança mínima', 'Encurtado'],
    relatedNumber: null,
    tags: ['Sugestões', 'Nome Social'],
    relatedSlugs: ['nome-social', 'nome-de-ouro', 'grafia-natural'],
    shortSummary:
      'Rótulo de cada sugestão: Mudança mínima (mantém o nome quase igual), Encurtado (menos sobrenomes) ou Alternativa (outro caminho válido).',
    definitionMarkdown: `### Os três tipos

- **Mudança mínima:** mesmas palavras do nome, com um ajuste leve (ex.: um acento).
- **Encurtado:** menos sobrenomes, como primeiro nome + um sobrenome.
- **Alternativa:** outra combinação válida, às vezes com a maior nota.

Todas seguem as mesmas regras: zero bloqueios e nota acima da mínima.`,
  },
  {
    slug: 'potencial-do-nome',
    term: 'Potencial do Nome',
    category: 'assinatura',
    aliases: ['Potencial do Nome', 'nota potencial', 'score potencial'],
    exactCaseAliases: ['Potencial'],
    relatedNumber: null,
    tags: ['Score', 'Sugestões'],
    relatedSlugs: ['nota-do-nome', 'nome-social'],
    shortSummary:
      'A nota que o seu nome pode alcançar com a harmonização, ao lado da nota do nome de nascimento.',
    definitionMarkdown: `### Como ler

O potencial vem da melhor sugestão válida para o seu nome e a sua data. A diferença entre ele e a nota atual mostra quanto a harmonização pode melhorar.`,
  },
  {
    slug: 'nome-para-bebe',
    term: 'Nome para Bebê',
    category: 'assinatura',
    aliases: ['Nome para Bebê', 'nome de bebê'],
    relatedNumber: null,
    tags: ['Produto'],
    relatedSlugs: ['nome-empresarial', 'compatibilidade-expressao-destino', 'nota-do-nome'],
    shortSummary:
      'Análise de nomes candidatos para um bebê, com o sobrenome da família e a data de nascimento, ranqueados pela nota.',
    definitionMarkdown: `### O que é avaliado

Para cada candidato: os quatro triângulos e bloqueios, a compatibilidade com o Destino do bebê, Lições Kármicas e a nota de 0 a 100. O melhor nome é destacado.`,
  },
  {
    slug: 'nome-empresarial',
    term: 'Nome Empresarial',
    category: 'assinatura',
    aliases: ['Nome Empresarial', 'nome da empresa'],
    relatedNumber: null,
    tags: ['Produto'],
    relatedSlugs: ['data-de-fundacao', 'nome-para-bebe', 'tendencias-ocultas'],
    shortSummary:
      'Análise de nomes para uma empresa, cruzando com o Destino do sócio principal e, se houver, o da data de fundação.',
    definitionMarkdown: `### Particularidades

Além dos bloqueios e da compatibilidade, o excesso do número 8 (Tendência Oculta do 8) recebe uma penalidade extra, para evitar foco só no material.`,
  },
  {
    slug: 'data-de-fundacao',
    term: 'Data de Fundação',
    category: 'calculo',
    aliases: ['Data de Fundação'],
    relatedNumber: null,
    tags: ['Produto', 'Nome Empresarial'],
    relatedSlugs: ['nome-empresarial', 'numero-de-destino'],
    shortSummary:
      'Data de abertura da empresa. Gera o Destino da empresa, usado junto com o do sócio na análise de nome empresarial.',
    definitionMarkdown: `### É obrigatória?

Não. Sem ela, a análise usa só o Destino do sócio principal.`,
  },
  {
    slug: 'debito-karmico-acentuado',
    term: 'Débito Kármico Acentuado',
    category: 'karma',
    aliases: ['Débito Kármico Acentuado', 'débito acentuado'],
    relatedNumber: null,
    tags: ['Karma', 'Score'],
    relatedSlugs: ['debitos-karmicos', 'dia-natalicio'],
    shortSummary:
      'Quando o mesmo débito (13, 14, 16 ou 19) aparece em duas ou mais fontes do mapa, como o dia natalício e o Destino.',
    definitionMarkdown: `### Efeito na nota

Cada origem de débito desconta 8 pontos; acentuado, desconta mais 4 (teto de 20 no total). Os números 11 e 22 não geram débito.`,
  },
];
