import type { NichePageCopy } from './niche-types';

/**
 * Textos provisórios da página `/nome-artistico` (`DEV-339`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 */
export const NOME_ARTISTICO_COPY: NichePageCopy = {
  id: 'artistico',
  route: '/nome-artistico',
  ctaHref: '/app/analise/nome-social?caminho=artistico',
  seo: {
    title: 'Nome Artístico por Numerologia Cabalística',
    description:
      'Crie um nome artístico marcante, sem bloqueios, com o arquétipo certo para a sua persona e afinidade numérica para palco, música, vídeo e redes sociais.',
    keywords:
      'nome artístico numerologia, criar nome artístico, nome de palco numerologia, pseudônimo cabalístico, nome para criador de conteúdo',
    productName: 'Nome Artístico: Presença de Palco e Marca',
    productDescription:
      'Geração e análise cabalística de nomes artísticos próximos ao seu nome ou totalmente novos, com afinidade por área e zero bloqueios.',
  },
  hero: {
    eyebrow: 'Nome Artístico · Palco, Shows & Redes', // [TEXTO]
    titleLead: 'Construa um nome artístico', // [TEXTO]
    titleHighlight: 'com magnetismo de palco e zero bloqueios', // [TEXTO]
    description:
      'Informe sua área de atuação, o estilo de palco e a imagem que quer transmitir. Comparamos opções próximas ao seu nome e nomes totalmente novos com alta nota e o arquétipo que o seu nome projeta no palco.', // [TEXTO]
    primaryCtaLabel: 'Criar Meu Nome Artístico Agora', // [TEXTO]
    primaryCtaId: 'nome_artistico_hero_chat',
    secondaryCtaLabel: 'Ver Minha Nota Atual Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Análise na hora · Pagamento único por ciclo de 30 dias · Preserva seu nome civil em contratos', // [TEXTO]
    sceneSrSummary:
      'Prévia animada do atendimento escolhendo Nome Artístico, área de atuação, estilo de presença e exibindo variações Próximos e Novos.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que Perguntamos', // [TEXTO]
    title: 'Mapeamos sua área artística e o impacto visual antes de sugerir', // [TEXTO]
    description:
      'O cálculo cruza sua data de nascimento com o nicho artístico para entregar sonoridade forte e vibração favorável.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'Área artística', // [TEXTO]
        description: 'Música, atuação, artes visuais, literatura, criação digital ou apresentação.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Estilo e sonoridade', // [TEXTO]
        description: 'Nome curto de impacto, composto memorável ou variação direta do seu sobrenome.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Imagem de palco', // [TEXTO]
        description: 'Autoridade, proximidade com o público, sofisticação ou energia expansiva.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Estrela Cabalística e afinidade número × área artística', // [TEXTO]
    description:
      'Além de zerar bloqueios no Triângulo da Vida, mostramos o arquétipo que o seu nome projeta e o alinhamento entre Expressão, Destino e sua área de atuação.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela Comparativa', // [TEXTO]
      title: 'Da identidade civil à presença de palco', // [TEXTO]
      description: 'Enxergue a passagem do seu mapa atual para um nome artístico com Expressão forte para público.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística comparando o mapa original e o nome artístico sugerido.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Afinidade Número × Área', // [TEXTO]
      title: 'Vibrações que potencializam cada palco', // [TEXTO]
      description: 'Referências objetivas de como os números de Expressão dialogam com diferentes frentes criativas.', // [TEXTO]
      srSummary: 'Quadro informativo com afinidade entre números de Expressão e áreas artísticas.', // [TEXTO]
      affinityCards: [
        {
          area: 'Música, Shows & Palco', // [TEXTO]
          numbers: 'Expressão 3 · 5 · 1', // [TEXTO]
          summary: 'Favorece carisma vocal, presença cênica e conexão imediata com audiência.', // [TEXTO]
        },
        {
          area: 'Redes, Vídeo & Comunicação', // [TEXTO]
          numbers: 'Expressão 3 · 6 · 9', // [TEXTO]
          summary: 'Estimula didática, estética de marca pessoal e retenção em canais digitais.', // [TEXTO]
        },
        {
          area: 'Direção, Moda & Autoria', // [TEXTO]
          numbers: 'Expressão 8 · 11 · 4', // [TEXTO]
          summary: 'Sustenta posicionamento premium, assinatura autoral e consistência de carreira.', // [TEXTO]
        },
      ],
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Você Recebe', // [TEXTO]
    title: 'Dois blocos prontos: próximos do seu nome e totalmente novos', // [TEXTO]
    description:
      'Compare nomes derivados da sua assinatura atual lado a lado com pseudônimos inéditos, todos livres de bloqueios.', // [TEXTO]
    srSummary: 'Animação dos cards de sugestões de Nome Artístico divididos entre Próximos e Novos.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'Relatório visual para escolher e lançar seu nome artístico', // [TEXTO]
    description:
      'Documento em PDF pronto para salvar, revisar créditos de capa e usar com consistência em plataformas e redes.', // [TEXTO]
    highlights: [
      'Ranking separado entre variações próximas e nomes inéditos', // [TEXTO]
      'Arquétipo do nome, Triângulo da Vida e compatibilidade Expressão × Destino', // [TEXTO]
      'Guia de implementação em bios, @ oficiais e lançamentos', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do relatório em PDF no tema de palco do Nome Artístico.', // [TEXTO]
  },
  notice: {
    eyebrow: 'Aviso Importante Sobre Contratos', // [TEXTO]
    title: 'Nome artístico é uso público e criativo — contratos seguem seu nome civil', // [TEXTO]
    description:
      'Você pode assinar capas, créditos, perfis sociais e divulgações com seu nome artístico sem alterar documentos civis.', // [TEXTO]
    points: [
      'Em contratos formais, notas fiscais, direitos autorais (ECAD/ISRC) e cadastros bancários, mantenha o nome completo do registro civil.', // [TEXTO]
      'Quando fizer sentido jurídico, o nome artístico pode figurar como "conhecido artisticamente como" dentro do contrato.', // [TEXTO]
      'A análise entrega leitura numerológica simbólica e comparativa — sem vínculo jurídico ou necessidade de retificação em cartório.', // [TEXTO]
    ],
  },
  faq: [
    {
      question: 'Posso receber tanto variações do meu nome quanto nomes totalmente novos?', // [TEXTO]
      answer:
        'Sim. No caminho Artístico você pode optar por nomes próximos ao seu sobrenome/primeiro nome ou pseudônimos inéditos filtrados pela sua área.', // [TEXTO]
    },
    {
      question: 'Como funciona para assinaturas em contratos e plataformas digitais?', // [TEXTO]
      answer:
        'Seu nome artístico vai em capas, Spotify, YouTube, Instagram e imprensa. Contratos, pagamentos e registros legais continuam usando seu nome civil.', // [TEXTO]
    },
    {
      question: 'Qual a diferença para o caminho de Nome Social?', // [TEXTO]
      answer:
        'Ambos usam o mesmo rigor cabalístico no Triângulo da Vida, mas o caminho Artístico pergunta área, estilo e imagem de palco para gerar combinações focadas em audiência.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Próximo Passo No Palco', // [TEXTO]
    title: 'Abra o chat já no caminho de Nome Artístico', // [TEXTO]
    description:
      'Responda às 3 escolhas rápidas de estilo e compare na hora suas melhores combinações de palco.', // [TEXTO]
    ctaLabel: 'Ir para o Chat de Nome Artístico', // [TEXTO]
    ctaId: 'nome_artistico_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
