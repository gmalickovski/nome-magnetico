import type { NichePageCopy } from './niche-types';

/**
 * Textos da página `/nome-bebe` (`DEV-339`, copy revisada em `DEV-342`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 * Regra visual: tons pastel aparecem apenas dentro dos mockups/cards de prévia; o fundo segue o design system.
 * Janela de Datas: 14 dias antes até 14 depois da data prevista (29 dias), ver `docs/architecture/dev-326-caminho-bebe-chat.md`.
 */
export const NOME_BEBE_COPY: NichePageCopy = {
  id: 'bebe',
  route: '/nome-bebe',
  ctaHref: '/app/analise/nome-social?caminho=bebe',
  seo: {
    title: 'Nome do Bebê pela Numerologia Cabalística',
    description:
      'Escolha o nome do bebê pela Numerologia Cabalística, mesmo sem a data exata do parto: a Janela de Datas calcula 29 dias possíveis. Nomes sem bloqueios e PDF.',
    keywords:
      'nome de bebê numerologia, escolher nome do bebê, numerologia cabalística bebê, nome do bebê data prevista, nome de bebê sem bloqueios, nome composto bebê, numerologia nome de filho',
    productName: 'Nome do Bebê: Análise e Sugestões em Família',
    productDescription:
      'Análise cabalística de nomes para bebês com os sobrenomes da família, data exata ou Janela de Datas do parto, bloqueios no Triângulo da Vida e manual em PDF para os pais.',
  },
  hero: {
    eyebrow: 'Nome do Bebê · Família & Chegada', // [TEXTO]
    titleLead: 'Escolha o nome do seu bebê', // [TEXTO]
    titleHighlight: 'com carinho, segurança e zero bloqueios', // [TEXTO]
    description:
      'O primeiro presente que vocês dão a um filho é o nome. Informe o nome da mãe, do pai ou de só um dos dois, a data prevista e os nomes que já estão no coração. O sistema analisa cada um, sugere novos nomes sem bloqueios e mostra em quantos dias da Janela de Datas cada nome fica bom.', // [TEXTO]
    primaryCtaLabel: 'Analisar Nomes para o Meu Bebê', // [TEXTO]
    primaryCtaId: 'nome_bebe_hero_chat',
    secondaryCtaLabel: 'Ver a Nota do Meu Nome Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Funciona com a data prevista · Mães e pais solo · Sem pressa para o registro', // [TEXTO]
    sceneSrSummary:
      'Prévia animada em tons pastel do atendimento escolhendo Nome do Bebê, preenchendo nomes dos pais, data prevista e exibindo opções ranqueadas com a tira dos dias do parto.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que o Chat Pergunta', // [TEXTO]
    title: 'Poucos dados da família para analisar o nome completo', // [TEXTO]
    description:
      'Não avaliamos o primeiro nome isolado. O cálculo considera o nome completo, com os sobrenomes da família, e a data do bebê, exata ou prevista.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'Nome da mãe e/ou do pai', // [TEXTO]
        description: 'Basta um dos dois. O chat monta as combinações de sobrenome a partir dos nomes que vocês informarem.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Data exata ou prevista', // [TEXTO]
        description: 'Já nasceu? Usamos a data exata. Ainda não? A Janela de Datas calcula cada nome em todos os dias de 14 antes até 14 depois da data prevista.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Sexo, estilo e nomes favoritos', // [TEXTO]
        description: 'Menina, menino ou "ainda não sei", estilo clássico, moderno, curto, bíblico ou internacional, e até 5 nomes que vocês já estão pensando.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Mapa harmônico e Triângulo da Vida sem sequências repetidas', // [TEXTO]
    description:
      'Veja os 5 números principais do nome completo do bebê e confira, linha por linha, que o Triângulo da Vida desce limpo até o Arcano Regente.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela do Bebê', // [TEXTO]
      title: 'Equilíbrio entre Expressão e Destino desde o primeiro dia', // [TEXTO]
      description: 'Compare os nomes que vocês pensaram com as novas sugestões e veja a nota de 0 a 100 de cada um antes de decidir.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística com o nome completo do bebê destacando pontuação harmônica.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Triângulo Sem Bloqueios', // [TEXTO]
      title: 'Zero sequências repetidas em toda a estrutura', // [TEXTO]
      description: 'As sugestões do sistema passam pelo filtro de bloqueios do Triângulo da Vida e pelos dias da Janela de Datas antes de aparecer.', // [TEXTO]
      srSummary: 'Animação do Triângulo da Vida do bebê sem marcas vermelhas de bloqueio.', // [TEXTO]
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Vocês Recebem', // [TEXTO]
    title: 'Nomes ranqueados e a Janela de Datas de cada um', // [TEXTO]
    description:
      'Cada nome mostra a nota de 0 a 100 e em quantos dos 29 dias possíveis ele fica bom, como "bom em 26 de 29 dias". Nomes novos só aparecem com nota 80 ou mais e sem bloqueio. Os nomes que vocês trouxeram aparecem com a análise completa, inclusive se tiverem bloqueio.', // [TEXTO]
    srSummary: 'Animação em tema pastel com sugestões de nomes para o bebê e a tira dos dias favoráveis da janela do parto.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Vocês Levam', // [TEXTO]
    title: 'Um manual em PDF para receber o bebê', // [TEXTO]
    description:
      'Mais que um relatório: um manual para os pais, em tons pastel, que explica o nome escolhido em linguagem de família e fica guardado para consultar e compartilhar.', // [TEXTO]
    highlights: [
      'Os nomes de vocês lado a lado com as novas sugestões', // [TEXTO]
      '5 números e Triângulo da Vida explicados em linguagem de pais', // [TEXTO]
      'Tabela da Janela de Datas quando a data é prevista', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do PDF do bebê em tema pastel.', // [TEXTO]
  },
  notice: {
    eyebrow: 'Aviso Tranquilo Sobre o Registro', // [TEXTO]
    title: 'Decisão afetiva e sem correria: o registro segue o ritmo de vocês', // [TEXTO]
    description:
      'A análise numerológica apoia os pais com clareza simbólica, sem criar urgência e sem interferir em orientação médica.', // [TEXTO]
    points: [
      'Vocês podem comparar os nomes com calma ainda na gestação ou depois do nascimento, antes de ir ao cartório.', // [TEXTO]
      'A Janela de Datas é uma referência simbólica. A data do parto segue sempre a orientação médica e o tempo natural do bebê.', // [TEXTO]
      'Não existe prazo mágico: o importante é escolher um nome completo que faça sentido para a história da família.', // [TEXTO]
    ],
  },
  faq: [
    {
      question: 'E se ainda não sabemos o dia do parto?', // [TEXTO]
      answer:
        'É para isso que existe a Janela de Datas. Com a data prevista, o sistema calcula cada nome em todos os dias de 14 antes até 14 depois e mostra em quantos deles o nome fica bom. Se o bebê já nasceu, usamos a data exata.', // [TEXTO]
    },
    {
      question: 'Podemos testar os nomes que já escolhemos?', // [TEXTO]
      answer:
        'Sim, até 5. Eles passam pelo mesmo cálculo e aparecem com nota e com os bloqueios, se houver, lado a lado com as novas sugestões do sistema.', // [TEXTO]
    },
    {
      question: 'Funciona para mãe solo ou pai solo?', // [TEXTO]
      answer:
        'Sim. O chat aceita o nome de só um dos pais e monta os sobrenomes a partir dele. Não usamos a certidão de vocês como base do cálculo do bebê.', // [TEXTO]
    },
    {
      question: 'O bebê já foi registrado. Ainda serve?', // [TEXTO]
      answer:
        'Serve. Com o nome já registrado, o chat faz a leitura do nome com a análise completa, para vocês conhecerem melhor as energias do nome do filho.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Escolham Com Tranquilidade', // [TEXTO]
    title: 'Comecem a escolher o nome com calma e clareza', // [TEXTO]
    description:
      'Abram o chat no caminho do Nome do Bebê, informem os nomes da família e a data, e vejam na hora quais nomes estão livres de bloqueios.', // [TEXTO]
    ctaLabel: 'Escolher o Nome do Bebê', // [TEXTO]
    ctaId: 'nome_bebe_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
