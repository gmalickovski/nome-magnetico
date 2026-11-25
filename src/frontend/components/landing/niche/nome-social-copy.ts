import type { NichePageCopy } from './niche-types';

/**
 * Textos da página `/nome-social` (`DEV-339`, copy revisada em `DEV-342`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 */
export const NOME_SOCIAL_COPY: NichePageCopy = {
  id: 'social',
  route: '/nome-social',
  ctaHref: '/app/analise/nome-social?caminho=dia_a_dia',
  seo: {
    title: 'Nome Social e Assinatura pela Numerologia',
    description:
      'Harmonize a assinatura do seu nome pela Numerologia Cabalística: 3 sugestões sem bloqueios, nota de 0 a 100, teste seus próprios nomes e baixe o PDF na hora.',
    keywords:
      'nome social numerologia, harmonização de assinatura, assinatura numerológica, mudar assinatura numerologia, nome sem bloqueios, numerologia cabalística nome, triângulo da vida, nota do nome',
    productName: 'Nome Social: Harmonização de Assinatura',
    productDescription:
      'Análise de Numerologia Cabalística com Triângulo da Vida, arquétipo, 5 números principais, diagnóstico de bloqueios e versões do nome sem bloqueios para assinatura, redes e trabalho, com PDF completo.',
  },
  hero: {
    eyebrow: 'Nome Social · Assinatura do Dia a Dia', // [TEXTO]
    titleLead: 'Harmonize o nome que você já usa', // [TEXTO]
    titleHighlight: 'e assine com uma versão sem bloqueios', // [TEXTO]
    description:
      'Responda poucas perguntas no chat: onde você usa o nome, o que quer transmitir e quanto aceita mudar. O sistema calcula o Triângulo da Vida e mostra as 3 versões mais bem pontuadas para o seu perfil, com nota de 0 a 100, para usar em assinaturas, redes sociais, e-mails e propostas.', // [TEXTO]
    primaryCtaLabel: 'Começar a Harmonização do Meu Nome', // [TEXTO]
    primaryCtaId: 'nome_social_hero_chat',
    secondaryCtaLabel: 'Ver a Nota do Meu Nome Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Análise na hora · Pagamento único por 30 dias · Sem mudar o nome em cartório', // [TEXTO]
    sceneSrSummary:
      'Prévia animada do atendimento no caminho Harmonizar o meu nome respondendo onde assina, estilo de presença e nível de mudança até exibir sugestões sem bloqueios.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que o Chat Pergunta', // [TEXTO]
    title: 'Perguntas certas para calibrar a assinatura ao seu uso real', // [TEXTO]
    description:
      'Em vez de gerar nomes soltos, o chat entende onde o seu nome circula, o que você quer transmitir e até onde quer mudar. Cada resposta muda o que o sistema prioriza na hora de ordenar as sugestões.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'Onde o seu nome aparece', // [TEXTO]
        description: 'Contratos e documentos, redes sociais, e-mail e cartão de visita, a sua marca ou negócio, ou um trabalho criativo.', // [TEXTO]
      },
      {
        number: '02',
        title: 'O que você quer transmitir', // [TEXTO]
        description: 'Firmeza e confiança, leveza e acolhimento, criatividade marcante ou elegância discreta, e o foco do momento: dinheiro, carreira, relações ou autoestima.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Quanto você aceita mudar', // [TEXTO]
        description: 'Quase nada, um acento ou uma letra a mais, tirar ou trocar um sobrenome, ou o que fizer sentido. Você também diz se quer manter o primeiro nome.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Antes e depois nos 5 números e no Triângulo da Vida', // [TEXTO]
    description:
      'Cada letra vira número segundo a tabela cabalística. Você enxerga onde estavam os bloqueios do nome de nascimento e como a nova grafia reorganiza a vibração da sua assinatura.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela Cabalística', // [TEXTO]
      title: 'Os 5 números fundamentais lado a lado', // [TEXTO]
      description: 'Compare Destino, Expressão, Motivação, Missão e Impressão entre o nome de nascimento e o nome harmonizado, e veja a nota subir.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística mostrando a evolução da nota do nome de nascimento para a assinatura harmonizada.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Triângulo da Vida (Antes × Depois)', // [TEXTO]
      title: 'Os bloqueios saem, a ponta do triângulo fica', // [TEXTO]
      description: 'As sequências em vermelho desaparecem do Triângulo da Vida e você confere, linha por linha, que a nova versão desce limpa até o Arcano Regente.', // [TEXTO]
      srSummary: 'Animação do Triângulo da Vida mostrando linhas descendo, bloqueio destacado em vermelho e troca para nome sem bloqueios.', // [TEXTO]
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Você Recebe', // [TEXTO]
    title: 'As 3 melhores versões para o seu perfil, e mais se você quiser', // [TEXTO]
    description:
      'Comece pelas 3 sugestões mais bem pontuadas. Quer comparar mais? Peça até 6 novas opções ao sistema e teste até 5 nomes que você mesmo imaginou, calculados na hora e sem interferência. Toda sugestão do sistema traz nota de 0 a 100, a relação Expressão × Destino e zero bloqueios.', // [TEXTO]
    srSummary: 'Cena com três cards de sugestões de nome social entrando em sequência com nota colorida e selo zero bloqueios.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'PDF completo e um guia para adotar a nova assinatura', // [TEXTO]
    description:
      'A leitura detalhada do seu mapa atual, o comparativo antes e depois, as lições kármicas, as tendências ocultas e um plano simples para treinar e começar a usar a nova assinatura no dia a dia.', // [TEXTO]
    highlights: [
      'Triângulo da Vida e arquétipo do nome, com leituras complementares', // [TEXTO]
      'Antes e depois dos 5 números e da nota de 0 a 100', // [TEXTO]
      'Critérios objetivos para treinar e aplicar a nova assinatura', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do relatório em PDF no tema dourado de Nome Social.', // [TEXTO]
  },
  notice: null,
  faq: [
    {
      question: 'Preciso mudar meu nome em cartório?', // [TEXTO]
      answer:
        'Não. O seu nome no registro civil continua o mesmo. O que muda é a forma de assinar e de se apresentar: em redes sociais, e-mails, cartões, propostas, apresentações e projetos.', // [TEXTO]
    },
    {
      question: 'Posso usar a nova assinatura em contratos e documentos?', // [TEXTO]
      answer:
        'Pode, desde que ela seja a mesma do seu documento oficial. Para contratos e documentos com validade legal, atualize a assinatura em um documento de identificação válido no Brasil, como RG (CIN) ou CNH, na próxima emissão. O nome continua igual, muda só a forma de assinar.', // [TEXTO]
    },
    {
      question: 'Quantos nomes posso avaliar?', // [TEXTO]
      answer:
        'Você recebe 3 sugestões iniciais, pode pedir até 6 novas ao sistema e testar até 5 nomes seus. O acesso vale por 30 dias, com pagamento único e sem renovação automática, e você faz as análises por conta própria, na hora que quiser.', // [TEXTO]
    },
    {
      question: 'As sugestões têm bloqueios?', // [TEXTO]
      answer:
        'Sim. Toda sugestão gerada pelo sistema passa pela verificação de zero sequências repetidas (3 ou mais números iguais) no Triângulo da Vida, o cálculo principal. Os triângulos Pessoal, Social e Destino entram como leitura complementar no PDF. Os nomes que você digita mostram a análise completa, inclusive se houver bloqueio.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Comece Agora', // [TEXTO]
    title: 'Sua nova assinatura começa com uma conversa', // [TEXTO]
    description:
      'Abra o chat já no caminho do Nome Social, confirme seus dados de nascimento e compare na hora as versões do seu nome, cada uma com nota de 0 a 100.', // [TEXTO]
    ctaLabel: 'Harmonizar Meu Nome Agora', // [TEXTO]
    ctaId: 'nome_social_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
