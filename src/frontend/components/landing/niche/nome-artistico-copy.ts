import type { NichePageCopy } from './niche-types';

/**
 * Textos da página `/nome-artistico` (`DEV-339`, copy revisada em `DEV-342`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 * Prova social sem citar artistas nem usar imagem (regra do banco de argumentos de Growth).
 */
export const NOME_ARTISTICO_COPY: NichePageCopy = {
  id: 'artistico',
  route: '/nome-artistico',
  ctaHref: '/app/analise/nome-social?caminho=artistico',
  seo: {
    title: 'Nome Artístico pela Numerologia Cabalística',
    description:
      'Crie seu nome artístico pela Numerologia Cabalística: até 3 nomes próximos do seu e 3 totalmente novos, sem bloqueios e com afinidade para palco, telas e redes.',
    keywords:
      'nome artístico numerologia, criar nome artístico, nome de palco, nome artístico para cantor, pseudônimo de escritor, nome drag, nome para criador de conteúdo, numerologia cabalística nome artístico',
    productName: 'Nome Artístico: Presença de Palco e Marca',
    productDescription:
      'Geração e análise cabalística de nomes artísticos próximos ao nome de nascimento ou totalmente novos, com afinidade do número com a área artística e zero bloqueios.',
  },
  hero: {
    eyebrow: 'Nome Artístico · Palco, Telas & Redes', // [TEXTO]
    titleLead: 'Crie um nome artístico', // [TEXTO]
    titleHighlight: 'com a vibração certa para o seu palco', // [TEXTO]
    description:
      'Muitos artistas brasileiros mexem no nome de nascimento: dobram uma letra, trocam o sobrenome ou criam um nome do zero. Conte ao chat a sua área, o seu estilo e a imagem que quer passar. O sistema devolve até 3 nomes próximos do seu e até 3 totalmente novos, todos sem bloqueios.', // [TEXTO]
    primaryCtaLabel: 'Criar Meu Nome Artístico Agora', // [TEXTO]
    primaryCtaId: 'nome_artistico_hero_chat',
    secondaryCtaLabel: 'Ver a Nota do Meu Nome Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Análise na hora · Pagamento único por 30 dias · Seu nome civil segue nos contratos', // [TEXTO]
    sceneSrSummary:
      'Prévia animada do atendimento escolhendo Nome Artístico, área de atuação, estilo de presença e exibindo variações Próximos e Novos.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que o Chat Pergunta', // [TEXTO]
    title: 'O chat entende a sua arte antes de sugerir qualquer nome', // [TEXTO]
    description:
      'Cada área pede uma energia diferente. Por isso o caminho artístico pergunta a sua área, o estilo e a imagem da persona, e usa essas respostas para ordenar os nomes que passaram no filtro.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'A sua área', // [TEXTO]
        description: 'Canto, atuação, personagem, drag ou humor, criação de conteúdo, escrita, DJ ou produção musical, ou outra área.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Estilo e persona', // [TEXTO]
        description: 'Pop, funk, sertanejo, rap, MPB, gospel, drama, comédia, teatro e mais, e se a persona é feminina, masculina ou neutra.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Imagem e caminho', // [TEXTO]
        description: 'Marcante, sofisticada, divertida, misteriosa ou popular, e se você quer um nome próximo do seu, totalmente diferente ou as duas coisas.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Estrela Cabalística e afinidade do número com a sua área', // [TEXTO]
    description:
      'Além de zerar os bloqueios no Triângulo da Vida, o sistema mostra o arquétipo que o nome projeta e avalia a Expressão do nome artístico frente ao seu Destino e à sua área. Cada nome sugerido vem com uma frase curta explicando por que ele combina com o seu trabalho.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela Comparativa', // [TEXTO]
      title: 'Do nome de registro ao nome de palco', // [TEXTO]
      description: 'Veja a passagem do seu mapa atual para um nome artístico com Expressão forte para o público, número por número.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística comparando o mapa original e o nome artístico sugerido.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Afinidade Número × Área', // [TEXTO]
      title: 'Vibrações que favorecem cada palco', // [TEXTO]
      description: 'Uma referência simbólica de como os números de Expressão conversam com cada frente criativa. Ela só desempata nomes que já passaram no filtro.', // [TEXTO]
      srSummary: 'Quadro informativo com afinidade entre números de Expressão e áreas artísticas.', // [TEXTO]
      affinityCards: [
        {
          area: 'Canto & Palco', // [TEXTO]
          numbers: 'Expressão 3 · 5 · 6 · 11', // [TEXTO]
          summary: 'Comunicação, versatilidade, voz acolhedora e magnetismo com a plateia.', // [TEXTO]
        },
        {
          area: 'Conteúdo & Vídeo', // [TEXTO]
          numbers: 'Expressão 3 · 5 · 1', // [TEXTO]
          summary: 'Carisma, movimento e protagonismo para prender a atenção nas redes.', // [TEXTO]
        },
        {
          area: 'Escrita & Autoria', // [TEXTO]
          numbers: 'Expressão 7 · 3 · 9 · 11', // [TEXTO]
          summary: 'Profundidade, mensagem e inspiração para obras autorais e pseudônimos.', // [TEXTO]
        },
      ],
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Você Recebe', // [TEXTO]
    title: 'Dois blocos lado a lado: próximos do seu nome e totalmente novos', // [TEXTO]
    description:
      'Quer manter a sua essência? Veja até 3 variações do seu nome de nascimento. Quer se reinventar? Veja até 3 nomes inéditos, que só aparecem com nota 80 ou mais. Todos sem bloqueios e com o motivo de combinarem com a sua área.', // [TEXTO]
    srSummary: 'Animação dos cards de sugestões de Nome Artístico divididos entre Próximos e Novos.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'Um relatório para escolher e lançar o seu nome artístico', // [TEXTO]
    description:
      'Um PDF com capa de palco para salvar, mostrar para a equipe e usar o nome com consistência em capas, créditos, plataformas e redes.', // [TEXTO]
    highlights: [
      'Ranking separado entre nomes próximos e nomes inéditos', // [TEXTO]
      'Por que cada número combina com a sua área', // [TEXTO]
      'Arquétipo do nome, Expressão × Destino e Triângulo da Vida', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do relatório em PDF no tema de palco do Nome Artístico.', // [TEXTO]
  },
  notice: {
    eyebrow: 'Aviso Importante Sobre Contratos', // [TEXTO]
    title: 'Nome artístico é para o público, contratos seguem o seu nome civil', // [TEXTO]
    description:
      'Você pode usar o nome artístico em capas, créditos, perfis sociais e divulgação sem alterar nenhum documento civil.', // [TEXTO]
    points: [
      'Em contratos, notas fiscais, cadastros bancários e registros de direitos autorais vale o nome completo do registro civil, com o nome artístico indicado quando o documento permitir.', // [TEXTO]
      'Quando fizer sentido, o contrato pode trazer a forma "conhecido artisticamente como".', // [TEXTO]
      'A análise é uma leitura numerológica simbólica e comparativa, sem efeito jurídico e sem necessidade de ir ao cartório.', // [TEXTO]
    ],
  },
  faq: [
    {
      question: 'Vou receber variações do meu nome ou nomes novos?', // [TEXTO]
      answer:
        'Você escolhe no chat: próximo do seu nome, totalmente diferente ou as duas coisas. Com as duas, vêm até 3 nomes de cada tipo, lado a lado.', // [TEXTO]
    },
    {
      question: 'Posso usar o nome artístico em contratos e plataformas?', // [TEXTO]
      answer:
        'O nome artístico vai em capas, plataformas de música e vídeo, redes sociais e imprensa. Contratos, pagamentos e registros legais continuam no seu nome civil.', // [TEXTO]
    },
    {
      question: 'Serve para pseudônimo de escritor, personagem ou drag?', // [TEXTO]
      answer:
        'Sim. Escrita, personagem, drag e humor são áreas do próprio chat, cada uma com perguntas de estilo e com a sua referência de afinidade.', // [TEXTO]
    },
    {
      question: 'Qual a diferença para o caminho de Nome Social?', // [TEXTO]
      answer:
        'Os dois usam o mesmo rigor cabalístico no Triângulo da Vida. O caminho artístico pergunta área, estilo e imagem de palco e pode sugerir nomes totalmente novos, pensados para o público.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Seu Próximo Passo no Palco', // [TEXTO]
    title: 'O nome que vai estar no cartaz começa aqui', // [TEXTO]
    description:
      'Abra o chat no caminho do Nome Artístico, responda às perguntas de área, estilo e imagem e compare na hora os nomes próximos e os totalmente novos.', // [TEXTO]
    ctaLabel: 'Criar Meu Nome Artístico', // [TEXTO]
    ctaId: 'nome_artistico_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
