/**
 * Textos da Home (`DEV-338`, copy revisada em `DEV-342`) centralizados por seção.
 * Todo bloco marcado com `// [TEXTO]` pode ser ajustado por Marketing/Growth
 * sem precisar alterar layout nem animações.
 */

export const HOME_PATH_URLS = {
  social: '/nome-social',
  artistico: '/nome-artistico',
  bebe: '/nome-bebe',
  analiseGratuita: '#analise-gratuita',
} as const;

export const HOME_COPY = {
  // [TEXTO] Seção 1 — Hero
  hero: {
    eyebrow: 'Numerologia Cabalística · Um chat, três caminhos', // [TEXTO]
    titleLead: 'Descubra a nota do seu nome', // [TEXTO]
    titleHighlight: 'e receba versões sem bloqueios', // [TEXTO]
    subtitle:
      'Um único chat pergunta o que você quer hoje e conduz o resto: harmonizar o nome que você já usa, criar um nome artístico ou escolher o nome do bebê. O sistema calcula o Triângulo da Vida pela Numerologia Cabalística e só sugere nomes sem bloqueios, cada um com nota de 0 a 100.', // [TEXTO]
    buttons: [
      {
        id: 'hero-social',
        theme: 'social' as const,
        label: 'Harmonizar Meu Nome', // [TEXTO]
        href: HOME_PATH_URLS.social,
        ctaId: 'home_hero_nome_social',
        variant: 'primary' as const,
      },
      {
        id: 'hero-artistico',
        theme: 'artistico' as const,
        label: 'Criar Nome Artístico', // [TEXTO]
        href: HOME_PATH_URLS.artistico,
        ctaId: 'home_hero_nome_artistico',
        variant: 'secondary' as const,
      },
      {
        id: 'hero-bebe',
        theme: 'bebe' as const,
        label: 'Escolher o Nome do Bebê', // [TEXTO]
        href: HOME_PATH_URLS.bebe,
        ctaId: 'home_hero_nome_bebe',
        variant: 'secondary' as const,
      },
    ],
    freeLinkLabel: 'Ou veja grátis a nota do seu nome agora →', // [TEXTO]
    freeLinkHref: HOME_PATH_URLS.analiseGratuita,
    trustLine:
      'Acesso imediato · Pagamento único por 30 dias · Garantia de 7 dias · Sem mudar o nome em cartório', // [TEXTO]
    heroSceneSummary:
      'Prévia animada do atendimento escolhendo Harmonizar o meu nome, respondendo duas perguntas rápidas, revelando três assinaturas sem bloqueios e finalizando na Estrela Cabalística comparativa de 58 para 93.', // [TEXTO]
  },

  // [TEXTO] Seção 2 — Para quem é
  audiences: {
    eyebrow: 'Um Chat, Três Caminhos', // [TEXTO]
    title: 'Qual é o momento do seu nome hoje?', // [TEXTO]
    description:
      'Você não precisa entender de numerologia nem preencher formulário longo. Escolha o seu objetivo e o chat faz as perguntas certas para o seu caso, até chegar aos nomes já calculados.', // [TEXTO]
    cards: [
      {
        id: 'social' as const,
        badge: 'Assinatura, Redes & Trabalho', // [TEXTO]
        title: 'Nome Social', // [TEXTO]
        description:
          'Harmonize o nome que você já usa para assinar e se apresentar nas redes, em e-mails, propostas e projetos. Você recebe 3 sugestões, pode gerar mais 6 e ainda testar até 5 ideias suas, calculadas na hora.', // [TEXTO]
        highlights: ['3 sugestões + 6 extras quando quiser', 'Teste até 5 nomes seus', 'Guia para adotar a nova assinatura'], // [TEXTO]
        ctaLabel: 'Harmonizar Meu Nome', // [TEXTO]
        href: HOME_PATH_URLS.social,
        ctaId: 'home_audience_social',
      },
      {
        id: 'artistico' as const,
        badge: 'Palco, Telas & Autoria', // [TEXTO]
        title: 'Nome Artístico', // [TEXTO]
        description:
          'Para quem canta, atua, cria conteúdo, escreve, faz drag, humor ou produção musical. Receba até 3 nomes próximos do seu nome de nascimento e até 3 totalmente novos, ordenados pela afinidade do número com a sua área.', // [TEXTO]
        highlights: ['3 próximos + 3 totalmente novos', 'Afinidade número × área', 'Nomes novos só com nota 80+'], // [TEXTO]
        ctaLabel: 'Criar Meu Nome Artístico', // [TEXTO]
        href: HOME_PATH_URLS.artistico,
        ctaId: 'home_audience_artistico',
      },
      {
        id: 'bebe' as const,
        badge: 'Família & Chegada', // [TEXTO]
        title: 'Nome do Bebê', // [TEXTO]
        description:
          'Ainda sem a data exata do parto? A Janela de Datas calcula cada nome nos 29 dias possíveis e mostra em quantos deles ele fica bom. Os nomes que vocês já estão pensando também entram na análise.', // [TEXTO]
        highlights: ['Janela de Datas: 29 dias calculados', 'Seus nomes favoritos analisados', 'Manual em PDF para os pais'], // [TEXTO]
        ctaLabel: 'Escolher o Nome do Bebê', // [TEXTO]
        href: HOME_PATH_URLS.bebe,
        ctaId: 'home_audience_bebe',
      },
    ],
  },

  // [TEXTO] Seção 3 — Como funciona
  howItWorks: {
    eyebrow: 'Como Funciona', // [TEXTO]
    title: 'Do seu objetivo aos nomes calculados em três passos', // [TEXTO]
    description:
      'Sem formulário longo e sem precisar saber o que perguntar. Você conversa, o sistema calcula e você compara as opções na tela antes de baixar o relatório.', // [TEXTO]
    steps: [
      {
        number: '01',
        title: 'Diga ao chat o que você quer', // [TEXTO]
        description:
          'Harmonizar o seu nome, criar um nome artístico ou escolher o nome do bebê. A partir daí cada pergunta é feita para o seu caminho, e você pode voltar uma resposta sem perder o resto.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Compare nomes já filtrados', // [TEXTO]
        description:
          'Você vê primeiro as 3 sugestões mais bem pontuadas para o seu perfil, com nota de 0 a 100 e a relação entre Expressão e Destino. Quer mais opções? Gere novas ou teste os nomes que você mesmo imaginou.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Baixe o relatório em PDF', // [TEXTO]
        description:
          'Leve o Triângulo da Vida, o arquétipo, a leitura dos 5 números principais, a comparação antes × depois e o guia prático para usar no dia a dia.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 4 — O que o cálculo analisa
  analysis: {
    eyebrow: 'Método Objetivo', // [TEXTO]
    title: 'O que o cálculo analisa em cada nome', // [TEXTO]
    description:
      'Critérios formais e reproduzíveis da Numerologia Cabalística. Cada letra tem um valor fixo, então o mesmo nome com a mesma data sempre recebe a mesma nota.', // [TEXTO]
    blocks: [
      {
        id: 'star' as const,
        badge: '01 · 5 Números Fundamentais', // [TEXTO]
        title: 'Destino, Expressão, Motivação, Impressão e Missão', // [TEXTO]
        description:
          'O mapa do seu nome atual e o do novo nome lado a lado. Você enxerga, número por número, o que muda quando ajusta a forma de escrever e assinar.', // [TEXTO]
      },
      {
        id: 'triangle' as const,
        badge: '02 · Triângulo da Vida', // [TEXTO]
        title: 'Onde nascem os bloqueios e qual Arcano rege a ponta', // [TEXTO]
        description:
          'Cada letra vira número e os pares se somam, linha a linha, até a ponta. Sequências de três números iguais, como 222 ou 444, são os bloqueios: acendem em vermelho e nenhuma sugestão do sistema sai com eles.', // [TEXTO]
      },
      {
        id: 'score' as const,
        badge: '03 · Escala de 0 a 100', // [TEXTO]
        title: 'Sua nota de hoje e até onde ela pode chegar', // [TEXTO]
        description:
          'Partimos do seu nome de nascimento e testamos variações. Cada uma recebe uma nota de 0 a 100, com a cor da faixa, até chegar à melhor opção sem bloqueios.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 5 — Regra de qualidade
  qualityRule: {
    eyebrow: 'Filtro Rigoroso', // [TEXTO]
    title: 'Nenhum nome chega até você por acaso', // [TEXTO]
    description:
      'Antes de aparecer na sua tela, toda sugestão do sistema passa por duas travas objetivas. O que não passa, você nem chega a ver.', // [TEXTO]
    metrics: [
      {
        id: 'zero-blocks' as const,
        valueTarget: 0,
        valueSuffix: '',
        label: 'Bloqueios nos nomes novos', // [TEXTO]
        detail: 'Zero sequências repetidas (>= 3 números iguais) no Triângulo da Vida dos nomes sugeridos.', // [TEXTO]
      },
      {
        id: 'min-score' as const,
        valueTarget: 80,
        valueSuffix: '+',
        label: 'Nota dos nomes novos', // [TEXTO]
        detail: 'Nomes totalmente novos só aparecem com nota 80 ou mais. Variações do nome de nascimento partem de 70.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 6 — O que você leva
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'Um relatório em PDF feito para o seu caminho', // [TEXTO]
    description:
      'O Nome Social traz o antes e depois da sua assinatura, o Artístico traz a leitura para o palco e o do Bebê é um manual afetivo para os pais. Veja as páginas mudando ao vivo.', // [TEXTO]
    tabs: [
      { id: 'social' as const, label: 'Nome Social' }, // [TEXTO]
      { id: 'artistico' as const, label: 'Nome Artístico' }, // [TEXTO]
      { id: 'bebe' as const, label: 'Nome do Bebê' }, // [TEXTO]
    ],
  },

  // [TEXTO] Seção 7 — Análise gratuita
  freeAnalysis: {
    eyebrow: 'Comece de Graça', // [TEXTO]
    title: 'Descubra grátis a nota do seu nome e até onde ela pode chegar', // [TEXTO]
    description:
      'Digite seu nome de nascimento e sua data. Você vê a nota na hora e recebe por e-mail um PDF gratuito com o Triângulo da Vida, os bloqueios encontrados, as suas lições kármicas e o potencial da sua assinatura. Sem cartão.', // [TEXTO]
    sideEyebrow: 'O que chega no seu e-mail', // [TEXTO]
    sideTitle: 'Seu PDF gratuito, página por página', // [TEXTO]
    sideDescription:
      'Capa, o mapa do seu nome em 1 página e a leitura de como você está hoje, no mesmo layout do relatório completo.', // [TEXTO]
  },

  // [TEXTO] Item extra da Seção 8 — Usos do nome (palco e redes)
  useCasesStage: {
    id: 'palco-e-redes',
    stepNumber: '05',
    eyebrow: '05 · Palco, Shows e Redes', // [TEXTO]
    title: 'Nome Artístico em Capas, Créditos e Bios', // [TEXTO]
    description:
      'Na música, no vídeo, no teatro ou nos livros, o nome artístico aparece igual em lançamentos, materiais de imprensa e perfis sociais. O nome civil continua valendo nos contratos.', // [TEXTO]
    bulletPoints: [
      'Capas de singles, vídeos, créditos e divulgação de eventos', // [TEXTO]
      'O mesmo nome no palco, no @ das redes e nos links oficiais', // [TEXTO]
      'Nome civil preservado para contratos e registros formais', // [TEXTO]
    ],
  },
} as const;
