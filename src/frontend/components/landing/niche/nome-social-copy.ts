import type { NichePageCopy } from './niche-types';

/**
 * Textos provisórios da página `/nome-social` (`DEV-339`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 */
export const NOME_SOCIAL_COPY: NichePageCopy = {
  id: 'social',
  route: '/nome-social',
  ctaHref: '/app/analise/nome-social?caminho=dia_a_dia',
  seo: {
    title: 'Harmonização de Assinatura e Nome Social',
    description:
      'Compare seu nome de nascimento com variações de nome social sem bloqueios no Triângulo da Vida cabalístico. Veja nota de 0 a 100 e baixe seu PDF completo.',
    keywords:
      'nome social numerologia, harmonização de assinatura, assinatura numerológica, nome sem bloqueios, numerologia cabalística nome, triângulo da vida',
    productName: 'Nome Social: Harmonização de Assinatura',
    productDescription:
      'Análise de numerologia cabalística com Triângulo da Vida, arquétipo, 5 números principais, diagnóstico de bloqueios e variações de assinatura harmonizada com PDF.',
  },
  hero: {
    eyebrow: 'Nome Social · Assinatura do Dia a Dia', // [TEXTO]
    titleLead: 'Harmonize sua assinatura', // [TEXTO]
    titleHighlight: 'e elimine os bloqueios do seu nome no dia a dia', // [TEXTO]
    description:
      'Você informa sua certidão e onde mais usa o nome. Calculamos o Triângulo da Vida cabalístico e entregamos variações próximas com nota de 0 a 100 e zero bloqueios para adotar sem mudar documentos.', // [TEXTO]
    primaryCtaLabel: 'Iniciar Harmonização do Meu Nome', // [TEXTO]
    primaryCtaId: 'nome_social_hero_chat',
    secondaryCtaLabel: 'Ver Minha Nota Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Análise na hora · Pagamento único por ciclo de 30 dias · Sem mudança em cartório', // [TEXTO]
    sceneSrSummary:
      'Prévia animada do atendimento no caminho Harmonizar o meu nome respondendo onde assina, estilo de presença e nível de mudança até exibir sugestões sem bloqueios.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que Perguntamos', // [TEXTO]
    title: 'Poucas perguntas para calibrar a assinatura ao seu uso real', // [TEXTO]
    description:
      'Em vez de gerar nomes soltos, o sistema entende como você assina hoje e até onde quer ajustar seu nome social.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'Onde o nome circula mais', // [TEXTO]
        description: 'Trabalho, redes sociais, e-mails, assinaturas digitais ou projetos autorais.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Quanto quer mudar', // [TEXTO]
        description: 'Escolha entre ajustes sutis de grafia, abreviação de sobrenome ou nome composto.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Momento e prioridade', // [TEXTO]
        description: 'Priorize comunicação, foco, liderança ou equilíbrio conforme sua fase atual.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Antes × depois nos 5 números e no Triângulo da Vida', // [TEXTO]
    description:
      'Cada letra vira número segundo a tabela cabalística. Você enxerga onde havia bloqueio e como a nova grafia reorganiza sua vibração.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela Cabalística', // [TEXTO]
      title: 'Os 5 números fundamentais em paralelo', // [TEXTO]
      description: 'Compare Destino, Expressão, Motivação, Missão e Impressão entre o nome de nascimento e o nome harmonizado.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística mostrando a evolução da nota do nome de nascimento para a assinatura harmonizada.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Triângulo da Vida (Antes × Depois)', // [TEXTO]
      title: 'Sequências repetidas zeradas na prática', // [TEXTO]
      description: 'Os bloqueios em vermelho são eliminados no Triângulo da Vida mantendo o Arcano Regente na ponta.', // [TEXTO]
      srSummary: 'Animação do Triângulo da Vida mostrando linhas descendo, bloqueio destacado em vermelho e troca para nome sem bloqueios.', // [TEXTO]
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Você Recebe', // [TEXTO]
    title: 'Três assinaturas sem bloqueios ranqueadas com nota clara', // [TEXTO]
    description:
      'Cada sugestão mostra o score de 0 a 100, a compatibilidade Expressão × Destino (sempre objetiva) e o selo de zero bloqueios.', // [TEXTO]
    srSummary: 'Cena com três cards de sugestões de nome social entrando em sequência com nota colorida e selo zero bloqueios.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'PDF completo + guia prático de implementação', // [TEXTO]
    description:
      'Leve a leitura detalhada do seu mapa atual, comparativo antes × depois, lições kármicas, tendências ocultas e plano simples de adoção da assinatura.', // [TEXTO]
    highlights: [
      'Triângulo da Vida e arquétipo do nome, com leituras complementares', // [TEXTO]
      'Comparativo de compatibilidade Expressão × Destino', // [TEXTO]
      'Critérios objetivos para treinar e aplicar sua nova assinatura', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do relatório em PDF no tema dourado de Nome Social.', // [TEXTO]
  },
  notice: null,
  faq: [
    {
      question: 'Preciso alterar meu nome em cartório ou documentos?', // [TEXTO]
      answer:
        'Não. O Nome Social harmonizado é usado em assinaturas, redes sociais, apresentações profissionais, e-mails e cartões, sem exigir alteração registral.', // [TEXTO]
    },
    {
      question: 'Quantos nomes posso avaliar durante o acesso?', // [TEXTO]
      answer:
        'Você acessa os resultados na hora dentro do ciclo de 30 dias em pagamento único e recebe rodadas de sugestões além de poder comparar variações escolhidas.', // [TEXTO]
    },
    {
      question: 'As sugestões têm bloqueios?', // [TEXTO]
      answer:
        'Sim. Toda sugestão gerada pelo sistema passa pela verificação de zero sequências repetidas (>= 3 dígitos iguais), começando pelo Triângulo da Vida.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Comece Na Hora', // [TEXTO]
    title: 'Abra o chat já no caminho de Nome Social', // [TEXTO]
    description:
      'Confirme seus dados de nascimento e receba opções de assinatura harmonizada com nota de 0 a 100 em minutos.', // [TEXTO]
    ctaLabel: 'Ir para o Chat de Nome Social', // [TEXTO]
    ctaId: 'nome_social_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
