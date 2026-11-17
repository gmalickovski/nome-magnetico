/**
 * Catálogo canônico do Glossário de Numerologia Cabalística do Nome Magnético.
 * Fica em `src/shared/` para poder ser importado tanto pelo backend quanto por componentes
 * React no frontend sem acoplamento direto a `src/backend/`.
 */

import { TERMOS_DO_SISTEMA } from './canonical-terms-sistema.js';

export type GlossaryCategory =
  | 'numeros'
  | 'calculo'
  | 'triangulos'
  | 'bloqueios'
  | 'karma'
  | 'assinatura'
  | 'arcanos';

export interface GlossaryTermEntry {
  slug: string;
  term: string;
  category: GlossaryCategory;
  aliases: string[];
  /** Aliases que exigem inicial maiúscula (evitam falsos positivos em prosa comum). */
  exactCaseAliases?: string[];
  shortSummary: string;
  definitionMarkdown: string;
  relatedNumber: number | null;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  relatedSlugs?: string[];
  isCanonicalFallback?: boolean;
}

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  numeros: 'Números Principais',
  calculo: 'Cálculo & Nota',
  triangulos: 'Os 4 Triângulos',
  bloqueios: 'Bloqueios Energéticos',
  karma: 'Lições & Débitos Kármicos',
  assinatura: 'Harmonização & Assinatura',
  arcanos: 'Arcanos & Geometria',
};

export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  'numeros',
  'calculo',
  'triangulos',
  'bloqueios',
  'karma',
  'assinatura',
  'arcanos',
];

const TERMOS_BASE: GlossaryTermEntry[] = [
  {
    "slug": "arquetipo",
    "term": "Arquétipo",
    "category": "assinatura",
    "aliases": [
      "Arquétipo"
    ],
    "shortSummary": "Síntese simbólica derivada do Número de Expressão, com qualidades e pontos de atenção. Não é diagnóstico nem altera o score.",
    "definitionMarkdown": "### Arquétipo\n\nSíntese simbólica derivada do Número de Expressão, com qualidades e pontos de atenção. Não é diagnóstico nem altera o score.\n\nO arquétipo é a camada narrativa associada à Expressão pelo catálogo vigente. Nomes com a mesma Expressão mantêm o mesmo arquétipo. A leitura reúne essência, expressão positiva e pontos de atenção; não mede personalidade nem prevê resultados.",
    "relatedNumber": null,
    "tags": [
      "Arquétipo"
    ],
    "relatedSlugs": [
      "numero-de-expressao"
    ]
  },
  {
    "slug": "mapa-vibracional",
    "term": "Mapa Vibracional",
    "category": "assinatura",
    "aliases": [
      "Mapa Vibracional",
      "Mapa de Alinhamento Vibracional"
    ],
    "shortSummary": "Comparação de cinco índices de 0 a 100 calculados pelo motor com a área de foco e o contexto de uso informados. Não altera o score.",
    "definitionMarkdown": "### Mapa Vibracional\n\nComparação de cinco índices de 0 a 100 calculados pelo motor com a área de foco e o contexto de uso informados. Não altera o score.\n\nOs eixos são Foco do Momento, Equilíbrio da Alma, Sintonia de Destino, Magnetismo Social e Fluidez. Compare nascimento e assinatura sob o mesmo contexto. Sem contexto salvo, o motor usa a leitura geral, sem personalização. Os índices não representam probabilidades de sucesso; diferenças são pontos de índice, não variação percentual relativa.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "foco-do-momento",
      "fluidez"
    ]
  },
  {
    "slug": "foco-do-momento",
    "term": "Foco do Momento",
    "category": "assinatura",
    "aliases": [
      "Foco do Momento"
    ],
    "shortSummary": "Relaciona a Expressão à área de foco declarada e às sequências do Triângulo da Vida.",
    "definitionMarkdown": "### Foco do Momento\n\nRelaciona a Expressão à área de foco declarada e às sequências do Triângulo da Vida.\n\nCom área de foco válida, usa a matriz de afinidade do motor; sem ela, usa a compatibilidade geral entre Expressão e Destino. As sequências da Vida compõem as resistências deste eixo.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "mapa-vibracional"
    ]
  },
  {
    "slug": "equilibrio-da-alma",
    "term": "Equilíbrio da Alma",
    "category": "assinatura",
    "aliases": [
      "Equilíbrio da Alma"
    ],
    "shortSummary": "Combina a relação entre Motivação e Expressão com os reflexos do Triângulo Pessoal.",
    "definitionMarkdown": "### Equilíbrio da Alma\n\nCombina a relação entre Motivação e Expressão com os reflexos do Triângulo Pessoal.\n\nEste índice reúne a ressonância da Motivação com a Expressão e as sequências do Triângulo Pessoal. É uma leitura contextual de autoconhecimento e não um diagnóstico emocional.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "mapa-vibracional"
    ]
  },
  {
    "slug": "sintonia-de-destino",
    "term": "Sintonia de Destino",
    "category": "assinatura",
    "aliases": [
      "Sintonia de Destino"
    ],
    "shortSummary": "Relaciona Expressão e Missão ao Destino, conforme as compatibilidades do motor.",
    "definitionMarkdown": "### Sintonia de Destino\n\nRelaciona Expressão e Missão ao Destino, conforme as compatibilidades do motor.\n\nO Destino permanece vinculado à data de nascimento. O eixo compara as relações numerológicas do nome com esse Destino com reforço pela Missão, sem alterar a nota global.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "mapa-vibracional"
    ]
  },
  {
    "slug": "magnetismo-social",
    "term": "Magnetismo Social",
    "category": "assinatura",
    "aliases": [
      "Magnetismo Social"
    ],
    "shortSummary": "Combina Impressão, contexto de uso informado e reflexos do Triângulo Social.",
    "definitionMarkdown": "### Magnetismo Social\n\nCombina Impressão, contexto de uso informado e reflexos do Triângulo Social.\n\nO motor considera a Impressão do nome, a afinidade com os canais de uso declarados e as sequências do Triângulo Social. O índice não é uma previsão de reconhecimento ou êxito profissional.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "mapa-vibracional"
    ]
  },
  {
    "slug": "fluidez",
    "term": "Fluidez",
    "category": "assinatura",
    "aliases": [
      "Fluidez"
    ],
    "shortSummary": "Indica a presença ou ausência de sequências repetidas no Triângulo da Vida conforme o motor vigente.",
    "definitionMarkdown": "### Fluidez\n\nIndica a presença ou ausência de sequências repetidas no Triângulo da Vida conforme o motor vigente.\n\nO eixo parte das sequências da Vida e dos descontos correspondentes no motor. As leituras complementares Pessoal e Social não descontam diretamente da nota global. Um índice maior não é garantia de resultado na vida.",
    "relatedNumber": null,
    "tags": [
      "Mapa Vibracional"
    ],
    "relatedSlugs": [
      "mapa-vibracional"
    ]
  },
  // ── 1. NÚMEROS PRINCIPAIS ────────────────────────────────────────────────
  {
    slug: 'numero-de-expressao',
    term: 'Número de Expressão',
    category: 'numeros',
    aliases: [
      'Número de Expressão',
      'Números de Expressão',
      'Expressão do Nome',
      'vibração de Expressão',
    ],
    exactCaseAliases: ['Expressão'],
    relatedNumber: 1,
    tags: ['Números Principais', 'Nome Completo', 'Talentos'],
    relatedSlugs: ['numero-de-destino', 'harmonizacao-do-nome', 'tensao-vibracional'],
    shortSummary:
      'Calculado pela soma de todas as letras do nome completo; revela seus talentos naturais, postura profissional e forma de agir no mundo.',
    definitionMarkdown: `### O que é o Número de Expressão

O **Número de Expressão** nasce da conversão de **todas as letras do nome completo** (prenome e sobrenomes) segundo a tabela cabalística, considerando inclusive a influência de acentos agudos (+2), til (+3) e crase (x3).

### Como ele atua na prática

Enquanto o **Número de Destino** aponta a direção da sua jornada pela data de nascimento, a Expressão representa o **veículo** que você utiliza para percorrer esse caminho. Quando a Expressão entra em **Tensão Vibracional** com o Destino, talentos claros acabam encontrando atrito na execução ou falta de reconhecimento.

### Na harmonização do nome

Ao avaliar ou construir uma nova assinatura social ou empresarial, ajustamos as letras do nome escolhido para que a nova Expressão neutralize tensões e atue em harmonia com o seu Destino.`,
  },
  {
    slug: 'numero-de-destino',
    term: 'Número de Destino',
    category: 'numeros',
    aliases: ['Número de Destino', 'Números de Destino', 'vibração de Destino'],
    exactCaseAliases: ['Destino'],
    relatedNumber: 2,
    tags: ['Números Principais', 'Data de Nascimento', 'Propósito'],
    relatedSlugs: ['numero-de-expressao', 'triangulo-do-destino', 'harmonizacao-do-nome'],
    shortSummary:
      'Extraído da soma dos dígitos da data de nascimento; indica a missão central desta trajetória e não pode ser alterado.',
    definitionMarkdown: `### O que é o Número de Destino

O **Número de Destino** é obtido pela soma reduzida do dia, mês e ano de nascimento, preservando os números mestres **11** e **22**. Por derivar da data em que você chegou ao mundo, trata-se de uma frequência fixa e estruturante.

### Relação com o nome de uso

O nome nunca muda o seu Destino — ele muda a **qualidade da ponte** entre quem você é e o que o Destino pede que você realize. Quando o nome e o Destino possuem compatibilidade total ou complementar, oportunidades, parcerias e clareza de propósito fluem com menor resistência.`,
  },
  {
    slug: 'numero-de-motivacao',
    term: 'Número de Motivação (Alma)',
    category: 'numeros',
    aliases: [
      'Número de Motivação',
      'Número da Alma',
      'Motivação/Alma',
      'Motivação da Alma',
    ],
    exactCaseAliases: ['Motivação'],
    relatedNumber: 3,
    tags: ['Números Principais', 'Vogais', 'Desejo Interior'],
    relatedSlugs: ['numero-de-missao', 'numero-de-expressao', 'estrela-cabalistica'],
    shortSummary:
      'Calculado apenas pelas vogais do nome completo; traduz o que move sua essência, seus valores íntimos e suas decisões silenciosas.',
    definitionMarkdown: `### A vibração das vogais

As **vogais** carregam o sopro sonoro do nome e revelam a camada mais íntima da identidade: aquilo que realmente traz sentido, realização pessoal e paz interior, mesmo longe dos olhares externos.

### Como equilibrar

Uma **Motivação** em sintonia com o restante da **Estrela Cabalística** impede que você conquiste resultados externos que não trazem satisfação interna. Quando desalinhada de débitos kármicos ligados à sensibilidade, tende a gerar autocobrança excessiva.`,
  },
  {
    slug: 'numero-de-missao',
    term: 'Número de Missão',
    category: 'numeros',
    aliases: ['Número de Missão'],
    exactCaseAliases: ['Missão'],
    relatedNumber: null,
    tags: ['Números Principais', 'Propósito'],
    relatedSlugs: ['numero-de-destino', 'numero-de-expressao', 'numeros-mestres'],
    shortSummary:
      'Soma do Destino com a Expressão. Mostra o papel que você tende a cumprir quando o nome e a data trabalham juntos.',
    definitionMarkdown: `### Como é calculado

**Missão = Destino + Expressão**, reduzida até 1–9, preservando os Números Mestres 11 e 22. Não usa a Regra do 2 e do 4.

### Como ler

O Destino é fixo (vem da data) e a Expressão vem do nome. Por isso a Missão é o número que conecta os dois: o tipo de contribuição que flui com mais naturalidade no trabalho e na vida em grupo. Quando o nome muda, a Missão pode mudar junto.`
  },
  {
    slug: 'numero-de-personalidade',
    term: 'Número de Impressão (Personalidade)',
    category: 'numeros',
    aliases: ['Número de Impressão', 'Número de Personalidade', 'Impressão — A Máscara Social'],
    exactCaseAliases: ['Impressão', 'Personalidade'],
    relatedNumber: null,
    tags: ['Números Principais', 'Consoantes', 'Identidade'],
    relatedSlugs: ['numero-de-expressao', 'numero-de-motivacao', 'vogais-e-consoantes'],
    shortSummary:
      'Soma das consoantes do nome completo. Mostra a primeira impressão que você causa, a "máscara social". Sempre de 1 a 9.',
    definitionMarkdown: `### Como é calculado

Somam-se apenas as **consoantes** do nome completo (com o valor dos acentos) e reduz-se até 1–9. A Impressão **não preserva** os Números Mestres 11 e 22 e não usa a Regra do 2 e do 4.

### Como ler

É o que os outros percebem antes de te conhecer: postura, estilo, a forma como o nome soa por fora. Enquanto a Motivação (vogais) fala do que te move por dentro, a Impressão fala da imagem que chega primeiro.

### No Nome Social

Trocar um sobrenome ou um acento pode mudar a Impressão sem mexer no primeiro nome que as pessoas usam com você.`
  },
  {
    slug: 'numeros-mestres',
    term: 'Números Mestres (11 e 22)',
    category: 'numeros',
    aliases: ['Números Mestres', 'Número Mestre', 'vibração mestre'],
    relatedNumber: 11,
    tags: ['Números Mestres', '11', '22', 'Alta Voltagem'],
    relatedSlugs: ['numero-mestre-11', 'numero-mestre-22', 'numero-de-destino'],
    shortSummary:
      'Frequências 11 e 22 que não são reduzidas na numerologia cabalística por concentrarem potencial amplificado de inspiração e realização.',
    definitionMarkdown: `### Por que 11 e 22 não se reduzem

Na **Numerologia Cabalística**, quando a soma intermediária resulta em **11** ou **22**, preserva-se o número duplo. Eles combinam a força de sua base reduzida (2 ou 4) com uma carga extra de responsabilidade, visão e impacto coletivo.

### Onde são preservados

O 11 e o 22 são mantidos na Expressão, no Destino, na Motivação e na Missão. Na **Impressão** eles são sempre reduzidos (11 vira 2; 22 vira 4). Eles também **não geram Débito Kármico**.

### Atenção no uso cotidiano

Justamente por serem frequências de alta voltagem, números mestres exigem maturidade emocional e um mapa equilibrado para não oscilarem para ansiedade ou excesso de peso nas decisões.`,
  },
  {
    slug: 'numero-mestre-11',
    term: 'Número Mestre 11',
    category: 'numeros',
    aliases: ['Número Mestre 11', 'Mestre 11', 'Destino 11', 'Expressão 11'],
    relatedNumber: 11,
    tags: ['Números Mestres', 'Intuição', 'Visão'],
    relatedSlugs: ['numeros-mestres', 'numero-mestre-22', 'tensao-vibracional'],
    shortSummary:
      'Vibração associada à intuição aguçada, inspiração criativa e capacidade de traduzir ideias complexas em clareza para outras pessoas.',
    definitionMarkdown: `### Essência do 11

O **11** amplifica a sensibilidade perceptiva do número 2 com a iniciativa dupla do 1. Costuma destacar pessoas com forte magnetismo comunicativo, percepção estratégica e papel de referência em ambientes criativos, educacionais ou de aconselhamento.

### Ponto de equilíbrio

Quando entra em **Tensão Vibracional** com o Destino ou acumula bloqueios nos triângulos, pode manifestar hipersensibilidade, indecisão e dispersão mental.`,
  },
  {
    slug: 'numero-mestre-22',
    term: 'Número Mestre 22',
    category: 'numeros',
    aliases: ['Número Mestre 22', 'Mestre 22', 'Destino 22', 'Expressão 22'],
    relatedNumber: 22,
    tags: ['Números Mestres', 'Construção', 'Escala'],
    relatedSlugs: ['numeros-mestres', 'numero-mestre-11', 'harmonizacao-do-nome'],
    shortSummary:
      'Conhecido como o Mestre Construtor; une visão ampla à capacidade prática de estruturar projetos sólidos e de longo alcance.',
    definitionMarkdown: `### Essência do 22

O **22** eleva a disciplina estruturante do 4 para projetos de grande porte. Indica vocação para organizar sistemas, liderar empreendimentos complexos e transformar intuições em entregas concretas.

### Ponto de equilíbrio

Sem suporte estrutural nos triângulos, a carga do 22 pode se converter em sobrecarga de trabalho ou rigidez excessiva consigo mesmo e com a equipe.`,
  },

  // ── 2. OS 4 TRIÂNGULOS NUMEROLÓGICOS ─────────────────────────────────────
  {
    slug: 'triangulo-da-vida',
    term: 'Triângulo da Vida',
    category: 'triangulos',
    aliases: ['Triângulo da Vida', 'Triângulo Básico', 'Pirâmide da Vida'],
    relatedNumber: null,
    tags: ['4 Triângulos', 'Base do Score', 'Vitalidade'],
    relatedSlugs: ['triangulo-pessoal', 'triangulo-social', 'bloqueios-energeticos'],
    shortSummary:
      'Construído apenas com o valor puro de cada letra do nome; revela a estrutura fundamental de existência e concentra os bloqueios que pesam no score.',
    definitionMarkdown: `### A pirâmide fundamental

O **Triângulo da Vida** é formado alinhando o valor numérico de cada letra do nome completo e reduzindo pares adjacentes linha após linha até restar o **Arcano Regente** no vértice.

### Papel determinante no score

No motor cabalístico do Nome Magnético, as sequências de três ou mais algarismos repetidos no Triângulo da Vida compõem os bloqueios estruturais que impactam diretamente a pontuação do nome, pois retratam a vitalidade de base e o fluxo de prosperidade cotidiana.`,
  },
  {
    slug: 'triangulo-pessoal',
    term: 'Triângulo Pessoal',
    category: 'triangulos',
    aliases: ['Triângulo Pessoal', 'Pirâmide Pessoal'],
    relatedNumber: null,
    tags: ['4 Triângulos', 'Vida Íntima', 'Reações Internas'],
    relatedSlugs: ['triangulo-da-vida', 'triangulo-social', 'triangulo-do-destino'],
    shortSummary:
      'Calculado somando o dia reduzido de nascimento ao valor das letras; espelha a vida íntima, afetiva e as reações emocionais internas.',
    definitionMarkdown: `### O espelho da vida íntima

O **Triângulo Pessoal** cruza a assinatura de cada letra com a vibração do **dia do seu nascimento reduzido**. Ele revela como você reage emocionalmente quando está fora dos papéis sociais — nos vínculos próximos, em casa e no diálogo interior.

### Reflexos vibracionais

Sequências repetidas aqui funcionam como **reflexos complementares**, sinalizando padrões íntimos de autossabotagem ou desgaste emocional que uma assinatura limpa ajuda a pacificar.`,
  },
  {
    slug: 'triangulo-social',
    term: 'Triângulo Social',
    category: 'triangulos',
    aliases: ['Triângulo Social', 'Pirâmide Social'],
    relatedNumber: null,
    tags: ['4 Triângulos', 'Visibilidade', 'Relacionamentos'],
    relatedSlugs: ['triangulo-da-vida', 'triangulo-pessoal', 'triangulo-do-destino'],
    shortSummary:
      'Soma o mês reduzido de nascimento às letras do nome; revela como clientes, parceiros e o mundo externo percebem e respondem a você.',
    definitionMarkdown: `### A camada de percepção pública

Ao incorporar o **mês de nascimento** na linha de base do nome, o **Triângulo Social** mostra a leitura que o ambiente faz da sua presença: networking, reputação, clareza de comunicação e facilidade para atrair alianças estratégicas.

### Relevância em marca e carreira

Sequências de atrito nessa pirâmide costumam coincidir com sensação de invisibilidade profissional, esforço alto para fechar acordos ou dificuldade de ser percebido pelo real valor do seu trabalho.`,
  },
  {
    slug: 'triangulo-do-destino',
    term: 'Triângulo do Destino',
    category: 'triangulos',
    aliases: ['Triângulo do Destino', 'Pirâmide do Destino'],
    relatedNumber: null,
    tags: ['4 Triângulos', 'Colheita', 'Resultados'],
    relatedSlugs: ['triangulo-da-vida', 'triangulo-social', 'arcano-regente'],
    shortSummary:
      'Combina a soma reduzida de dia e mês de nascimento com as letras do nome; mapeia materialização, colheita e previsões de ciclo.',
    definitionMarkdown: `### A síntese dos resultados

O **Triângulo do Destino** aplica à base do nome a soma reduzida de **dia + mês de nascimento**. Ele revela como todo o seu empenho tende a se converter em frutos tangíveis ao longo dos ciclos representados pelos **Arcanos de Trânsito**.

### O que observar

Atritos nessa camada frequentemente aparecem quando há muita dedicação diária com colheita abaixo do potencial — algo que variações harmonizadas buscam destravar integralmente.`,
  },

  // ── 3. BLOQUEIOS ENERGÉTICOS ─────────────────────────────────────────────
  {
    slug: 'bloqueios-energeticos',
    term: 'Bloqueios Energéticos (Sequências Negativas)',
    category: 'bloqueios',
    aliases: [
      'Bloqueios Energéticos',
      'Bloqueio Energético',
      'bloqueios nos triângulos',
      'sequências repetidas',
      'sequência negativa',
    ],
    relatedNumber: null,
    tags: ['Bloqueios', 'Triângulos', 'Travamentos'],
    relatedSlugs: ['bloqueio-444', 'bloqueio-888', 'triangulo-da-vida'],
    shortSummary:
      'Repetições de três ou mais números idênticos lado a lado (ex.: 111 a 999) em qualquer linha dos 4 triângulos numerológicos.',
    definitionMarkdown: `### Como surgem os bloqueios

Sempre que o mesmo algarismo aparece **três ou mais vezes em sequência** (como 333, 444 ou 888) na base ou nas reduções internas dos triângulos do nome, cria-se um ponto de estagnação vibratória chamado **Bloqueio Energético**.

### Por que analisar todos os 4 triângulos

Uma variação de nome só pode ser considerada verdadeiramente limpa quando elimina repetições tanto no **Triângulo da Vida** quanto nos triângulos **Pessoal, Social e de Destino**, além de observar o aspecto de saúde e vitalidade associado a cada código.`,
  },
  {
    slug: 'bloqueio-111',
    term: 'Bloqueio 111 — Iniciação e Coragem',
    category: 'bloqueios',
    aliases: ['Bloqueio 111', 'Sequência 111', '111'],
    relatedNumber: 1,
    tags: ['Bloqueios', '111', 'Iniciativa'],
    relatedSlugs: ['bloqueios-energeticos', 'bloqueio-444'],
    shortSummary:
      'Trava a tomada de iniciativa, gerando hesitação prolongada para iniciar projetos novos ou assumir liderança própria.',
    definitionMarkdown: `### O que o 111 representa

Quando o número **1** se repete em bloco (**111**), a energia de começo e pioneirismo fica congestionada. Ideias ficam no papel por insegurança, procrastinação ou dificuldade em dar o primeiro passo sem aprovação externa.

### Aspecto de vitalidade

Costuma associar-se a tensão craniana, dores de cabeça recorrentes e fadiga ligada à pressão por decidir sozinho.`,
  },
  {
    slug: 'bloqueio-222',
    term: 'Bloqueio 222 — Associação e Vínculos',
    category: 'bloqueios',
    aliases: ['Bloqueio 222', 'Sequência 222', '222'],
    relatedNumber: 2,
    tags: ['Bloqueios', '222', 'Parcerias'],
    relatedSlugs: ['bloqueios-energeticos', 'numero-de-destino'],
    shortSummary:
      'Gera oscilação em parcerias, indecisão afetiva ou dificuldade para estabelecer limites saudáveis em colaborações.',
    definitionMarkdown: `### O que o 222 representa

O bloqueio **222** concentra excesso de dúvida na vibração da cooperação. A pessoa tende a ceder demais para evitar conflitos ou a viver sociedades e relacionamentos marcados por instabilidade e falta de reciprocidade clara.

### Aspecto de vitalidade

Relaciona-se frequentemente a sensibilidade digestiva ou retenção emocional por não expressar desacordos na hora certa.`,
  },
  {
    slug: 'bloqueio-333',
    term: 'Bloqueio 333 — Expressão e Comunicação',
    category: 'bloqueios',
    aliases: ['Bloqueio 333', 'Sequência 333', '333'],
    relatedNumber: 3,
    tags: ['Bloqueios', '333', 'Comunicação'],
    relatedSlugs: ['bloqueios-energeticos', 'triangulo-social'],
    shortSummary:
      'Obstrui a fluidez comunicativa e criativa, gerando ruídos de interpretação, receio de se expor ou dispersão de talentos.',
    definitionMarkdown: `### O que o 333 representa

A sequência **333** trava justamente o fluxo da expressão criativa e da comunicação aberta. Mesmo quem tem ótimo repertório sente dificuldade para divulgar seu trabalho, precificar ideias ou se posicionar com leveza.

### Aspecto de vitalidade

Tende a reverberar em garganta, cordas vocais, tensão cervical e exaustão por excesso de falas não ditas.`,
  },
  {
    slug: 'bloqueio-444',
    term: 'Bloqueio 444 — Estruturação e Trabalho',
    category: 'bloqueios',
    aliases: ['Bloqueio 444', 'Sequência 444', '444'],
    relatedNumber: 4,
    tags: ['Bloqueios', '444', 'Trabalho', 'Estabilidade'],
    relatedSlugs: ['bloqueios-energeticos', 'bloqueio-888'],
    shortSummary:
      'Cria sensação de peso, sobrecarga operacional e esforço desproporcional para construir estabilidade material e profissional.',
    definitionMarkdown: `### O que o 444 representa

O bloqueio **444** cristaliza a energia da disciplina em rigidez ou excesso de carga. É comum sentir que tudo depende de trabalho duro sem alívio, com atrasos burocráticos ou dificuldade em estruturar processos duradouros.

### Aspecto de vitalidade

Pode se manifestar em rigidez muscular, coluna, articulações e sensação crônica de esgotamento físico.`,
  },
  {
    slug: 'bloqueio-555',
    term: 'Bloqueio 555 — Liberdade e Mudanças',
    category: 'bloqueios',
    aliases: ['Bloqueio 555', 'Sequência 555', '555'],
    relatedNumber: 5,
    tags: ['Bloqueios', '555', 'Mudanças'],
    relatedSlugs: ['bloqueios-energeticos', 'bloqueio-333'],
    shortSummary:
      'Provoca inquietação constante, mudanças abruptas sem base firme ou medo de sair da zona de conforto.',
    definitionMarkdown: `### O que o 555 representa

O **555** desordena a energia de movimento e adaptação. Ora gera impaciência que interrompe projetos antes da maturação, ora cria bloqueio frente a transições inevitáveis na carreira ou rotina.

### Aspecto de vitalidade

Associa-se a agitação do sistema nervoso, insônia leve e oscilação metabólica ligada à ansiedade.`,
  },
  {
    slug: 'bloqueio-666',
    term: 'Bloqueio 666 — Harmonia e Afeto',
    category: 'bloqueios',
    aliases: ['Bloqueio 666', 'Sequência 666', '666'],
    relatedNumber: 6,
    tags: ['Bloqueios', '666', 'Família', 'Harmonia'],
    relatedSlugs: ['bloqueios-energeticos', 'triangulo-pessoal'],
    shortSummary:
      'Indica atritos no equilíbrio afetivo e doméstico, perfeccionismo relacional ou tendência a carregar responsabilidades familiares além da conta.',
    definitionMarkdown: `### O que o 666 representa

Longe de superstições, na numerologia cabalística a sequência **666** aponta congestionamento na área do afeto, da estética e da vida familiar: cobrança exagerada por harmonia perfeita, ciúme ou desgaste tentando resolver problemas de todos ao redor.

### Aspecto de vitalidade

Relaciona-se ao sistema cardiovascular emocional e tensão na região torácica e ombros.`,
  },
  {
    slug: 'bloqueio-777',
    term: 'Bloqueio 777 — Conexão e Confiança',
    category: 'bloqueios',
    aliases: ['Bloqueio 777', 'Sequência 777', '777'],
    relatedNumber: 7,
    tags: ['Bloqueios', '777', 'Introspecção'],
    relatedSlugs: ['bloqueios-energeticos', 'bloqueio-999'],
    shortSummary:
      'Favorece isolamento excessivo, excesso de análise crítica que paralisa ações ou ceticismo quanto à própria intuição.',
    definitionMarkdown: `### O que o 777 representa

O bloqueio **777** intensifica a busca por respostas perfeitas até o ponto de desconectar a pessoa do convívio prático. Gera receio de confiar, hipervigilância mental e tendência à solidão defensiva.

### Aspecto de vitalidade

Pode refletir em distúrbios do sono, fadiga mental e baixa reserva energética por excesso de ruminação.`,
  },
  {
    slug: 'bloqueio-888',
    term: 'Bloqueio 888 — Poder e Abundância',
    category: 'bloqueios',
    aliases: ['Bloqueio 888', 'Sequência 888', '888'],
    relatedNumber: 8,
    tags: ['Bloqueios', '888', 'Prosperidade', 'Finanças'],
    relatedSlugs: ['bloqueios-energeticos', 'tendencias-ocultas'],
    shortSummary:
      'Aponta ciclos financeiros de altos e baixos, dificuldade na gestão de poder pessoal ou travas no retorno financeiro do trabalho.',
    definitionMarkdown: `### O que o 888 representa

Apesar do apelo popular do 8, nos triângulos a repetição **888** opera como bloqueio: cria extremos entre ambição intensa e travas de fluxo financeiro, cobranças injustas, prejuízos inesperados ou medo de exercer autoridade.

### Aspecto de vitalidade

Comumente associado a sobrecarga adrenal, pressão arterial flutuante e estresse ligado a metas materiais.`,
  },
  {
    slug: 'bloqueio-999',
    term: 'Bloqueio 999 — Encerramentos e Desapego',
    category: 'bloqueios',
    aliases: ['Bloqueio 999', 'Sequência 999', '999'],
    relatedNumber: 9,
    tags: ['Bloqueios', '999', 'Ciclos'],
    relatedSlugs: ['bloqueios-energeticos', 'bloqueio-777'],
    shortSummary:
      'Dificulta fechar ciclos antigos — mantendo vínculos, hábitos ou projetos desgastados ativos por tempo demais.',
    definitionMarkdown: `### O que o 999 representa

O número 9 simboliza síntese e conclusão. Em bloqueio (**999**), há resistência para encerrar capítulos superados ou, inversamente, exaustão emocional por absorver causas e dores alheias sem filtro.

### Aspecto de vitalidade

Pode manifestar cansaço imunológico recorrente e necessidade frequente de recolhimento para recompor forças.`,
  },

  // ── 4. LIÇÕES, TENDÊNCIAS E DÉBITOS KÁRMICOS ──────────────────────────────
  {
    slug: 'licoes-karmicas',
    term: 'Lições Kármicas',
    category: 'karma',
    aliases: ['Lições Kármicas', 'Lição Kármica', 'números ausentes no nome'],
    relatedNumber: null,
    tags: ['Karma', 'Ausências 1-9', 'Desenvolvimento'],
    relatedSlugs: ['tendencias-ocultas', 'debitos-karmicos', 'harmonizacao-do-nome'],
    shortSummary:
      'Representadas pelos números de 1 a 8 (e 9 na leitura estendida) que não aparecem em nenhuma letra do nome de nascimento; indicam habilidades a desenvolver.',
    definitionMarkdown: `### O que a ausência de um número indica

Ao mapear todas as letras do nome de nascimento na tabela cabalística, os algarismos de **1 a 8** que ficam com frequência zero apontam **Lições Kármicas** — qualidades que exigem aprendizado consciente porque não vêm de forma automática na base natal.

### Como trabalhar e harmonizar

Além do desenvolvimento comportamental no dia a dia, uma assinatura social bem projetada pode introduzir letras estratégicas que preencham lacunas relevantes sem criar bloqueios nos triângulos.`,
  },
  {
    slug: 'tendencias-ocultas',
    term: 'Tendências Ocultas',
    category: 'karma',
    aliases: ['Tendências Ocultas', 'Tendência Oculta', 'excesso vibracional'],
    relatedNumber: null,
    tags: ['Karma', 'Frequência Alta', 'Moderação'],
    relatedSlugs: ['licoes-karmicas', 'debitos-karmicos', 'bloqueio-888'],
    shortSummary:
      'Surgem quando um mesmo algarismo aparece 4 ou mais vezes no nome completo, sinalizando predisposições fortes que pedem dosagem consciente.',
    definitionMarkdown: `### Quando um número sobra no nome

Se um dígito (de 1 a 8, ou 9 na tabela estendida) se repete **4 ou mais vezes** nas letras do nome de nascimento, ele configura uma **Tendência Oculta**. Não é um erro em si, mas um traço muito concentrado que pode dominar decisões se ficar sem contrapeso.

### Exemplo no uso empresarial

Em nomes de empresas, por exemplo, tendência oculta elevada no número 8 costuma acentuar cobrança material extrema — critério objetivamente ponderado pelo motor do Nome Magnético.`,
  },
  {
    slug: 'debitos-karmicos',
    term: 'Débitos Kármicos (13, 14, 16 e 19)',
    category: 'karma',
    aliases: ['Débitos Kármicos', 'Débito Kármico', 'dívidas kármicas'],
    relatedNumber: null,
    tags: ['Karma', '13', '14', '16', '19'],
    relatedSlugs: [
      'debito-karmico-13',
      'debito-karmico-14',
      'debito-karmico-16',
      'debito-karmico-19',
    ],
    shortSummary:
      'Números compostos específicos (13, 14, 16 e 19) presentes na data ou nos números do nome; indicam aprendizados que exigem retidão e maturidade.',
    definitionMarkdown: `### Débitos Fixos vs Variáveis

- **Débitos Fixos (na data de nascimento ou dia nativo)**: acompanham toda a jornada como lembretes permanentes de consciência e não desaparecem com troca de assinatura.
- **Débitos Variáveis (derivados das somas do nome)**: podem ser atenuados ou eliminados quando uma nova combinação de letras reorganiza os números de Expressão, Motivação ou Impressão.`,
  },
  {
    slug: 'debito-karmico-13',
    term: 'Débito Kármico 13',
    category: 'karma',
    aliases: ['Débito Kármico 13', 'Débito 13', 'número 13 kármico'],
    relatedNumber: 13,
    tags: ['Débitos Kármicos', 'Disciplina', 'Transformação'],
    relatedSlugs: ['debitos-karmicos', 'debito-karmico-14'],
    shortSummary:
      'Convida a superar a pressa por atalhos através de trabalho constante, organização e atenção cuidadosa aos detalhes práticos.',
    definitionMarkdown: `### Significado do 13

Na leitura cabalística, o **13** (que reduz ao 4) ensina o valor da construção passo a passo. Tentativas de pular etapas geram retrabalho, enquanto disciplina diária e comprometimento transformam obstáculos em base sólida.`,
  },
  {
    slug: 'debito-karmico-14',
    term: 'Débito Kármico 14',
    category: 'karma',
    aliases: ['Débito Kármico 14', 'Débito 14', 'número 14 kármico'],
    relatedNumber: 14,
    tags: ['Débitos Kármicos', 'Equilíbrio', 'Desapego'],
    relatedSlugs: ['debitos-karmicos', 'debito-karmico-16'],
    shortSummary:
      'Pede equilíbrio entre liberdade e responsabilidade, evitando impulsividade, excessos sensoriais e instabilidade nos compromissos.',
    definitionMarkdown: `### Significado do 14

O **14** (que reduz ao 5) trabalha a temperança. Ensina a navegar mudanças com lucidez e firmeza de propósito, sem se dispersar em múltiplas direções ou ceder à impaciência diante da rotina.`,
  },
  {
    slug: 'debito-karmico-16',
    term: 'Débito Kármico 16',
    category: 'karma',
    aliases: ['Débito Kármico 16', 'Débito 16', 'número 16 kármico'],
    relatedNumber: 16,
    tags: ['Débitos Kármicos', 'Autoconhecimento', 'Humildade'],
    relatedSlugs: ['debitos-karmicos', 'debito-karmico-19'],
    shortSummary:
      'Aponta reconstruções profundas que dissolvem vaidade ou ilusões, conduzindo a uma sabedoria autêntica e vínculos mais verdadeiros.',
    definitionMarkdown: `### Significado do 16

O **16** (que reduz ao 7) desafia estruturas construídas apenas por ego ou aparência. Quando acolhido com humildade e escuta interior, gera lucidez rara, renovação espiritual e maturidade afetiva.`,
  },
  {
    slug: 'debito-karmico-19',
    term: 'Débito Kármico 19',
    category: 'karma',
    aliases: ['Débito Kármico 19', 'Débito 19', 'número 19 kármico'],
    relatedNumber: 19,
    tags: ['Débitos Kármicos', 'Autonomia', 'Generosidade'],
    relatedSlugs: ['debitos-karmicos', 'debito-karmico-13'],
    shortSummary:
      'Trabalha o uso ético do poder pessoal e da independência, equilibrando firmeza com capacidade real de cooperar e ouvir.',
    definitionMarkdown: `### Significado do 19

O **19** (que reduz ao 1) chama à autonomia responsável: conquistar protagonismo próprio sem autoritarismo nem isolamento, reconhecendo a interdependência saudável com quem caminha junto.`,
  },

  // ── 5. HARMONIZAÇÃO & ASSINATURA ──────────────────────────────────────────
  {
    slug: 'harmonizacao-do-nome',
    term: 'Harmonização do Nome',
    category: 'assinatura',
    aliases: [
      'Harmonização do Nome',
      'harmonização cabalística',
      'nome harmonizado',
    ],
    relatedNumber: null,
    tags: ['Harmonização', 'Nome Social', 'Score'],
    relatedSlugs: ['tensao-vibracional', 'assinatura-magnetica', 'bloqueios-energeticos'],
    shortSummary:
      'Processo técnico de compor ou ajustar a assinatura para eliminar bloqueios nos 4 triângulos e alinhar Expressão, Destino e Motivação.',
    definitionMarkdown: `### Critérios formais objetivos

A harmonização do Nome Magnético utiliza exclusivamente critérios matemáticos e formais:
1. Eliminação total de bloqueios repetidos nos **4 Triângulos**.
2. Compatibilidade **Harmônica** (ou ao menos Neutra) entre **Expressão** e **Destino**.
3. Redução de **Débitos Kármicos variáveis** e equilíbrio das **Tendências Ocultas** e **Lições Kármicas**.

Com o nome ajustado, sua ativação acontece pelo uso consistente na **assinatura manuscrita** (legível, levemente ascendente, sem traços cortantes) e na presença digital e profissional.`,
  },
  {
    slug: 'tensao-vibracional',
    term: 'Tensão Vibracional',
    category: 'assinatura',
    aliases: ['Tensão Vibracional', 'Tensões Vibracionais', 'atrito vibracional'],
    relatedNumber: null,
    tags: ['Compatibilidade', 'Expressão × Destino', 'Ajuste'],
    relatedSlugs: ['harmonizacao-do-nome', 'numero-de-expressao', 'numero-de-destino'],
    shortSummary:
      'Quando o número do nome (Expressão) entra em atrito com o número da data (Destino). Desconta 18 pontos da nota.',
    definitionMarkdown: `### O que significa estar em Tensão Vibracional

O sistema compara o **Número de Expressão** do nome com o **Número de Destino** da data, usando uma tabela fixa de harmonização. Para cada Destino, alguns números são favoráveis, outros neutros e outros em tensão (ex.: Destino 1 com Expressão 6). É o pior dos três resultados e desconta 18 pontos da nota.

### Como isso se resolve

Não é uma sentença. O Destino não muda, mas a Expressão sim: um sobrenome a menos ou um acento sutil podem levar o nome para um número Harmônico com o seu Destino, sem criar bloqueios.`,
  },
  {
    slug: 'assinatura-magnetica',
    term: 'Assinatura Magnética (Nome Social)',
    category: 'assinatura',
    aliases: [
      'Assinatura Magnética',
      'Nova Assinatura',
      'Manual de Assinatura',
      'Guia de Implementação',
    ],
    relatedNumber: null,
    tags: ['Assinatura', 'Ativação', 'Prática Diária'],
    relatedSlugs: ['harmonizacao-do-nome', 'numero-de-missao', 'estrela-cabalistica'],
    shortSummary:
      'Forma escrita escolhida após o estudo cabalístico para ativar cotidianamente a nova frequência em contratos, redes sociais e comunicação.',
    definitionMarkdown: `### Como validar formalmente sua assinatura

Toda assinatura sugerida é avaliada por **4 critérios objetivos de escrita** (sem uso de técnicas subjetivas):
- **Legibilidade clara** dos elementos escolhidos.
- **Inclinação levemente ascendente**, simbolizando movimento de expansão.
- **Ausência de traços cortantes** que cruzem sobre as próprias letras do nome.
- **Estética equilibrada**, mantendo proporção harmônica na pauta.

### Como colocar em prática

Use o novo nome social nos perfis digitais, e-mails, cartões e pratique o traçado diário da nova assinatura conforme o plano passo a passo do seu relatório.`,
  },

  // ── 6. ARCANOS & GEOMETRIA ────────────────────────────────────────────────
  {
    slug: 'arcano-regente',
    term: 'Arcano Regente',
    category: 'arcanos',
    aliases: ['Arcano Regente', 'Arcano do Vértice', 'vértice do triângulo'],
    relatedNumber: 21,
    tags: ['Arcanos', 'Triângulos', 'Síntese'],
    relatedSlugs: ['arcano-de-transito', 'triangulo-da-vida', 'triangulo-do-destino'],
    shortSummary:
      'Número final no vértice inferior do triângulo numerológico; sintetiza a energia dominante que rege o conjunto do nome naquela dimensão.',
    definitionMarkdown: `### O ápice invertido da pirâmide

Após todas as reduções da base do nome até sobrar um par ou dígito final entre **1 e 22** (ou correspondência maior tradicional), encontra-se o **Arcano Regente** — o arquétipo síntese daquela pirâmide.

### Aplicação prática

Enquanto os números centrais mostram talentos e motivações, o Arcano Regente descreve o "clima" estrutural que acompanha sua atuação ao longo da vida.`,
  },
  {
    slug: 'arcano-de-transito',
    term: 'Arcano de Trânsito',
    category: 'arcanos',
    aliases: [
      'Arcano de Trânsito',
      'Arcanos de Trânsito',
      'Sequência de Passagem',
    ],
    relatedNumber: null,
    tags: ['Arcanos', 'Ciclos Temporais', 'Passagem'],
    relatedSlugs: ['arcano-regente', 'triangulo-da-vida', 'triangulo-do-destino'],
    shortSummary:
      'Pares consecutivos lidos nos degraus dos triângulos que indicam as fases cronológicas e lições predominantes em cada período da vida.',
    definitionMarkdown: `### Cronologia vibracional do nome

A leitura da **Sequência de Passagem** nos degraus dos triângulos mostra os **Arcanos de Trânsito** que influenciam cada intervalo de idade, revelando momentos mais propícios para expansão, reorganização estrutural ou colheita.`,
  },
  {
    slug: 'estrela-cabalistica',
    term: 'Estrela Cabalística (5 Pontas)',
    category: 'arcanos',
    aliases: ['Estrela Cabalística', 'Estrela de 5 Pontas', 'Mapa de Alinhamento'],
    relatedNumber: 5,
    tags: ['Geometria', '5 Números', 'Equilíbrio'],
    relatedSlugs: [
      'numero-de-expressao',
      'numero-de-destino',
      'numero-de-motivacao',
      'numero-de-missao',
      'numero-de-personalidade',
    ],
    shortSummary:
      'Representação integrada das cinco forças centrais do mapa: Expressão, Destino, Motivação, Impressão/Missão e Personalidade.',
    definitionMarkdown: `### Visão panorâmica das 5 pontas

A **Estrela Cabalística** reúne os cinco pilares vibracionais do mapa em equilíbrio visual:
1. **Expressão** — o que você realiza com o nome completo.
2. **Destino** — o chamado da data de nascimento.
3. **Motivação (Alma)** — o propósito interno das vogais.
4. **Missão / Impressão** — a presença externa das consoantes.
5. **Personalidade** — o trato diário do primeiro nome.

Quando todas as pontas sustentam o centro sem bloqueios nem excessos, a pontuação global atinge níveis elevados de fluidez magnética.`,
  },
];

// DEV-306: verbetes dos termos do sistema (cálculo, nota, sugestões e produtos).
export const CANONICAL_GLOSSARY_TERMS: GlossaryTermEntry[] = [...TERMOS_BASE, ...TERMOS_DO_SISTEMA];

const SLUG_MAP = new Map(CANONICAL_GLOSSARY_TERMS.map((item) => [item.slug, item]));

export function getCanonicalGlossaryBySlug(slug: string): GlossaryTermEntry | undefined {
  return SLUG_MAP.get(slug);
}

/**
 * Infere categoria editorial com base em slug, título ou tags quando o registro vem
 * exclusivamente do banco (`public.glossary_terms`).
 */
export function inferGlossaryCategory(
  slug: string,
  term: string,
  tags?: string[] | null,
): GlossaryCategory {
  const canonical = SLUG_MAP.get(slug);
  if (canonical) return canonical.category;

  const haystack = `${slug} ${term} ${(tags ?? []).join(' ')}`.toLowerCase();
  if (haystack.includes('bloqueio') || /-[1-9]{3}$/.test(slug)) return 'bloqueios';
  if (haystack.includes('triangulo') || haystack.includes('triângulo') || haystack.includes('pirâmide')) {
    return 'triangulos';
  }
  if (
    haystack.includes('karma') ||
    haystack.includes('karmic') ||
    haystack.includes('kármic') ||
    haystack.includes('licao') ||
    haystack.includes('lição') ||
    haystack.includes('tendencia') ||
    haystack.includes('tendência') ||
    haystack.includes('debito') ||
    haystack.includes('débito')
  ) {
    return 'karma';
  }
  if (
    haystack.includes('assinatura') ||
    haystack.includes('harmoniz') ||
    haystack.includes('tensao') ||
    haystack.includes('tensão') ||
    haystack.includes('nome social')
  ) {
    return 'assinatura';
  }
  if (haystack.includes('arcano') || haystack.includes('estrela') || haystack.includes('geometria')) {
    return 'arcanos';
  }
  return 'numeros';
}

/**
 * Gera resumo limpo (1–2 frases) a partir de markdown quando o registro vem do banco.
 */
export function extractSummaryFromMarkdown(markdown: string, maxLength = 190): string {
  const cleaned = (markdown || '')
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'Conceito fundamental da Numerologia Cabalística aplicada ao diagnóstico e harmonização de nomes.';
  }
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength - 1).trim();
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}
