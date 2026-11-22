/**
 * Mapa de textos em linguagem de pais para o manual do bebê (DEV-330).
 *
 * Tom de amor, acolhimento e cuidado. Fala sempre de tendências e qualidades para
 * observar e estimular, nunca de destino fechado, saúde, promessa ou "incompatível".
 */

import { reduzirNumero } from '../../core';

export interface NumeroDestinoBebeCopy {
  titulo: string;
  resumo: string;
}

export interface NumeroExpressaoBebeCopy {
  comoExpressa: string;
  dicaExpressao: string;
  comoAprende: string;
  dicaAprende: string;
}

export interface NumeroMotivacaoBebeCopy {
  movePorDentro: string;
  dicaMove: string;
  comoAcolher: string;
  dicaAcolher: string;
}

export interface NumeroMissaoBebeCopy {
  talentos: string;
  dicaTalentos: string;
}

export interface FasesCrescimentoBebe {
  bebe: string;
  infancia: string;
  adolescencia: string;
}

/** Chave reduzida mantendo 11 e 22 quando aplicável. */
export function chaveNumeroBebe(n: number | null | undefined): number {
  if (!n || n <= 0) return 1;
  const mestre = reduzirNumero(n, true);
  if (mestre === 11 || mestre === 22) return mestre;
  return reduzirNumero(n, false);
}

/** Chave simples 1–9 para tabelas de fases e cores. */
export function chaveSimplesBebe(n: number | null | undefined): number {
  if (!n || n <= 0) return 1;
  return reduzirNumero(n, false);
}

export const DESTINO_BEBE: Record<number, NumeroDestinoBebeCopy> = {
  1: {
    titulo: 'Iniciativa e descoberta',
    resumo: 'Um caminho de curiosidade e vontade própria, com coragem para dar os primeiros passos.',
  },
  2: {
    titulo: 'Afeto e companhia',
    resumo: 'Um caminho voltado aos vínculos, à escuta gentil e a construir pontes entre as pessoas.',
  },
  3: {
    titulo: 'Alegria e expressão',
    resumo: 'Um caminho leve e criativo, com facilidade para encantar pela fala, pelo riso e pela arte.',
  },
  4: {
    titulo: 'Cuidado e firmeza',
    resumo: 'Um caminho de passos seguros, gosto pela rotina tranquila e carinho pelas pequenas conquistas.',
  },
  5: {
    titulo: 'Curiosidade e movimento',
    resumo: 'Um caminho aberto a novidades, perguntas e descobertas pelo mundo afora.',
  },
  6: {
    titulo: 'Cuidado e harmonia',
    resumo: 'Um caminho voltado aos laços, à família e a deixar os lugares mais bonitos e acolhedores.',
  },
  7: {
    titulo: 'Olhar atento e sabedoria',
    resumo: 'Um caminho observador, com mundo interior rico, calma e interesse pelo porquê das coisas.',
  },
  8: {
    titulo: 'Confiança e realização',
    resumo: 'Um caminho de presença forte, senso de justiça e vontade de ver ideias acontecerem.',
  },
  9: {
    titulo: 'Generosidade e imaginação',
    resumo: 'Um caminho sensível ao coletivo, com coração grande e vontade de acolher quem está perto.',
  },
  11: {
    titulo: 'Sensibilidade e inspiração',
    resumo: 'Um caminho intuitivo e luminoso, que percebe o clima da casa e inspira pelo afeto.',
  },
  22: {
    titulo: 'Sonhos grandes com pé no chão',
    resumo: 'Um caminho que une imaginação e jeito prático para cuidar de projetos e pessoas.',
  },
};

export const EXPRESSAO_BEBE: Record<number, NumeroExpressaoBebeCopy> = {
  1: {
    comoExpressa: 'Tende a mostrar logo o que quer, com energia e iniciativa para tentar fazer do seu jeito.',
    dicaExpressao: 'Dica: ofereça escolhas simples (entre duas roupas ou dois livros) para incentivar a autonomia.',
    comoAprende: 'Aprende testando, mexendo e descobrindo com as próprias mãos.',
    dicaAprende: 'Dica: desafios curtos, blocos de montar e jogos em que ela possa liderar.',
  },
  2: {
    comoExpressa: 'Tende a se comunicar com doçura, buscando o olhar e a aprovação de quem ama.',
    dicaExpressao: 'Dica: conversem com calma e validem o que ela sente antes de corrigir.',
    comoAprende: 'Aprende melhor em dupla ou em grupos pequenos, sem pressa nem competição.',
    dicaAprende: 'Dica: histórias em voz alta, brincadeiras de cooperar e música tranquila.',
  },
  3: {
    comoExpressa: 'Tende a ser comunicativa e criativa: gosta de cantar, contar e inventar histórias.',
    dicaExpressao: 'Dica: ofereça música, livros ilustrados e espaço para desenhar e conversar.',
    comoAprende: 'Aprende brincando de faz de conta, imitando vozes e criando personagens.',
    dicaAprende: 'Dica: teatrinho de fantoches, rimas e brincadeiras com outras crianças.',
  },
  4: {
    comoExpressa: 'Tende a falar e agir com clareza, gostando de combinar antes o que vai acontecer.',
    dicaExpressao: 'Dica: antecipe a rotina ("depois do banho vem a história") para dar segurança.',
    comoAprende: 'Aprende passo a passo, repetindo até sentir firmeza em cada descoberta.',
    dicaAprende: 'Dica: quebra-cabeças, caixas de encaixe e pequenas tarefas organizadas com vocês.',
  },
  5: {
    comoExpressa: 'Tende a ser ágil, cheia de perguntas e animada com tudo o que é novidade.',
    dicaExpressao: 'Dica: respondam às perguntas com paciência e levem a conversa para a vida real.',
    comoAprende: 'Aprende explorando ambientes diferentes, tocando texturas e mudando de atividade.',
    dicaAprende: 'Dica: passeios ao ar livre, caça ao tesouro e jogos com movimento.',
  },
  6: {
    comoExpressa: 'Tende a ser carinhosa e atenciosa, querendo incluir quem está por perto.',
    dicaExpressao: 'Dica: valorize os gestos de cuidado e mostre que ela também pode receber ajuda.',
    comoAprende: 'Aprende pelo exemplo e pelo afeto, gostando de cuidar de bichinhos e plantas.',
    dicaAprende: 'Dica: brincar de casinha, cozinhar juntos em família e atividades manuais.',
  },
  7: {
    comoExpressa: 'Tende a observar antes de falar, escolhendo as palavras com cuidado.',
    dicaExpressao: 'Dica: respeitem o tempo de silêncio e não apressem a resposta quando estiver pensando.',
    comoAprende: 'Aprende observando detalhes, perguntando "por quê" e explorando com calma.',
    dicaAprende: 'Dica: lupas de brinquedo, livros de natureza e momentos silenciosos de leitura.',
  },
  8: {
    comoExpressa: 'Tende a falar com firmeza e clareza, demonstrando confiança desde cedo.',
    dicaExpressao: 'Dica: ouçam seus argumentos com respeito e combinem limites claros e afetuosos.',
    comoAprende: 'Aprende quando entende o propósito da atividade e vê o resultado no final.',
    dicaAprende: 'Dica: jogos de construir, contar objetos e organizar coleções.',
  },
  9: {
    comoExpressa: 'Tende a usar palavras gentis e a se emocionar com histórias e gestos dos outros.',
    dicaExpressao: 'Dica: incentivem que conte como foi o dia e o que achou das pessoas e histórias.',
    comoAprende: 'Aprende por meio da arte, de histórias humanas e da troca com pessoas diferentes.',
    dicaAprende: 'Dica: pintura, música e conversas sobre gentileza e cuidado com o mundo.',
  },
  11: {
    comoExpressa: 'Tende a se expressar de um jeito sensível, captando rápido o clima da conversa.',
    dicaExpressao: 'Dica: mantenham um tom sereno ao redor e incentivem a colocar ideias em palavras.',
    comoAprende: 'Aprende por intuição, imagens e conexões criativas que surpreendem os adultos.',
    dicaAprende: 'Dica: música suave, contação de histórias e brincadeiras com luz e cor.',
  },
  22: {
    comoExpressa: 'Tende a unir imaginação e organização, falando de planos grandes com simplicidade.',
    dicaExpressao: 'Dica: levem a sério suas ideias e ajudem a dividir projetos em passos pequenos.',
    comoAprende: 'Aprende imaginando primeiro e depois montando com blocos, papel ou sucata.',
    dicaAprende: 'Dica: maquetes simples, jardinagem e construções em família.',
  },
};

export const MOTIVACAO_BEBE: Record<number, NumeroMotivacaoBebeCopy> = {
  1: {
    movePorDentro: 'Sente alegria quando descobre que consegue fazer algo por conta própria.',
    dicaMove: 'Dica: celebrem o esforço de tentar, mesmo antes de sair perfeito.',
    comoAcolher: 'Em dias difíceis, pode ficar frustrada quando não consegue algo rápido.',
    dicaAcolher: 'Dica: dê colo primeiro e depois convide a tentar juntos, sem pressa.',
  },
  2: {
    movePorDentro: 'Busca carinho, companhia e harmonia ao redor.',
    dicaMove: 'Dica: momentos a dois, abraços longos e rotina tranquila trazem segurança.',
    comoAcolher: 'Em dias difíceis, sente com facilidade quando a casa está agitada.',
    dicaAcolher: 'Dica: fale baixo, nomeie o que ela sente e fique por perto.',
  },
  3: {
    movePorDentro: 'Sente entusiasmo quando é ouvida, ri junto e pode brincar com liberdade.',
    dicaMove: 'Dica: façam piadas gentis, cantem no carro e riam das pequenas descobertas.',
    comoAcolher: 'Em dias difíceis, pode ficar quieta demais ou muito agitada para chamar atenção.',
    dicaAcolher: 'Dica: sente ao lado, desenhem juntos ou leia uma história conhecida.',
  },
  4: {
    movePorDentro: 'Sente paz quando sabe o que esperar e tem seu cantinho organizado.',
    dicaMove: 'Dica: rituais de sono e refeição consistentes deixam o dia muito mais leve.',
    comoAcolher: 'Em dias difíceis, mudanças bruscas de planos podem causar desconforto.',
    dicaAcolher: 'Dica: explique o que vai mudar com antecedência e ofereça um objeto querido.',
  },
  5: {
    movePorDentro: 'Sente brilho nos olhos diante de novidades, movimento e liberdade para explorar.',
    dicaMove: 'Dica: variem os passeios e deixem espaço seguro para correr e investigar.',
    comoAcolher: 'Em dias difíceis, ficar muito tempo no mesmo lugar gera impaciência.',
    dicaAcolher: 'Dica: mudem de ambiente, abram a janela ou proponham uma brincadeira de movimento.',
  },
  6: {
    movePorDentro: 'Busca estar perto da família, cuidar e sentir que faz parte.',
    dicaMove: 'Dica: envolva nas pequenas escolhas da casa e diga o quanto sua presença alegra vocês.',
    comoAcolher: 'Em dias difíceis, tende a absorver preocupações de quem ama.',
    dicaAcolher: 'Dica: tranquilize com palavras simples ("os adultos cuidam disso") e dê aconchego.',
  },
  7: {
    movePorDentro: 'Precisa de momentos tranquilos e espaço para observar no próprio ritmo.',
    dicaMove: 'Dica: respeitem quando quiser brincar quietinha sem muitos estímulos ao mesmo tempo.',
    comoAcolher: 'Em dias difíceis, excesso de barulho e gente pode cansar rápido.',
    dicaAcolher: 'Dica: ofereça um cantinho calmo com pouca luz e presença silenciosa.',
  },
  8: {
    movePorDentro: 'Sente confiança quando recebe responsabilidade proporcional à idade.',
    dicaMove: 'Dica: reconheça a coragem nos pequenos gestos e confie pequenas missões.',
    comoAcolher: 'Em dias difíceis, pode tentar segurar tudo sozinha e parecer firme demais.',
    dicaAcolher: 'Dica: lembre que não precisa resolver tudo e que o colo dos pais está sempre aberto.',
  },
  9: {
    movePorDentro: 'Move-se pela empatia, pelo carinho com animais e pessoas e pelo encanto das histórias.',
    dicaMove: 'Dica: alimente a imaginação com livros, natureza e gestos de generosidade.',
    comoAcolher: 'Em dias difíceis, pode sentir fundo as tristezas ou despedidas.',
    dicaAcolher: 'Dica: acolha as lágrimas sem pressa e ajude a transformar o sentir em desenho ou abraço.',
  },
  11: {
    movePorDentro: 'Nutre-se de tranquilidade, inspiração e sintonia afetiva com os pais.',
    dicaMove: 'Dica: músicas calmas, luz suave à noite e conversas sinceras fortalecem muito.',
    comoAcolher: 'Em dias difíceis, pode ficar sobrecarregada por muitos estímulos sensoriais.',
    dicaAcolher: 'Dica: reduza telas e barulhos, respirem juntos e ofereça contato calmo.',
  },
  22: {
    movePorDentro: 'Gosta de imaginar grandes ideias e vê-las ganhando forma aos poucos.',
    dicaMove: 'Dica: disponibilize materiais simples para montar e construir no próprio tempo.',
    comoAcolher: 'Em dias difíceis, pode se cobrar quando um plano não sai como imaginou.',
    dicaAcolher: 'Dica: mostre que errar faz parte da descoberta e comemorem o caminho.',
  },
};

export const MISSAO_BEBE: Record<number, NumeroMissaoBebeCopy> = {
  1: {
    talentos: 'Coragem, liderança natural e vontade de iniciar coisas novas.',
    dicaTalentos: 'Dica: incentive quando tomar a frente nas brincadeiras, lembrando também de ouvir os amigos.',
  },
  2: {
    talentos: 'Diplomacia, empatia e facilidade para acalmar e unir o grupo.',
    dicaTalentos: 'Dica: valorize a delicadeza e ajude a expressar seus próprios desejos com confiança.',
  },
  3: {
    talentos: 'Criatividade, humor, música, palavras e brilho social.',
    dicaTalentos: 'Dica: deixe lápis, instrumentos de brinquedo e espaço para inventar sempre à mão.',
  },
  4: {
    talentos: 'Persistência, organização, cuidado prático e senso de responsabilidade.',
    dicaTalentos: 'Dica: confie tarefas simples em casa e elogie a dedicação passo a passo.',
  },
  5: {
    talentos: 'Adaptabilidade, comunicação ágil e curiosidade por línguas e culturas.',
    dicaTalentos: 'Dica: apresente músicas, palavras e brincadeiras de lugares variados.',
  },
  6: {
    talentos: 'Acolhimento, senso estético, cuidado com pessoas e espírito de família.',
    dicaTalentos: 'Dica: convide para cuidar de flores ou preparar algo bonito para receber quem visita.',
  },
  7: {
    talentos: 'Atenção aos detalhes, pensamento profundo e amor pelo conhecimento.',
    dicaTalentos: 'Dica: incentive perguntas curiosas e passeios em parques, museus ou bibliotecas.',
  },
  8: {
    talentos: 'Determinação, visão prática e senso de justiça nas relações.',
    dicaTalentos: 'Dica: brinque de jogos com regras claras onde o diálogo e o respeito apareçam.',
  },
  9: {
    talentos: 'Generosidade, visão ampla e vontade genuína de ajudar.',
    dicaTalentos: 'Dica: compartilhem ações simples de cuidado com o bairro, os bichos e os colegas.',
  },
  11: {
    talentos: 'Intuição apurada, sensibilidade artística e inspiração para quem convive.',
    dicaTalentos: 'Dica: dê liberdade criativa sem comparações, respeitando seu ritmo único.',
  },
  22: {
    talentos: 'Capacidade de transformar sonhos bonitos em realizações concretas.',
    dicaTalentos: 'Dica: projetos em família que comecem no papel e terminem prontos encantam muito.',
  },
};

export const FASES_BEBE: Record<number, FasesCrescimentoBebe> = {
  1: {
    bebe: 'Curiosa com o mundo ao redor, gosta de alcançar objetos e tentar tudo sozinha.',
    infancia: 'Brincadeiras de explorar e liderar combinam bem. Incentive também a troca de vez.',
    adolescencia: 'Autonomia com escuta aberta: combinem responsabilidades e confiem nas escolhas.',
  },
  2: {
    bebe: 'Acalma-se rápido com voz suave, contato pele a pele e rotina tranquila.',
    infancia: 'Valoriza amizades próximas e brincadeiras cooperativas sem disputa exagerada.',
    adolescencia: 'Diálogo franco e acolhedor ajuda a cultivar segurança nas decisões.',
  },
  3: {
    bebe: 'Sorri para sons, cantigas e expressões animadas. Responde cedo à música.',
    infancia: 'Faz de conta, histórias e amigos. Incentive a se expressar pela arte e pela fala.',
    adolescencia: 'Espaço para criar, conversar e experimentar talentos, com a família por perto.',
  },
  4: {
    bebe: 'Sente conforto com horários previsíveis, colo seguro e brinquedos de encaixe.',
    infancia: 'Gosta de saber os combinados do dia e se orgulha de concluir o que começou.',
    adolescencia: 'Apoie a organização própria sem rigidez excessiva, celebrando a constância.',
  },
  5: {
    bebe: 'Olhos atentos a luzes, rostos e novidades. Passeios curtos renovam o ânimo.',
    infancia: 'Curiosa e cheia de energia: jogos ao ar livre e histórias de aventura encantam.',
    adolescencia: 'Confiança com combinados claros permite explorar novos interesses com responsabilidade.',
  },
  6: {
    bebe: 'Aconchega-se fácil no colo da família e gosta de ambientes calmos e harmônicos.',
    infancia: 'Gosta de ajudar e cuidar dos bichinhos ou dos menores. Incentive também a brincar livre.',
    adolescencia: 'Valoriza pertencimento e conversa em casa; lembre que não precisa carregar tudo sozinha.',
  },
  7: {
    bebe: 'Observa muito os detalhes e prefere ambientes sem excesso de ruído.',
    infancia: 'Ama perguntas profundas e momentos calmos de leitura ou descoberta.',
    adolescencia: 'Respeitem o espaço pessoal sem perder a presença amorosa do dia a dia.',
  },
  8: {
    bebe: 'Postura firme e olhar determinado desde os primeiros meses.',
    infancia: 'Gosta de desafios claros e de sentir confiança para tentar e conquistar.',
    adolescencia: 'Combinados transparentes e diálogo de igual para igual fortalecem a parceria.',
  },
  9: {
    bebe: 'Sensível às expressões de carinho e música tranquila desde cedo.',
    infancia: 'Coração generoso, empatia com histórias e prazer em criar desenhos e contos.',
    adolescencia: 'Apoie projetos sociais, artísticos ou voluntários que deem sentido ao seu olhar.',
  },
};

export const QUALIDADE_LICAO_BEBE: Record<number, string> = {
  1: 'iniciativa e confiança para tentar (1)',
  2: 'paciência e parceria nas trocas (2)',
  3: 'leveza para expressar sentimentos (3)',
  4: 'organização no dia a dia (4)',
  5: 'flexibilidade diante de novidades (5)',
  6: 'cuidado tranquilo em família (6)',
  7: 'escuta calma e reflexão (7)',
  8: 'confiança para conquistar com equilíbrio (8)',
};

export const CORES_HARMONIA_BEBE: Record<number, string[]> = {
  1: ['#F6C6CF', '#F5E6B8', '#DCEAF6'],
  2: ['#DDEBF8', '#F2E4FA', '#CFE7D9'],
  3: ['#F6C6CF', '#CFE7D9', '#F5E6B8'],
  4: ['#CFE7D9', '#E6DFD5', '#DDEBF8'],
  5: ['#DDEBF8', '#F5E6B8', '#E5F2D9'],
  6: ['#FCE3E7', '#CFE7D9', '#F5E6B8'],
  7: ['#E8E2FA', '#DDEBF8', '#E2F2EA'],
  8: ['#F5E6B8', '#FCE3E7', '#DDEBF8'],
  9: ['#F3E9FB', '#FCE3E7', '#CFE7D9'],
};

export interface PronomeBebeInfo {
  elaEle: string;
  delaDele: string;
  queridaQuerido: string;
  filhaFilho: string;
  umFilho: string;
}

export function pronomeBebe(sexo: string | null | undefined, artigo = false): PronomeBebeInfo {
  if (sexo === 'menino') {
    return {
      elaEle: 'ele',
      delaDele: 'dele',
      queridaQuerido: 'Querido',
      filhaFilho: artigo ? 'o filho' : 'filho',
      umFilho: 'um filho',
    };
  }
  if (sexo === 'menina') {
    return {
      elaEle: 'ela',
      delaDele: 'dela',
      queridaQuerido: 'Querida',
      filhaFilho: artigo ? 'a filha' : 'filha',
      umFilho: 'uma filha',
    };
  }
  return {
    elaEle: 'o bebê',
    delaDele: 'do bebê',
    queridaQuerido: 'Querida criança',
    filhaFilho: 'criança',
    umFilho: 'um bebê',
  };
}

export function adaptGeneroTextoBebe(texto: string, sexo: string | null | undefined): string {
  if (sexo !== 'menino') return texto;
  return texto
    .replace(/\bfrustrada\b/g, 'frustrado')
    .replace(/\bquieta\b/g, 'quieto')
    .replace(/\bagitada\b/g, 'agitado')
    .replace(/\bcomunicativa\b/g, 'comunicativo')
    .replace(/\bcarinhosa\b/g, 'carinhoso')
    .replace(/\batenciosa\b/g, 'atencioso')
    .replace(/\bsobrecarregada\b/g, 'sobrecarregado')
    .replace(/\bconvide-a\b/g, 'convide-o')
    .replace(/\bela\b/g, 'ele');
}

export function textoConvivenciaPaisBebe(
  expressaoPais: Array<number | null>,
  expressaoBebe: number | null,
  destinoBebe: number | null,
  primeiroNome: string,
): { texto: string; dica: string } {
  const paisValidos = expressaoPais.filter((n): n is number => n != null && n > 0);
  const expB = chaveNumeroBebe(expressaoBebe);
  const destB = chaveNumeroBebe(destinoBebe);
  const destInfo = DESTINO_BEBE[destB] ?? DESTINO_BEBE[1]!;

  if (paisValidos.length === 0) {
    return {
      texto: `O caminho de ${destInfo.titulo.toLowerCase()} (Destino ${destB}) de ${primeiroNome} encontra força na rotina simples e afetuosa da casa.`,
      dica: 'Dica: rituais simples em família (a refeição juntos, a história antes de dormir) fortalecem a convivência.',
    };
  }

  const mesmos = paisValidos.some((p) => chaveSimplesBebe(p) === chaveSimplesBebe(expB));
  if (mesmos) {
    return {
      texto: `Vocês compartilham ritmos parecidos de expressão com ${primeiroNome}, o que facilita entender rápido o jeito do dia a dia e criar sintonia em casa.`,
      dica: 'Dica: rituais simples em família (a refeição juntos, a história antes de dormir) deixam essa parceria ainda mais gostosa.',
    };
  }

  return {
    texto: `As energias dos pais somam olhares diferentes com ${primeiroNome} (Expressão ${expB} e Destino ${destB}): essa mistura enriquece a convivência e amplia repertórios em casa.`,
    dica: 'Dica: valorizem o jeito próprio de cada um e mantenham momentos fixos de conversa e brincadeira em família.',
  };
}
