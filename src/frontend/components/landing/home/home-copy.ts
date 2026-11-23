/**
 * Textos provisórios da nova Home (`DEV-338`) centralizados por seção.
 * Todo bloco marcado com `// [TEXTO]` é marcador provisório para revisão de Marketing/Growth
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
    eyebrow: 'Numerologia Cabalística · 4 Triângulos', // [TEXTO]
    titleLead: 'Descubra o potencial do seu nome', // [TEXTO]
    titleHighlight: 'e elimine os bloqueios da sua assinatura', // [TEXTO]
    subtitle:
      'Calculamos sua nota de 0 a 100 nos 4 triângulos cabalísticos e entregamos opções personalizadas sem bloqueios para você usar na vida social, no palco ou na escolha do nome do bebê.', // [TEXTO]
    buttons: [
      {
        id: 'hero-social',
        theme: 'social' as const,
        label: 'Harmonizar Nome Social', // [TEXTO]
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
        label: 'Nome do Meu Bebê', // [TEXTO]
        href: HOME_PATH_URLS.bebe,
        ctaId: 'home_hero_nome_bebe',
        variant: 'secondary' as const,
      },
    ],
    freeLinkLabel: 'Ou veja a nota do seu nome grátis agora →', // [TEXTO]
    freeLinkHref: HOME_PATH_URLS.analiseGratuita,
    trustLine:
      'Acesso imediato · Resultado na hora · Pagamento único por ciclo de 30 dias · Sem mudança em cartório', // [TEXTO]
    heroSceneSummary:
      'Prévia animada do atendimento escolhendo Harmonizar o meu nome, respondendo duas perguntas rápidas, revelando três assinaturas sem bloqueios e finalizando na Estrela Cabalística comparativa de 58 para 93.', // [TEXTO]
  },

  // [TEXTO] Seção 2 — Para quem é
  audiences: {
    eyebrow: 'Para Quem É', // [TEXTO]
    title: 'Um caminho para cada momento do seu nome', // [TEXTO]
    description:
      'Escolha como quer usar o cálculo cabalístico hoje: renovar a assinatura do dia a dia, construir um nome marcante de palco ou escolher o nome do bebê sem bloqueios.', // [TEXTO]
    cards: [
      {
        id: 'social' as const,
        badge: 'Vida Pessoal & Trabalho', // [TEXTO]
        title: 'Nome Social', // [TEXTO]
        description:
          'Compare seu nome de nascimento com variações sem bloqueios para usar em assinaturas, redes e projetos sem mudar documentos.', // [TEXTO]
        highlights: ['4 triângulos analisados', 'Mudanças sutis ou novos nomes', 'Guia de assinatura de 30 dias'], // [TEXTO]
        ctaLabel: 'Explorar Nome Social', // [TEXTO]
        href: HOME_PATH_URLS.social,
        ctaId: 'home_audience_social',
      },
      {
        id: 'artistico' as const,
        badge: 'Palco, Redes & Marca', // [TEXTO]
        title: 'Nome Artístico', // [TEXTO]
        description:
          'Encontre nomes próximos do seu ou totalmente novos com alta afinidade numérica para sua área de atuação e presença de público.', // [TEXTO]
        highlights: ['Afinidade número × área', 'Nomes próximos e totalmente novos', 'Presença de palco sem bloqueios'], // [TEXTO]
        ctaLabel: 'Criar Nome Artístico', // [TEXTO]
        href: HOME_PATH_URLS.artistico,
        ctaId: 'home_audience_artistico',
      },
      {
        id: 'bebe' as const,
        badge: 'Família & Nascimento', // [TEXTO]
        title: 'Nome do Bebê', // [TEXTO]
        description:
          'Cruze o sobrenome da família com a data prevista para avaliar nomes candidatos e enxergar os dias mais harmônicos da janela.', // [TEXTO]
        highlights: ['Cruzamento com janela do parto', 'Avaliação dos nomes em mente', 'Manual acolhedor em PDF'], // [TEXTO]
        ctaLabel: 'Escolher Nome do Bebê', // [TEXTO]
        href: HOME_PATH_URLS.bebe,
        ctaId: 'home_audience_bebe',
      },
    ],
  },

  // [TEXTO] Seção 3 — Como funciona
  howItWorks: {
    eyebrow: 'Como Funciona', // [TEXTO]
    title: 'Do seu objetivo às opções prontas em três passos', // [TEXTO]
    description:
      'Você responde poucas perguntas no próprio sistema, compara variações já filtradas pela regra dos 0 bloqueios e baixa o relatório em PDF na hora.', // [TEXTO]
    steps: [
      {
        number: '01',
        title: 'Escolha o caminho no sistema', // [TEXTO]
        description:
          'Informe se quer harmonizar sua assinatura social, criar um nome artístico ou analisar opções para o seu bebê.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Receba nomes com nota e zero bloqueios', // [TEXTO]
        description:
          'Cada sugestão mostra a nota de 0 a 100, a relação Expressão × Destino e confirma que não há sequências repetidas.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Baixe o relatório completo em PDF', // [TEXTO]
        description:
          'Leve os 4 triângulos, a leitura dos 5 números principais, a comparação antes × depois e o guia prático para usar no dia a dia.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 4 — O que o cálculo analisa
  analysis: {
    eyebrow: 'Método Objetivo', // [TEXTO]
    title: 'O que o cálculo analisa em cada nome', // [TEXTO]
    description:
      'Critérios formais e reproduzíveis da numerologia cabalística: os 5 números principais, o Triângulo da Vida com seus bloqueios e a nota comparativa.', // [TEXTO]
    blocks: [
      {
        id: 'star' as const,
        badge: '01 · 5 Números Fundamentais', // [TEXTO]
        title: 'Destino, Expressão, Motivação, Impressão e Missão', // [TEXTO]
        description:
          'Colocamos o mapa do seu nome atual e o potencial do novo nome frente a frente para você enxergar exatamente o que muda quando ajusta a assinatura.', // [TEXTO]
      },
      {
        id: 'triangle' as const,
        badge: '02 · Triângulo da Vida & 4 Triângulos', // [TEXTO]
        title: 'Onde nascem os bloqueios e qual Arcano rege a ponta', // [TEXTO]
        description:
          'Cada letra vira número e desce somando em pares até a ponta. Sequências repetidas (como 222 ou 444) acendem em vermelho para serem eliminadas nas sugestões.', // [TEXTO]
      },
      {
        id: 'score' as const,
        badge: '03 · Escala de 0 a 100', // [TEXTO]
        title: 'Nota transparente separando data e assinatura', // [TEXTO]
        description:
          'Mostramos a nota de hoje e até onde ela pode chegar, destacando a faixa de equilíbrio de forma visual e simples de acompanhar.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 5 — Regra de qualidade
  qualityRule: {
    eyebrow: 'Filtro Rigoroso', // [TEXTO]
    title: 'Nossa regra de qualidade em toda sugestão entregue', // [TEXTO]
    description:
      'Nenhuma variação aparece por acaso: toda sugestão exibida no seu resultado passa primeiro por duas travas objetivas.', // [TEXTO]
    metrics: [
      {
        id: 'zero-blocks' as const,
        valueTarget: 0,
        valueSuffix: '',
        label: 'Bloqueios nos nomes novos', // [TEXTO]
        detail: 'Zero sequências repetidas (>= 3 números iguais) nos 4 triângulos sugeridos.', // [TEXTO]
      },
      {
        id: 'min-score' as const,
        valueTarget: 80,
        valueSuffix: '+',
        label: 'Nota nos nomes novos', // [TEXTO]
        detail: 'Sugestões ranqueadas acima do nome atual e com foco em compatibilidade favorável.', // [TEXTO]
      },
    ],
  },

  // [TEXTO] Seção 6 — O que você leva
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'Relatório em PDF feito para o seu caminho', // [TEXTO]
    description:
      'Veja ao vivo como as páginas do relatório mudam entre Nome Social, Nome Artístico e Nome do Bebê mantendo o cálculo detalhado pronto para consulta.', // [TEXTO]
    tabs: [
      { id: 'social' as const, label: 'Nome Social' }, // [TEXTO]
      { id: 'artistico' as const, label: 'Nome Artístico' }, // [TEXTO]
      { id: 'bebe' as const, label: 'Nome do Bebê' }, // [TEXTO]
    ],
    autoCycleLabel: 'Troca automática', // [TEXTO]
  },

  // [TEXTO] Seção 7 — Análise gratuita
  freeAnalysis: {
    eyebrow: 'Diagnóstico Gratuito', // [TEXTO]
    title: 'Veja a nota do seu nome de hoje e até onde ele pode chegar', // [TEXTO]
    description:
      'Preencha seus dados para receber seu PDF gratuito com a nota atual, o potencial máximo da assinatura, bloqueios no Triângulo da Vida e lições kármicas.', // [TEXTO]
    sideEyebrow: 'Exemplo de evolução', // [TEXTO]
    sideTitle: 'Até onde a nota pode chegar', // [TEXTO]
    sideDescription:
      'Ajustes sutis na forma de assinar costumam elevar a nota de uma faixa em atenção para a zona harmoniosa sem alterar o registro civil.', // [TEXTO]
  },

  // [TEXTO] Item extra da Seção 8 — Usos do nome (palco e redes)
  useCasesStage: {
    id: 'palco-e-redes',
    stepNumber: '05',
    eyebrow: '05 · Palco, Shows e Redes', // [TEXTO]
    title: 'Nome Artístico em Capas, Créditos e Bios', // [TEXTO]
    description:
      'Para música, vídeo, teatro ou presença pública, seu nome artístico aparece com consistência em lançamentos, materiais de imprensa e perfis sociais — mantendo seu nome civil nos contratos.', // [TEXTO]
    bulletPoints: [
      'Capas de singles, vídeos, créditos e divulgação de eventos', // [TEXTO]
      'Padronização entre nome de palco, @ nas redes e links oficiais', // [TEXTO]
      'Nome civil preservado para contratos e registros formais', // [TEXTO]
    ],
  },
} as const;
