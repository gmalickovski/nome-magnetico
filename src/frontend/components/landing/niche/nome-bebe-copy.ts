import type { NichePageCopy } from './niche-types';

/**
 * Textos provisórios da página `/nome-bebe` (`DEV-339`).
 * Blocos marcados com `// [TEXTO]` podem ser ajustados por Marketing sem mexer em layout.
 * Regra visual: tons pastel aparecem apenas dentro dos mockups/cards de prévia; o fundo segue o design system.
 */
export const NOME_BEBE_COPY: NichePageCopy = {
  id: 'bebe',
  route: '/nome-bebe',
  ctaHref: '/app/analise/nome-social?caminho=bebe',
  seo: {
    title: 'Nome do Bebê pela Numerologia Cabalística',
    description:
      'Avalie nomes para o bebê com o sobrenome da família e a data prevista ou nascimento, verificando bloqueios nos 4 triângulos e dias favoráveis do parto.',
    keywords:
      'nome de bebê numerologia, escolher nome do bebê, numerologia cabalística bebê, nome composto bebê sem bloqueios, sobrenome família numerologia',
    productName: 'Nome do Bebê: Análise e Sugestões em Família',
    productDescription:
      'Avaliação cabalística de nomes para bebês cruzando sobrenomes dos pais, data prevista ou nascimento, bloqueios nos 4 triângulos e PDF acolhedor.',
  },
  hero: {
    eyebrow: 'Nome do Bebê · Família & Chegada', // [TEXTO]
    titleLead: 'Escolha o nome do seu bebê', // [TEXTO]
    titleHighlight: 'com harmonia nos 4 triângulos desde o primeiro dia', // [TEXTO]
    description:
      'Informe os sobrenomes da família, a data prevista ou nascimento e seus palpites favoritos. O sistema verifica bloqueios e mostra quais combinações e dias da janela trazem maior equilíbrio.', // [TEXTO]
    primaryCtaLabel: 'Analisar Nome do Meu Bebê', // [TEXTO]
    primaryCtaId: 'nome_bebe_hero_chat',
    secondaryCtaLabel: 'Testar Minha Própria Nota Grátis', // [TEXTO]
    secondaryCtaHref: '/analise-gratuita',
    trustLine: 'Acesso imediato · Análise na hora · Pagamento único por ciclo de 30 dias · Sem prazos ou pressão no registro', // [TEXTO]
    sceneSrSummary:
      'Prévia animada em tons pastel do atendimento escolhendo Nome do Bebê, preenchendo nomes dos pais, data prevista e exibindo opções ranqueadas com a tira dos dias do parto.', // [TEXTO]
  },
  questions: {
    eyebrow: 'O Que Perguntamos', // [TEXTO]
    title: 'Dados da família para testar combinações completas de nome + sobrenome', // [TEXTO]
    description:
      'Não avaliamos apenas o primeiro nome isolado: cruzamos o sobrenome completo dos pais com a data do bebê.', // [TEXTO]
    items: [
      {
        number: '01',
        title: 'Nomes e sobrenomes dos pais', // [TEXTO]
        description: 'Informe mãe e/ou pai para montar automaticamente combinações fiéis à linhagem da família.', // [TEXTO]
      },
      {
        number: '02',
        title: 'Data prevista ou nascimento', // [TEXTO]
        description: 'Para quem ainda vai nascer, consideramos a janela de dias próximos; se já nasceu, cravamos o Destino exato.', // [TEXTO]
      },
      {
        number: '03',
        title: 'Preferências e palpites', // [TEXTO]
        description: 'Nomes femininos, masculinos ou neutros, estilo clássico ou moderno e nomes que você já tem em mente.', // [TEXTO]
      },
    ],
  },
  analysis: {
    eyebrow: 'O Que o Cálculo Mostra', // [TEXTO]
    title: 'Mapa harmônico e Triângulo da Vida livre de sequências repetidas', // [TEXTO]
    description:
      'Veja os 5 números principais do nome completo do bebê e confira que o Triângulo da Vida desce limpo até o Arcano Regente.', // [TEXTO]
    leftBlock: {
      badge: 'Estrela do Bebê', // [TEXTO]
      title: 'Equilíbrio entre Expressão e Destino desde cedo', // [TEXTO]
      description: 'Compare palpites dos pais e enxergue a nota de 0 a 100 antes de bater o martelo.', // [TEXTO]
      srSummary: 'Animação da Estrela Cabalística com o nome completo do bebê destacando pontuação harmônica.', // [TEXTO]
    },
    rightBlock: {
      badge: 'Triângulo Sem Bloqueios', // [TEXTO]
      title: 'Zero sequências repetidas em toda a estrutura', // [TEXTO]
      description: 'Filtramos combinações para evitar bloqueios em qualquer um dos 4 triângulos cabalísticos.', // [TEXTO]
      srSummary: 'Animação do Triângulo da Vida do bebê sem marcas vermelhas de bloqueio.', // [TEXTO]
    },
  },
  suggestions: {
    eyebrow: 'Os Nomes Que Você Recebe', // [TEXTO]
    title: 'Combinações ranqueadas + tira com os dias da janela do parto', // [TEXTO]
    description:
      'Veja os melhores nomes compostos com o sobrenome da família e os dias da janela que conversam melhor com o número de Expressão escolhido.', // [TEXTO]
    srSummary: 'Animação em tema pastel com sugestões de nomes para o bebê e a tira dos dias favoráveis da janela do parto.', // [TEXTO]
  },
  deliverables: {
    eyebrow: 'O Que Você Leva', // [TEXTO]
    title: 'Manual acolhedor em PDF para guardar com a família', // [TEXTO]
    description:
      'Versão em tons pastel do relatório completo para compartilhar entre os pais e consultar sempre que quiserem.', // [TEXTO]
    highlights: [
      'Comparação direta entre seus nomes em mente e novas sugestões', // [TEXTO]
      'Leitura clara dos 5 números e 4 triângulos sem bloqueios', // [TEXTO]
      'Tabela prática da janela de nascimento quando aplicável', // [TEXTO]
    ],
    srSummary: 'Folheto animado das páginas do PDF do bebê em tema pastel.', // [TEXTO]
  },
  notice: {
    eyebrow: 'Aviso Tranquilo Sobre o Registro', // [TEXTO]
    title: 'Decisão afetiva e sem correria — o registro segue o ritmo de vocês', // [TEXTO]
    description:
      'A análise numerológica apoia os pais com clareza simbólica sem criar urgência artificial nem impor prazos médicos.', // [TEXTO]
    points: [
      'Vocês podem comparar palpites com calma ainda na gestação ou depois do nascimento, antes de ir ao cartório.', // [TEXTO]
      'A tira de dias da janela serve apenas como referência simbólica complementar — respeite sempre a orientação médica e o tempo natural do parto.', // [TEXTO]
      'Não existe "prazo limite mágico": o importante é escolher um nome completo que faça sentido para a história da família.', // [TEXTO]
    ],
  },
  faq: [
    {
      question: 'Funciona tanto antes quanto depois do nascimento?', // [TEXTO]
      answer:
        'Sim. Durante a gestação usamos a data prevista e mostramos uma janela de dias próximos; se o bebê já nasceu, calculamos com a data exata do nascimento.', // [TEXTO]
    },
    {
      question: 'Posso testar os nomes que já temos em mente?', // [TEXTO]
      answer:
        'Sim. Você pode combinar seus palpites com os sobrenomes dos pais e comparar lado a lado com novas sugestões livres de bloqueios.', // [TEXTO]
    },
    {
      question: 'Preciso cadastrar meus próprios dados de nascimento?', // [TEXTO]
      answer:
        'No caminho do Bebê pedimos apenas o nome dos pais (ou um deles) para montar os sobrenomes corretamente — não usamos a sua certidão como base do cálculo.', // [TEXTO]
    },
  ],
  finalCta: {
    eyebrow: 'Escolham Com Tranquilidade', // [TEXTO]
    title: 'Abra o chat já no caminho de Nome do Bebê', // [TEXTO]
    description:
      'Informe os sobrenomes da família e teste combinações sem bloqueios para o bebê agora mesmo.', // [TEXTO]
    ctaLabel: 'Ir para o Chat de Nome do Bebê', // [TEXTO]
    ctaId: 'nome_bebe_final_chat',
    footnote: 'Acesso imediato · Pagamento único (30 dias) · Garantia de 7 dias', // [TEXTO]
  },
};
