/**
 * Central de Interpretações Numerológicas — "The Celestial Alchemist"
 * Contém textos profundos, inspiradores e motivadores para cada número (1-9, 11 e 22)
 * divididos nas 5 dimensões principais: Destino, Expressão, Motivação, Impressão e Missão.
 */

export const NUMERO_VIBRACAO: Record<number, string> = {
  1: 'Iniciativa e Autonomia',
  2: 'Sensibilidade e Mediação',
  3: 'Criatividade e Comunicação',
  4: 'Método e Construção',
  5: 'Versatilidade e Movimento',
  6: 'Harmonia e Cuidado',
  7: 'Análise e Profundidade',
  8: 'Poder e Abundância',
  9: 'Compaixão e Humanidade',
  11: 'Intuição e Inspiração',
  22: 'Visão e Manifestação',
};

export const NUMERO_NOMES: Record<number, string> = {
  1: 'Independência e Liderança',
  2: 'Diplomacia e Cooperação',
  3: 'Expressão e Criatividade',
  4: 'Trabalho e Organização',
  5: 'Versatilidade e Inovação',
  6: 'Harmonia e Cuidado',
  7: 'Sabedoria e Espiritualidade',
  8: 'Poder e Sucesso Material',
  9: 'Compaixão e Altruísmo',
  11: 'Intuição e Inspiração Superior',
  22: 'Materialização e Construção Global',
};

export const NUMERO_PALAVRAS_CHAVE: Record<number, string> = {
  1: 'Autonomia · Pioneirismo · Iniciativa',
  2: 'Parceria · Receptividade · Mediação',
  3: 'Carisma · Otimismo · Comunicação',
  4: 'Disciplina · Estabilidade · Método',
  5: 'Liberdade · Adaptabilidade · Mudança',
  6: 'Família · Equilíbrio · Conciliação',
  7: 'Análise · Mistério · Solitude',
  8: 'Resultado · Autoridade · Prosperidade',
  9: 'Universalidade · Desapego · Cura',
  11: 'Despertar · Sensibilidade · Visão Profética',
  22: 'Legado · Estruturação · Escala Monumental',
};

export const DESTINO_TITULO: Record<number, string> = {
  1: 'Liderança e Autonomia',
  2: 'Parceria e Equilíbrio',
  3: 'Criatividade e Expressão',
  4: 'Estrutura e Estabilidade',
  5: 'Liberdade e Transformação',
  6: 'Harmonia e Cuidado',
  7: 'Sabedoria e Introspecção',
  8: 'Prosperidade e Poder',
  9: 'Compaixão e Conclusão',
  11: 'Intuição e Iluminação',
  22: 'Construção e Manifestação',
};

export const DESTINO_DESC: Record<number, string> = {
  1: 'A magnífica trilha do pioneirismo e da liderança inspiradora. Você nasceu com o fogo sagrado da autonomia, com a missão de inaugurar novos caminhos, tomar decisões corajosas e guiar a si mesmo e aos outros rumo à evolução. Sua presença emana o poder do início, rompendo barreiras com originalidade e força de vontade absoluta. O grande portal do seu Destino se abre quando você abraça a sua individualidade divina sem medo da solidão, liderando sempre pelo exemplo e transformando ideias puras em ações de impacto duradouro.',
  2: 'A harmoniosa trilha da cooperação, diplomacia e união sagrada. Sua alma veio ao mundo para ser a ponte onde há abismos, o bálsamo onde há conflito e a inteligência sensível que traz equilíbrio e beleza a qualquer ambiente. Você possui um dom natural de perceber as entrelinhas e orquestrar parcerias extraordinárias. Seu sucesso e felicidade florescem quando você assume o papel de pacificador e mediador com sabedoria, aprendendo a valorizar e sustentar sua própria voz enquanto eleva e une aqueles ao seu redor.',
  3: 'A luminosa trilha da autoexpressão, do carisma e da criatividade sem limites. Você é a voz e o canal da inspiração divina, nascido para comunicar a verdade com beleza, entusiasmo e magnetismo contagiante. Seu Destino é dissipar as sombras do mundo através das palavras, da arte, do riso e da conexão humana autêntica. Sua presença irradia cor e expansão. Quando você expressa sua verdade mais pura com o coração aberto, você ativa o magnetismo da prosperidade e atua como um farol de alegria e expansão para a humanidade.',
  4: 'A sólida e venerável trilha da construção material e do legado eterno. Sua alma encarnou para converter o abstrato em concreto, organizando o caos com método, disciplina, paciência e integridade inabalável. Você é a fundação segura e confiável de grandes empreendimentos, famílias e comunidades. Seu Destino é erguido bloco a bloco, com resiliência divina e excelência nos detalhes. Seu verdadeiro poder se manifesta quando você compreende que o trabalho estruturado e constante é um ato sagrado que ancora o divino na realidade material.',
  5: 'A dinâmica e eletrizante trilha da liberdade, da versatilidade e da evolução contínua. Você é o eterno viajante e o catalisador de mudanças profundas, nascido para quebrar padrões ultrapassados, experimentar a vida em toda a sua amplitude e trazer inovação ao mundo. Sua presença é magnética, audaciosa e repleta de adaptabilidade inteligente. Seu Destino é prosperar no fluxo do movimento e das transformações, ensinando à humanidade que a verdadeira estabilidade reside na coragem de mudar, expandir e evoluir constantemente.',
  6: 'A acolhedora e amorosa trilha da harmonia, da responsabilidade e do cuidado comunitário. Sua alma veio com a sagrada missão de nutrir, proteger e criar santuários de paz, beleza e equilíbrio — seja na família, nos negócios ou na sociedade. Você é o porto seguro e o terapeuta natural dos que te cercam. O ápice do seu Destino é alcançado ao servir com generosidade genuína, compartilhando amor e sabedoria curativa, enquanto aprende que a arte do cuidado perfeito começa por valorizar, amar e priorizar a si mesmo.',
  7: 'A profunda e enigmática trilha da sabedoria superior, da introspecção e do conhecimento revelado. Você é o eterno buscador da verdade, dotado de uma mente analítica extraordinária e de uma sensibilidade espiritual aguçada. Seu Destino é mergulhar abaixo da superfície, desvelar o que está oculto e decodificar os mistérios da existência. A sua energia irradia respeitabilidade intelectual e mistério. Ao silenciar o ruído externo e confiar na sua intuição soberana, você se torna um mestre e guia para os que buscam clareza mental e direção espiritual.',
  8: 'A soberana trilha da manifestação do poder, da justiça e da abundância infinita. Você nasceu para reinar no plano material com sabedoria, visão executiva impecável e autoridade ética inabalável. Sua alma tem a capacidade única de multiplicar recursos materiais, coordenar grandes iniciativas e manifestar prosperidade de maneira estruturada e justa. O triunfo do seu Destino ocorre quando você integra o poder do dinheiro com o propósito da alma, liderando com generosidade e demonstrando que a verdadeira riqueza é um fluxo de prosperidade compartilhada.',
  9: 'A sublime trilha do amor universal, da compaixão e do serviço humanitário. Como portador da vibração final dos números simples, você encerra ciclos de evolução carregando a sabedoria acumulada de toda a jornada da alma. Seu Destino é atuar como um farol de compaixão, tolerância e amor incondicional, curando feridas coletivas e elevando a consciência da humanidade. O seu poder atinge a plenitude máxima ao viver com desapego iluminado, ensinando que o maior ato de poder pessoal é a dedicação amorosa à evolução do todo.',
  11: 'A sagrada e eletrizante trilha do Mensageiro Divino e da Iluminação espiritual. Como número mestre, o 11 traz uma voltagem energética imensa e uma intuição profética extraordinária. Você nasceu para atuar como uma antena cósmica viva, canalizando verdades superiores, despertando consciências e servindo como um farol inspirador de espiritualidade prática no mundo. Sua jornada é intensa e repleta de sensibilidade. Ao dominar a ansiedade e ancorar sua energia extraordinária no presente, você inspira, cura e guia milhares de almas rumo ao despertar definitivo.',
  22: 'A grandiosa trilha do Mestre Construtor e do Arquiteto Universal. O 22 é o número mestre da manifestação definitiva em grande escala, unificando a mais alta visão espiritual com a execução material impecável. Você nasceu com o dom extraordinário de converter sonhos monumentais que parecem impossíveis em estruturas físicas, sistemas sociais ou impérios que beneficiam a coletividade. Seu Destino é projetar e edificar legados imensos que transcenderão o tempo, servindo à humanidade por muitas gerações.',
};

export const EXPRESSAO_TITULO: Record<number, string> = {
  1: 'Liderança Natural',
  2: 'Diplomacia e Parceria',
  3: 'Expressão e Criatividade',
  4: 'Organização e Método',
  5: 'Versatilidade e Comunicação',
  6: 'Cuidado e Responsabilidade',
  7: 'Análise e Profundidade',
  8: 'Execução e Resultados',
  9: 'Generosidade e Visão',
  11: 'Inspiração e Sensibilidade',
  22: 'Visão e Manifestação',
};

export const EXPRESSAO_DESC: Record<number, string> = {
  1: 'Sua expressão natural é um vulcão de liderança criativa e pioneirismo brilhante. Você emana autoconfiança, independência e coragem instantânea para tomar iniciativas onde os outros hesitam. Seu magnetismo se manifesta ao assumir a dianteira, abrindo novas fronteiras, liderando projetos ambiciosos e projetando no mundo uma presença soberana, autêntica e altamente inovadora.',
  2: 'Sua expressão natural é um manto de empatia profunda, tato refinado e diplomacia divina. Você atua como o elo de conexão, harmonizando tensões e unindo as pessoas com uma gentileza irresistível e escuta ativa. Seu poder se destaca ao tecer parcerias de sucesso, mediar conflitos com equilíbrio notável e projetar uma energia de acolhimento, respeito mútuo e colaboração refinada.',
  3: 'Sua expressão natural é um espetáculo de carisma contagiante, brilhantismo comunicativo e criatividade exuberante. Você encanta e inspira com extrema facilidade, utilizando as palavras, a arte ou sua simples presença para iluminar qualquer ambiente. Seu talento brilha ao espalhar otimismo, expressar ideias visionárias de forma envolvente e atuar como um canal autêntico de expansão e alegria.',
  4: 'Sua expressão natural é um monumento de confiabilidade absoluta, estabilidade exemplar e método impecável. Você projeta uma presença estruturada, organizada e focada na excelência técnica e na durabilidade das ações. Seu diferencial se destaca ao gerenciar recursos complexos com precisão, converter o caos em ordem sistêmica e materializar ideias abstratas em legados de solidez indiscutível.',
  5: 'Sua expressão natural é um turbilhão de dinamismo contagiante, versatilidade inteligente e adaptabilidade rápida. Você é um comunicador nato e magnético, capaz de navegar por múltiplas áreas e atrair a atenção do público ao trazer o novo e o revolucionário. Seu brilho reside na sua flexibilidade para inovar e no dom de catalisar mudanças profundas em ambientes estagnados.',
  6: 'Sua expressão natural é um abraço acolhedor de harmonia restauradora, responsabilidade elevada e senso de justiça primoroso. Você emana amor, beleza e atenção aos detalhes, criando ambientes esteticamente impecáveis e emocionalmente seguros. Seu talento se sobressai ao resolver problemas complexos com equilíbrio, aconselhar com sabedoria do coração e proteger os que ama.',
  7: 'Sua expressão natural é a de uma mente analítica de precisão cirúrgica e profunda espiritualidade intuitiva. Você projeta uma imagem de seriedade respeitável, sabedoria enigmática e busca incansável pela perfeição técnica. Seu magnetismo único brilha ao desvelar segredos técnicos ou filosóficos complexos, aconselhando com substância rara e clareza mental absoluta.',
  8: 'Sua expressão natural é a de uma presença executiva de alta autoridade, poder de decisão instantâneo e maestria material incontestável. Você projeta segurança de soberania, liderando com pragmatismo cirúrgico e gerando resultados práticos de grande relevância econômica e operacional. Seu sucesso reside no dom de estruturar o crescimento abundante com ética e solidez.',
  9: 'Sua expressão natural é a de um farol de sabedoria universal, generosidade comovente e visão humanitária ampliada. Você transcende interesses mesquinhos, abraçando causas de impacto coletivo com carisma comovente e compaixão profunda. Seu magnetismo se manifesta ao inspirar grandes grupos à transformação interior e ao acolhimento incondicional das diferenças.',
  11: 'Sua expressão natural é um canal de intuição mística arrebatadora e presença inspiradora de alta frequência. Sua sensibilidade extraordinária atua como uma antena espiritual, atraindo corações com um magnetismo carismático inesquecível. Você veio para iluminar a mente das pessoas com insights elevados e servir de ponte viva entre o sutil e o prático.',
  22: 'Sua expressão natural é a força monumental do Realizador Universal. Você combina uma imaginação de longo alcance com uma capacidade técnica e executiva invejável de materialização. Seu brilho máximo ocorre ao projetar, organizar e executar sistemas práticos monumentais que transformam a qualidade de vida e criam um patrimônio eterno para a humanidade.',
};

export const MOTIVACAO_DESC: Record<number, string> = {
  1: 'O motor que inflama o âmago mais profundo de sua alma é a sede inabalável de autonomia, protagonismo e independência absoluta. Você é movido pelo desafio de ser o arquiteto exclusivo das suas escolhas e o primeiro a conquistar cumes inexplorados. Nada te dá mais vitalidade do que liderar o próprio destino com coragem, enquanto a dependência ou a mediocridade asfixiam seu espírito de pioneiro.',
  2: 'O motor que acalma e nutre o âmago de sua alma é a profunda busca pela harmonia nas relações, conexão autêntica e paz espiritual. Você é movido pelo desejo sincero de cooperar, acolher e construir parcerias sólidas onde o respeito mútuo reine absoluto. O isolamento, os conflitos agressivos e o desequilíbrio emocional drenam sua energia, pois sua essência clama por cooperação e amor compartilhado.',
  3: 'O motor vibrante que alimenta o âmago mais profundo de sua alma é o impulso urgente de criar, expressar sua verdade e levar leveza ao mundo. Sua alma clama por liberdade criativa, comunicação inspiradora, riso e conexão estética refinada. A repressão de sua expressão, a rotina cinzenta e a falta de beleza geram um imenso vazio interior, pois você nasceu para colorir a realidade.',
  4: 'O motor sólido que estabiliza o âmago de sua alma é a necessidade imperiosa de segurança, método, estrutura sólida e construção de longo prazo. Você se sente verdadeiramente vivo ao ver a ordem imperar e ao saber que cada passo está firmemente alinhado rumo a um legado inabalável. O caos, a superficialidade e a volatilidade te desestabilizam; sua alma busca a paz duradoura do solo firme.',
  5: 'O motor dinâmico e veloz que incendeia o âmago de sua alma é o desejo insaciável de liberdade, novidade, aventuras ricas e expansão constante. Você é movido pelo fluxo contínuo das mudanças e pela coragem de desbravar horizontes desconhecidos. Rotinas aprisionantes, burocracias tediosas e mentes fechadas sufocam sua alma, que respira inovação e adaptabilidade inteligente.',
  6: 'O motor amoroso e curador que harmoniza o âmago de sua alma é a nobre aspiração de amar, cuidar e estabelecer o equilíbrio perfeito no seu clã e no mundo. Sua alma encontra nutrição profunda ao criar lares aconchegantes, conciliar dores com palavras suaves e proteger os necessitados. O desinteresse, a feiura estética e a discórdia ao seu redor impedem sua alma de repousar em paz.',
  7: 'O motor misterioso e elevado que governa o âmago de sua alma é a busca obcecada pela verdade oculta, sabedoria genuína e perfeição íntima. Você é impulsionado por compreender o incompreensível, analisar sistemas profundos e conectar-se à espiritualidade sem dogmas. A falsidade intelectual, o ruído social fútil e a pressa rasa te esgotam; sua alma anseia pelo silêncio revelador.',
  8: 'O motor potente e realizador que impulsiona o âmago de sua alma é a ambição virtuosa de manifestar riqueza material com propósito, autoridade soberana e conquistas sólidas de alta escala. Você se sente realizado ao ver suas visões executivas materializarem-se em abundância tangível e conquistas concretas. A inércia passiva e a pobreza de visão limitam o poder realizador de sua alma.',
  9: 'O motor iluminado e universal que transcende o âmago de sua alma é o anseio incondicional de servir com amor desinteressado, promover a cura coletiva e auxiliar o mundo a encerrar velhos ciclos. Sua alma se expande e encontra êxtase supremo ao doar-se a causas humanitárias elevadas. O egoísmo egoico e a mesquinharia te entristecem, pois sua morada espiritual é a compaixão universal.',
  11: 'O motor transcendente e elétrico que desperta o âmago de sua alma é a profunda chamada interior para canalizar mensagens divinas, inspirar a humanidade e atuar como canal espiritual direto. Você sente uma fome incurável de propósito elevado e de conexões metafísicas. Viver uma vida meramente comum ou materialista esgota sua energia vital, pois sua alma exige a vibração da luz.',
  22: 'O motor monumental que orquestra o âmago de sua alma é o impulso imparável de projetar e materializar legados de escala global que sirvam à evolução. Você é motivado pela construção de sistemas duradouros, infraestruturas gigantescas e projetos que beneficiam as massas humanas. Ideias pequenas ou sem impacto coletivo não conseguem aquecer o fogo criador e realizador de sua alma.',
};

export const IMPRESSAO_DESC: Record<number, string> = {
  1: 'A primeira impressão que você emite de forma imediata ao mundo é de pura força de liderança autônoma, coragem de pioneiro e determinação férrea. As pessoas te percebem instantaneamente como alguém independente, confiante e extremamente capaz de resolver problemas difíceis de forma rápida, com uma postura altiva e decidida que inspira respeito imediato.',
  2: 'A primeira impressão que você emite de forma imediata ao mundo é de extrema doçura, diplomacia exemplar e sensibilidade pacífica. O mundo externo te lê como uma presença gentil, discreta, acolhedora e de aproximação fácil — alguém a quem se pode confidenciar segredos e que traz harmonia automática, agindo como um mediador natural.',
  3: 'A primeira impressão que você emite de forma imediata ao mundo é de brilho carismático exuberante, entusiasmo magnético e inteligência fluida. Ao entrar em qualquer recinto, você irradia uma presença leve, alegre, artística e altamente amigável. As pessoas te leem como alguém de mente aberta, dotado de refinada capacidade de encantar e expressar.',
  4: 'A primeira impressão que você emite de forma imediata ao mundo é de solidez pétrea, seriedade profissional indiscutível e confiabilidade à prova de falhas. As pessoas te percebem como alguém disciplinado, organizado, extremamente ético e que fala com base na realidade dos fatos — o porto seguro a quem todos buscam quando precisam de ordem.',
  5: 'A primeira impressão que você emite de forma imediata ao mundo é de pura vitalidade magnética, dinamismo irresistível e curiosidade contagiante. Você projeta uma aura jovem, aventureira e versátil — alguém que se adapta a qualquer classe social ou cultura com maestria e que parece estar sempre conectado às novas tendências e ao movimento.',
  6: 'A primeira impressão que você emite de forma imediata ao mundo é de profundo senso de equilíbrio amoroso, elegância estética primorosa e responsabilidade acolhedora. O mundo te percebe como o conselheiro ideal, alguém focado no bem-estar comunitário, que preza pelos bons modos e pela harmonia visual de forma natural.',
  7: 'A primeira impressão que você emite de forma imediata ao mundo é de enigmática distinção intelectual, mistério elegante e sabedoria silenciosa. As pessoas te percebem como uma presença reservada, altamente analítica e seletiva — alguém que não joga conversa fora e cuja palavra, quando proferida, carrega o peso inquestionável da autoridade.',
  8: 'A primeira impressão que você emite de forma imediata ao mundo é de notável autoridade executiva, elegância clássica e poder de manifestação inegável. As pessoas te enxergam de imediato como um líder prático de negócios e conquistas, alguém nascido para comandar grandes estruturas com frieza estratégica e sucesso assegurado.',
  9: 'A primeira impressão que você emite de forma imediata ao mundo é de imensa generosidade humana, tolerância acolhedora e sabedoria filosófica superior. As pessoas te leem como alguém desprovido de preconceitos, com braços abertos ao mundo e uma aura acolhedora que transcende fronteiras, inspirando confiança profunda imediata.',
  11: 'A primeira impressão que você emite de forma imediata ao mundo é de uma aura enigmática de magnetismo espiritual extraordinário e sensibilidade incomum. O mundo te lê como um "ser de outro plano" — alguém que emana sabedoria profética, olhos expressivos e uma presença sutil inspiradora que desperta segredos e emoções raras na alma de quem te vê.',
  22: 'A primeira impressão que você emite de forma imediata ao mundo é de imensa autoridade estrutural e capacidade monumental de realização prática. As pessoas te percebem como um gigante silencioso do planejamento de longo prazo, dotado de uma visão que parece abarcar a totalidade de problemas complexos de forma extremamente organizada.',
};

export const MISSAO_DESC: Record<number, string> = {
  1: 'Sua Missão sagrada é direcionar todos os seus dons para a abertura pioneira de novos caminhos e a consagração do seu poder pessoal e independência espiritual. Você veio para inspirar o mundo pela coragem individual, provando que um único pioneiro determinado é capaz de redirecionar a história. Seja ousado, tome a dianteira!',
  2: 'Sua Missão sagrada é atuar como o tecelão supremo da harmonia planetária, unindo pessoas através da diplomacia refinada, da escuta sagrada e da consolidação de parcerias equilibradas. Seu chamado divino é demonstrar que a força mais sutil da união respeitosa e inteligente é capaz de dissolver barreiras aparentemente indestrutíveis.',
  3: 'Sua Missão sagrada é iluminar e expandir a mente coletiva através do dom sagrado da palavra inspirada, da autoexpressão divina e do entusiasmo contagiante. Você veio para arrancar sorrisos da rigidez existencial, espalhar beleza estética e provar que a alegria e o carisma são portais diretos de conexão com a prosperidade infinita.',
  4: 'Sua Missão sagrada é edificar estruturas eternas de segurança, ordem material e legados tangíveis que sirvam de abrigo e base firme para a humanidade. Você veio para provar que com paciência sábia, trabalho ético estruturado e disciplina impecável, a imaginação humana se converte em realidade física indestrutível.',
  5: 'Sua Missão sagrada é ser o sopro de vento transformador que liberta as almas do peso morto da estagnação, promovendo a adaptabilidade e a evolução veloz. Você veio para questionar dogmas falidos, comunicar ideias revolucionárias e demonstrar que a verdadeira liberdade reside na coragem de experimentar e crescer sempre.',
  6: 'Sua Missão sagrada é orquestrar a harmonia afetiva e a cura profunda do seu clã e da comunidade, plantando sementes de justiça, equilíbrio estético e acolhimento familiar. Seu chamado é manifestar o amor em ação responsável, mostrando que o afeto ético e a responsabilidade mútua são a verdadeira fundação da saúde da alma.',
  7: 'Sua Missão sagrada é atuar como o decodificador sábio dos mistérios da vida, extraindo conhecimento superior e clareza mental do silêncio da introspecção filosófica. Você veio para purificar a mente social da ignorância fútil, guiando a si mesmo e aos outros rumo às profundezas da ciência oculta e da sabedoria eterna.',
  8: 'Sua Missão sagrada é dominar o plano material com integridade exemplar, assumindo a soberania executiva e gerando prosperidade abundante para a elevação coletiva. Você veio para provar que a abundância de recursos materiais, quando governada por um espírito justo e generoso, atua como o motor mais potente de justiça e bem-estar.',
  9: 'Sua Missão sagrada é viver a plenitude do amor universal e da compaixão cósmica, auxiliando a humanidade a curar dores antigas, perdoar e encerrar ciclos de evolução de maneira sagrada. Você veio para ser o farol generoso que acolhe sem julgar, mostrando que a entrega dedicada ao próximo é a consagração máxima da alma.',
  11: 'Sua Missão sagrada é atuar como o Mensageiro Cósmico de Luz e Inspiração, canalizando a sensibilidade espiritual e visões extraordinárias para a transição planetária. Você veio para sustentar uma frequência vibratória elevada que atua como faísca de despertar íntimo para milhares de pessoas, guiando-as com sabedoria profética.',
  22: 'Sua Missão sagrada é ser o Mestre Construtor da Nova Era, unificando a mais alta aspiração espiritual da alma com a engenharia física e organizacional em escala monumental. Você veio para liderar a materialização de sistemas práticos, construções físicas e legados globais que estruturarão a felicidade humana por séculos.',
};
