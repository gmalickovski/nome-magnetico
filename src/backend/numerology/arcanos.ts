/**
 * Arcanos da Numerologia Cabalística (1–99).
 * 
 * Totalmente baseado no material canônico do curso de Numerologia Cabalística do PDF.
 */

export interface Arcano {
  numero: number;
  nome: string;
  palavraChave: string;
  descricao: string;
  desafio: string;
}

/** Reduz um arcano > 9 somando seus dígitos para interpretação base. */
export function reduzirArcano(n: number): number {
  if (n === 0) return 22;
  let v = n;
  while (v > 9 && v !== 11 && v !== 22) {
    v = String(v).split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return v;
}

export const ARCANOS: Record<number, Arcano> = {
  // =========================================================================
  // ARCANOS MAIORES (1–22)
  // =========================================================================
  1: {
    numero: 1,
    nome: 'O Mago',
    palavraChave: 'Vontade e Iniciativa',
    descricao: 'Aponta para os potenciais criativos a serem manifestados; momento de identificar as oportunidades inexploradas e começar a nova jornada. É preciso ser um em si mesmo e unido ao mundo espiritual, para que haja experiência espiritual reveladora. A intuição será seu guia nesse sentido. Eis o primeiro aconselhamento, do primeiro Arcano ativo. O Mago instiga para se iniciar o processo da autoconsciência, para alcançar a individuação; ele guia para uma viagem pelo mundo interior de nosso EU mais profundo transcendendo o ego superficial.',
    desafio: 'Evitar a inatividade ou a arrogância egoica que cega para a orientação espiritual.',
  },
  2: {
    numero: 2,
    nome: 'A Papisa',
    palavraChave: 'Intuição e Sabedoria',
    descricao: 'Aponta para a percepção sutil da mente intuitiva guiando o pensamento e a razão. A dualidade proposta por este Arcano se estabelece a partir de dois centros de observação, dois princípios, sendo um ativo e outro passivo. O intelecto representa o princípio feminino da mente, enquanto a imaginação fecundadora é seu princípio masculino. O intelecto sem a fecundação da imaginação guiada pelo coração é estéril. A Papisa governa pela paciência feminina, pelo amor e pela persistência.',
    desafio: 'Evitar a passividade fria e o retraimento emocional.',
  },
  3: {
    numero: 3,
    nome: 'A Imperatriz',
    palavraChave: 'Criatividade e Abundância',
    descricao: 'Aponta para a natureza sociável; a magia sagrada que fecunda a criação para gerar abundância. Arte, ciência, magia e mística; o êxito nos empreendimentos pela firmeza de propósito, pela ação da vontade e pela fé. Providência por ação da vontade ou por fatalidade. A providência ilumina o presente, a vontade cria o futuro, mas ela é limitada pela fatalidade, consequência inexorável do passado. A Imperatriz convida para tomar um novo caminho, o da regeneração, ou da geração do novo na expressão criativa da imaginação.',
    desafio: 'Evitar a futilidade, vaidade fútil ou dispersão de energia.',
  },
  4: {
    numero: 4,
    nome: 'O Imperador',
    palavraChave: 'Estrutura e Autoridade',
    descricao: 'Aponta para o poder verdadeiro e único da lei. Ser alguma coisa, saber alguma coisa e poder alguma coisa é que tornam uma pessoa dotada de autoridade. Isso não substitui a autoridade divina, mas, pelo contrário, o Imperador resigna-se a ela renunciando ao desejo de autoridade do ego. O Imperador reflete a autoridade espiritual na humanização do ser humano; a verdade e a honestidade.',
    desafio: 'Evitar o autoritarismo, a tirania e a rigidez mental.',
  },
  5: {
    numero: 5,
    nome: 'O Papa',
    palavraChave: 'Sabedoria e Ensinamento',
    descricao: 'Aponta para uma iniciação em alguma forma de conhecimento superior, que liberta o homem da escravidão da matéria. Estabelece o equilíbrio nos comportamentos diversos através da contenção dos impulsos diversos – emocional, intelectual, físico. O número 5 reitera o quinto elemento, a quintessência só alcançável pelo homem que transcende os quatro elementos da natureza terrena, comuns tanto ao homem quanto aos animais. O Papa representa a personificação exteriorizada da busca do homem pela conexão com a divindade.',
    desafio: 'Evitar o dogmatismo e a intolerância a novas ideias.',
  },
  6: {
    numero: 6,
    nome: 'Os Enamorados',
    palavraChave: 'Escolhas e Harmonia',
    descricao: 'Aponta para o livre arbítrio; a escolha que se fizer conduzirá para a evolução consciente, ou para algum desvio ou estagnação. Cada escolha deve ser feita no devido tempo, abstendo-se dos envolvimentos emocionais. O arcano do Enamorado expõe os conflitos diversos no anseio pelo amor dedicado e esperançoso, mas ainda emocional e carregado de desejos. É preciso fazer uma escolha – desapegar-se do amor emoção e prosseguir na senda da consciência, ou permanecer prisioneiro dos desejos e fantasias.',
    desafio: 'Evitar a indecisão crônica ou escolhas baseadas puramente em caprichos e desejos do ego.',
  },
  7: {
    numero: 7,
    nome: 'O Carro',
    palavraChave: 'Determinação e Vitória',
    descricao: 'Aponta para uma nova direção na vida. Essa nova direção pode levar ao triunfo sobre as tentações mundanas, ou à queda na tentação espiritual do vitorioso pela sua própria vitória – a mais sutil e perigosa de todas as tentações, chamada também de ego espiritualidade. O arcado do Carro nos adverte para o perigo da megalomania e nos ensina sobre o verdadeiro triunfo pelo processo da individuação – a consciência de si mesmo. O autoconhecimento nos torna conscientes da conexão existente entre a jornada interior e a exterior, do destino e da transformação da consciência a partir dessa percepção de si mesmo.',
    desafio: 'Para triunfar é preciso humildade; a queda resulta da arrogância e megalomania.',
  },
  8: {
    numero: 8,
    nome: 'A Justiça',
    palavraChave: 'Equilíbrio e Integridade',
    descricao: 'Aponta para o exercício do livre arbítrio e suas consequências. O homem age pelo seu livre arbítrio, e a lei reage por seus efeitos visíveis e invisíveis, em constante convite ao esforço da consciência para chegar à experiência da realidade que representa a compreensão da verdade que a justiça exprime. O simbolismo da justiça reflete uma união harmoniosa entre forças opostas equilibradas na neutralidade do julgamento. A espada da justiça divina será implacável na aplicação das sanções da lei de causa e efeito aos que fazem mau uso do seu livre arbítrio, principalmente no exercício de qualquer forma de poder.',
    desafio: 'Evitar a hipocrisia, a dureza nos julgamentos e o abuso de autoridade.',
  },
  9: {
    numero: 9,
    nome: 'O Eremita',
    palavraChave: 'Introspecção e Sabedoria',
    descricao: 'Aponta para o esforço para se iluminar a escuridão do nosso mundo interior ainda obscuro e desconhecido – da escuridão das trevas da ignorância, da passividade e da preguiça; da escuridão do conhecimento superior e do esforço ainda por fazer. A prudência é a consciência presente de estar entre as duas escuridões – a escuridão das trevas da ignorância, do ponto negro do subconsciente; a escuridão do ponto de luz da síntese absoluta do incognoscível, que ofusca por seu brilho intenso. O arcano do Eremita adverte ao homem que ele é o que está em seu coração; nele reside e se revela a humanização do ser humano. Envolve a experiência de aceitar o caminho solitário da individuação, de nos tornarmos um só eu pelo autoconhecimento.',
    desafio: 'Evitar o isolamento depressivo, a passividade e a arrogância espiritual.',
  },
  10: {
    numero: 10,
    nome: 'A Roda da Fortuna',
    palavraChave: 'Ciclos e Transformação',
    descricao: 'Aponta para a ascensão e queda na roda das sucessivas reencarnações. Um aspecto nosso aspira a ascensão pela evolução; o outro tende a perpetuar-se prisioneiro das armadilhas do mundo sensorial. Esses dois aspectos de nossa natureza são representados pela animalidade aspirando por sua humanização, e pela humanidade caindo constantemente na animalidade dos comportamentos do homem. O arcano da Roda da Fortuna adverte para a necessidade de se libertar do controle automático da natureza animal, para aceitar os paradoxos da vida e saltar definitivamente para o lado da evolução pela regeneração de nossa natureza inferior.',
    desafio: 'Evitar a passividade diante dos ciclos e a dependência dos instintos animais inferiores.',
  },
  11: {
    numero: 11,
    nome: 'A Força',
    palavraChave: 'Coragem e Autodomínio',
    descricao: 'Aponta para o domínio de nossa natureza inferior instintiva, por ação de nossa natureza superior inteligente. Deixar o plano da quantidade e nos elevarmos ao plano da qualidade – sair do plano do ter e entrar no plano do ser. Mas isso deve ser feito sem maltratar nossa natureza animal, porquanto ela permanece semiconsciente em nós, e tem suas funções. Equivale a uma transformação das forças mentais e psíquicas e ao amadurecimento emocional. Expõe uma ação de coragem e fé.',
    desafio: 'Adverte para a necessidade de suavizar o tom de nossa agressividade dando atenção aos nossos aspectos de natureza bruta, para educá-los ao serviço de nossa evolução.',
  },
  12: {
    numero: 12,
    nome: 'O Enforcado',
    palavraChave: 'Pausa e Perspectiva',
    descricao: 'Aponta para a resignação ao plano da lei maior. A força da gravitação se inverte impelindo o homem para a vida espiritual. A gravitação terrestre atrai para o poder, a posse, a tirania, o egoísmo; a gravitação espiritual atrai para o desapego, a resignação; à renúncia ao mundo e à obediência às leis supremas da evolução. Isso não implica desprezar o mundo, mas desapegar-se dele para desfrutar o melhor da vida nele – a espiritualidade. Esse chamamento poderá ocorrer por um sinal, por um sentimento sutil emergente da alma pela própria intuição, ou pode vir através de uma derrocada nos empreendimentos da vida material.',
    desafio: 'O arcano do Enforcado adverte para a força do destino, poderosa, que a qualquer momento poderá entrar em ação como um chamamento à iniciação espiritual.',
  },
  13: {
    numero: 13,
    nome: 'A Morte',
    palavraChave: 'Transformação e Renovação',
    descricao: 'Aponta para o processo constante de morte e renascimento que a vida nos propõe, no sentido metafísico e no sentido real, transformando a consciência para o seu despertar psíquico. No sentido metafísico implica mudar a atitude diante da vida; uma morte do ego e a aceitação da experiência transformadora, que tanto pode vir na forma de um novo aprendizado, de um acidente ou de uma doença séria. No seu sentido real é quando acontece a partida para o outro lado da vida, literalmente. Nos lembra que todos os dias nós morremos um pouco e renascemos.',
    desafio: 'Adverte para o sono psíquico da consciência adormecida nas ilusões da materialidade; nos propõe o renascimento para uma vida mais espiritualizada.',
  },
  14: {
    numero: 14,
    nome: 'A Temperança',
    palavraChave: 'Equilíbrio e Integração',
    descricao: 'Aponta para a ordem do pensamento relativo à polaridade e às possibilidades que ela nos propicia para o conhecimento e a realização espirituais. As energias criativas da vida não podem fluir pelos canais escolhidos pelo ego, por mais razoáveis que sejam as justificativas da mente consciente. Elas seguem o fluxo determinante da vida para as finalidades as quais se destinam em nossa evolução. Nos propõe fluidez e adaptabilidade às novas condições da vida depois de um processo de transformações.',
    desafio: 'Adverte para o fluir da consciência entre os dois polos da vida – o espiritual e o material; entre o eu superior e o ego consciente.',
  },
  15: {
    numero: 15,
    nome: 'O Diabo',
    palavraChave: 'Sombra e Apego',
    descricao: 'Aponta para os segredos do fogo das paixões e da embriaguez do ego no caminho da espiritualização. Para lidar com o mal, devemos nos preservar à certa distância, se quisermos evitar o risco de nos vermos envolvidos por ele tendo nossos impulsos criativos paralisados, e pior ainda, pelo risco de fornecermos as armas aos maus. Sem liberdade para escolher não pode haver moral verdadeira, no entanto, nenhuma escolha deve ser feita por impulso dos desejos do ego ou das paixões escaldantes da sensualidade. É a sombra por detrás da luz, que muitas vezes não percebemos justamente porque ela está atrás de nós.',
    desafio: 'Adverte para o perigo da rebelião do ego que deseja sobrepor-se às leis divinas estabelecendo nova ordem na espiritualização do homem – a egolatria ou ego espiritualidade.',
  },
  16: {
    numero: 16,
    nome: 'A Torre',
    palavraChave: 'Ruptura e Desconstrução',
    descricao: 'Aponta para o mal que tem sua origem na alma do homem enraizado no egoísmo. A alma compreende o campo de consciência e inteligência pelas quais o homem se orienta na vida enquanto está encarnado. Inteligência que se desenvolve sem moral, sem ética, induz a alma a pender para o mal e leva o homem à queda. O homem de bem vive ao lado do homem de mal, não porque ame o mal, mas porque quer ajudar seu semelhante a se elevar e triunfar. Esse é o verdadeiro exercício da humildade. O homem egoísta atrairá sua própria queda a fim de que aprenda a ser humilde.',
    desafio: 'Adverte para o perigo dos impasses da especialização; avisa dos riscos implicados na aplicação das ciências e filosofias para a construção de “Torres de Babel” – “Não devemos construir; devemos crescer”.',
  },
  17: {
    numero: 17,
    nome: 'A Estrela',
    palavraChave: 'Esperança e Inspiração',
    descricao: 'Aponta para o exercício, ativo e contemplativo, consagrado ao crescimento espiritual – alma em corpo. Convida-nos para o esforço de aliar a justiça contemplativa com a justiça ativa; unir o princípio do entendimento ao da vontade para irradiar a primeira luz da consciência desperta. Relaciona os acontecimentos externos às situações psíquicas internas que lhes correspondem. Reflete um passo importante na direção de uma ação mais consciente e ativa no processo da individuação. Retrata uma vida harmoniosa.',
    desafio: 'Adverte para observarmos que existe uma relação entre o curso dos acontecimentos terrestres com os corpos celestes – “O que está embaixo é análogo ao que está em cima”.',
  },
  18: {
    numero: 18,
    nome: 'A Lua',
    palavraChave: 'Inconsciente e Ilusão',
    descricao: 'Aponta para um exercício espiritual, uma meditação sobre quais elementos internos da psique estão embaralhando o movimento evolutivo com tendência a reverter sua direção. O intelecto do ego mergulhado no mais profundo abismo da depressão, ao contato com os aspects mais sombrios e úmidos da psique registra o encontro da máscara da persona com a realidade do eu individuado, que aspira por sua iluminação. Descer nas profundezas do psiquismo significa ser privado da orientação da luz diurna – para alguns é a noite escura da alma. O mergulho psíquico tende a fortalecer a alma para o próximo evento da iluminação espiritual.',
    desafio: 'Adverte que o caminho está claramente à nossa frente; que a escuridão é apenas ausência de luz.',
  },
  19: {
    numero: 19,
    nome: 'O Sol',
    palavraChave: 'Clareza e Alegria',
    descricao: 'Aponta para a união da inteligência e da sabedoria espontânea – é o arcano da intuição. A intuição decorre da união íntima entre a inteligência e a sabedoria espontânea, como um dos sensos da alma. Essa experiência intuitiva transcendente de si mesmo, todavia, não nos permite ainda perceber o mundo espiritual e nos tornarmos conscientes dele. É necessário ainda se perceber e se tornar consciente de outros si mesmos transcendentes, muitos dos quais superiores a nós. É nova infância ensolarada, onde a vida já não é um desafio que precisa ser vencido, mas uma experiência para ser desfrutada. Retrata a recuperação da inocência; o momento em que deixamos para trás os dogmas formais e ingressamos no mundo ensolarado da experiência direta do conhecimento puro.',
    desafio: 'Adverte que podemos recuperar a harmonia interior, que sentíamos quando crianças antes que os opostos nos partissem cruelmente em pedaços, separando-nos de nós mesmos e uns dos outros.',
  },
  20: {
    numero: 20,
    nome: 'O Julgamento',
    palavraChave: 'Despertar e Vocação',
    descricao: 'Aponta para um chamamento ao exercício espiritual da iluminação, no qual torna-se necessário o emprego máximo da intuição. Sugere o chamado final para uma passagem para a vida espiritual através do julgamento que a consciência experimenta ao se deparar com uma amplitude maior de percepções, pelas quais se vê diante de áreas mais vastas de escolhas e um sentido mais agudo de responsabilidade. Cada noite e cada dia são experiências de morte e renascimento oportunizando à consciência fazer seus próprios julgamentos e escolhas.',
    desafio: 'Adverte que haverá sucessivos julgamentos, e sucessivos renascimentos antes de se alcançar a vitória final sobre o Mundo.',
  },
  21: {
    numero: 21,
    nome: 'O Mundo',
    palavraChave: 'Completude e Realização',
    descricao: 'Aponta para o impulso criativo do coração e da vida, que se vislumbra aos que alcançaram o portal do seu mundo interior. Esse mundo é agora compreendido como um estado permanente de consciência em expansão, no qual se inserem todas as criaturas, de todas as manifestações da natureza, como sendo cada uma um mundo em particular, porém, no entrelaçamento de todas as consciências, coisas e criaturas se revela um só Mundo. Em nível mais baixo é o mundo das ilusões, dos desejos, dos prazeres e do sexo. Em nível mais elevado é o mundo espiritual que se manifesta como realidade material. Aquele que busca pelo seu reino interior, pela sua alma e segue o destino traçado para si encontrará todo o resto por acréscimo.',
    desafio: 'Adverte que cada ser humano deve encontrar a sua própria chave para a geometria da vida.',
  },
  22: {
    numero: 22,
    nome: 'O Louco',
    palavraChave: 'Potencial Infinito',
    descricao: 'Aponta para os potenciais da nossa natureza espiritual, possíveis de serem realizados, ou manifestados, pois o arcano do Louco tanto pode ser o 0 (zero) como o 22. É a união dos opostos, da intelectualidade discursiva e da espiritualidade iluminadora. Em outros termos, a união da sabedoria humana, que é loucura aos olhos de Deus, com a sabedoria divina, que é loucura aos olhos dos homens, de maneira que resulte disso uma só sabedoria, que compreenda tanto o que está embaixo quanto o que está em cima. “Ninguém se iluda – se alguém dentre vós julgar ser sábio aos olhos deste mundo, torne-se louco para ser sábio; pois a sabedoria deste mundo é loucura diante de Deus”. – Paulo, 1Cor 3,18-19. Para se alcançar o verdadeiro poder realizador de todos os nossos potenciais espirituais devemos nos tornar como se fôssemos loucos aos olhos do mundo. Isto é, a assumir a nossa condição de seres espirituais se desidentificando da personalidade temporária.',
    desafio: 'Adverte que a sabedoria do mundo só leva a ser um tolo.',
  },

  // =========================================================================
  // ARCANOS MENORES (23–78)
  // =========================================================================
  23: {
    numero: 23,
    nome: 'Rei de Paus',
    palavraChave: 'Iniciativa e Liderança',
    descricao: 'Aponta para os aspectos da personalidade que geram novas ideias, qualidades de liderança, bondade e honestidade; símbolo do poder adquirido pelo mérito e pelo trabalho, sendo emblema de proteção das pessoas bem colocadas; autoconfiança, motivação, empreendedorismo, sabedoria e convicção, respeitabilidade e amizades.',
    desafio: 'Seus aspectos negativos podem se apresentar como arrogância, despotismo, tirania e intolerância.',
  },
  24: {
    numero: 24,
    nome: 'Rainha de Paus',
    palavraChave: 'Imaginação e Conforto',
    descricao: 'Aponta para a satisfação de estar vivendo em sua plena criatividade; pode estar em posição elevada, demonstrando a força da imaginação, da constância e da objetividade; momento de oferecer e receber aconchego e proteção; a ação desejada, o plano criativo, o feminino atraente e inteligente, crescimento, atividade, firmeza e amor pela vida.',
    desafio: 'Seus aspectos negativos podem surgir no excesso de vaidade, sexualidade obcecada e orgulho.',
  },
  25: {
    numero: 25,
    nome: 'Cavaleiro de Paus',
    palavraChave: 'Ação e Mudança',
    descricao: 'Aponta para a mudança de direção, a canalização da criatividade a pleno domínio de si; a coragem suprema diante da vida e da morte; momento de desenvolver as qualidades exuberantes, aventureiras e voláteis contidas em si.',
    desafio: 'Seus aspectos negativos podem surgir como uma euforia, exibicionismo ou impaciência.',
  },
  26: {
    numero: 26,
    nome: 'Valete de Paus',
    palavraChave: 'Entusiasmo e Curiosidade',
    descricao: 'Aponta para hesitação entre fazer e não fazer, entre criar e não criar, entre obedecer ou não aos próprios desejos; a energia sendo canalizada para a criatividade; curiosidade, entusiasmo; hora de identificar os lampejos criativos dentro de si e ser audacioso.',
    desafio: 'Seus aspectos negativos podem se apresentar como bloqueio da energia criativa, falta de vitalidade e até brutalidade.',
  },
  27: {
    numero: 27,
    nome: 'Dez de Paus',
    palavraChave: 'Sobrecarga e Renovação',
    descricao: 'Aponta para um tipo de anulação do movimento; situações opressivas em seu limite; falta de perspectiva, fardo pesado, excesso de responsabilidades, sobrecarga, tensões e preocupações, desentendimentos, traições, falsidades e hipocrisias; necessidade de mudar a energia; o final de uma fase.',
    desafio: 'A busca por perspectivas positivas apontando para um recomeço mais feliz e promissor serve como chave de superação.',
  },
  28: {
    numero: 28,
    nome: 'Nove de Paus',
    palavraChave: 'Resiliência e Purificação',
    descricao: 'Aponta para uma luta constante, que eleva a alma a um estado de purificação; seu lema pode ser “vencer ou morrer”; na libertação dos desejos do mundo acumula em si a energia para construir uma nova obra; não faça concessões, seja você mesmo, seja responsável por si e seus atos; penetre na essência de tudo que existe e descobrirá sua capacidade de se libertar das situações opressoras.',
    desafio: 'Positivamente, indica finalizações e abertura para novo ciclo, exigindo desapego das lutas antigas.',
  },
  29: {
    numero: 29,
    nome: 'Oito de Paus',
    palavraChave: 'Rapidez e Fluidez',
    descricao: 'Aponta para a concentração da energia criativa empregada a serviço da espiritualização; rapidez e fluidez dos impulsos criativos; a criatividade superior dirigida para o centro, a felicidade interna de quem contempla a harmonia e a beleza da vida.',
    desafio: 'Seus aspectos negativos podem surgir na forma de um deslumbramento do ego.',
  },
  30: {
    numero: 30,
    nome: 'Sete de Paus',
    palavraChave: 'Determinação e Defesa',
    descricao: 'Aponta para a energia gloriosa e resplandecente empregada com prazer nas atividades relacionadas ao trabalho ou em outros aspectos da vida; equilíbrio e cautela a fim de obter vitórias em seus pontos de vista.',
    desafio: 'Em seus aspectos negativos apresenta o risco de se fixar só na defensiva.',
  },
  31: {
    numero: 31,
    nome: 'Seis de Paus',
    palavraChave: 'Sucesso e Reconhecimento',
    descricao: 'Aponta para um impulso das forças criativas interiores na direção das realizações exteriores; a relação do interior com o exterior, do que está em cima com o que está embaixo; exprime a beleza do encontro sexual criativo; o sucesso nos empreendimentos depende de vontade, firmeza e perseverança; esforços recompensados e a vitória na conquista.',
    desafio: 'Em seus aspectos negativos existe o risco da satisfação egoística e do narcisismo.',
  },
  32: {
    numero: 32,
    nome: 'Cinco de Paus',
    palavraChave: 'Conflito e Escolha',
    descricao: 'Aponta para duas direções opostas – renunciar aos desejos para vislumbrar a iluminação espiritual, ou se aprofundar neles até seu esgotamento; é uma aspiração, uma passagem para um novo mundo, mas conservando uma parte da sua atividade no velho mundo; estimula a competição, energias opostas criando agitação e inquietude.',
    desafio: 'Em seus aspectos mais negativos pode conduzir ao excesso de misticismo ou ao esgotamento em depravações.',
  },
  33: {
    numero: 33,
    nome: 'Quatro de Paus',
    palavraChave: 'Estabilidade e Segurança',
    descricao: 'Aponta para a presença de uma segurança criativa; o ponto central da renúncia a lutar e vencer em seu próprio benefício, para cumprir, talvez, uma missão que envolve a coletividade; o progresso e a recompensa resultantes da aplicação dos métodos adequados.',
    desafio: 'Em seus aspectos negativos pode manifestar o desprezo pelas pequenas conquistas.',
  },
  34: {
    numero: 34,
    nome: 'Três de Paus',
    palavraChave: 'Visão e Empreendimento',
    descricao: 'Aponta para o centro que manifesta o desejo de conquistar o mundo; a energia resplandecente que impulsiona para o êxito nos empreendimentos; as inovações; o espírito inventivo; a união da criatividade com a disciplina para se alcançar o ponto mais próximo da perfeição; a adaptação do potencial espiritual e seu poder realizador à receptividade humana e às condições concretas da época e do meio no qual se atua.',
    desafio: 'Em seus aspectos negativos pode ser que surja algum tipo de condicionamento externo limitador.',
  },
  35: {
    numero: 35,
    nome: 'Dois de Paus',
    palavraChave: 'Intuição e Impulso',
    descricao: 'Aponta para a acumulação dos desejos e da energia que ainda não é realizada; o equilíbrio ou o desequilíbrio dos ímpetos, mas também o afloramento da intuição; a descida e a subida, a criação e a sublimação; os segredos e os mistérios do futuro.',
    desafio: 'Em seus aspectos negativos pode surgir indecisão e apatia.',
  },
  36: {
    numero: 36,
    nome: 'Ás de Paus',
    palavraChave: 'Poder Criativo e Missão',
    descricao: 'Aponta para conscientização da força interior que leva para a realização de uma missão; força criativa propulsora das novas ideias; inspiração, determinação e coragem; novos horizontes.',
    desafio: 'Em seus aspectos negativos pode haver risco de inflexibilidade.',
  },
  37: {
    numero: 37,
    nome: 'Rei de Copas',
    palavraChave: 'Amadurecimento Emocional',
    descricao: 'Aponta para o centro dos sentimentos; o amadurecimento emocional; o florescimento das atividades com vistas à frutificação; a bondade e a generosidade gerando prosperidade; o contentamento diante da existência dos seres conscientes; o curador das feridas emocionais da alma; a responsabilidade e a honestidade.',
    desafio: 'Em seus aspectos negativos pode manifestar desonestidade e hipocrisia.',
  },
  38: {
    numero: 38,
    nome: 'Rainha de Copas',
    palavraChave: 'Percepção e Emoção',
    descricao: 'Aponta para o paradoxal mundo das emoções e sentimentos, muitas vezes ambivalentes; o plano criativo e a inteligência feminina; prenúncio de favores e proteção, mas com justiça; um tempo para obter clareza emocional.',
    desafio: 'Em seus aspectos negativos, pode se manifestar como uma sedução perigosa e manipulação emocional.',
  },
  39: {
    numero: 39,
    nome: 'Cavaleiro de Copas',
    palavraChave: 'Idealismo e Dons',
    descricao: 'Aponta para uma fonte de amor que brota no coração, em conexão com as emoções; dons fluindo naturalmente, seguindo o sentimento para encontrar o caminho da autorrealização; confiança no senso guia da alma.',
    desafio: 'Em seus aspectos negativos, pode ocorrer abuso por excesso de confiança ou ilusão afetiva.',
  },
  40: {
    numero: 40,
    nome: 'Valete de Copas',
    palavraChave: 'Romantismo e Sensibilidade',
    descricao: 'Aponta para as ambiguidades do coração envolto por emoções; ingenuidade e romantismo; idealismo e predisposição para o sacrifício, ou para o medo e a fuga; amor ou rancor, generosidade ou egoísmo.',
    desafio: 'Em seus aspectos negativos, pode se apresentar como sedução leviana ou zombaria emocional.',
  },
  41: {
    numero: 41,
    nome: 'Dez de Copas',
    palavraChave: 'Amor Universal',
    descricao: 'Aponta para um coração preenchido de amor pela realização emocional; a experiência do amor universal; a dinâmica de dar e receber; servir por devoção e para sua autorrealização.',
    desafio: 'Em seus aspectos negativos pode despertar um bloqueio na aceitação de si mesmo.',
  },
  42: {
    numero: 42,
    nome: 'Nove de Copas',
    palavraChave: 'Desprendimento e Abertura',
    descricao: 'Aponta para uma nova dimensão do amor, na qual a sabedoria conduz à compreensão de um final de um ciclo emocional, ao desprendimento de tudo o que já foi vivido, e a uma abertura para um novo ciclo virtuoso; amor profundo pela humanidade presente em cada ser; desapego e abnegação; amor consciente.',
    desafio: 'Em seus aspectos negativos, pode despertar nostalgia, solidão ou crise emocional.',
  },
  43: {
    numero: 43,
    nome: 'Oito de Copas',
    palavraChave: 'Plenitude e Harmonia',
    descricao: 'Aponta para a plenitude do coração; seu preenchimento em todos os níveis por um amor atemporal (passado, presente e futuro) – amor ao próximo, por si mesmo, pelo planeta, pelo universo; harmonia, paz no coração, equilíbrio e graça; uma união profunda com o amor divino.',
    desafio: 'Em seus aspectos negativos remete à não aceitação desse amor, à carência afetiva e insatisfação.',
  },
  44: {
    numero: 44,
    nome: 'Sete de Copas',
    palavraChave: 'Amor em Ação',
    descricao: 'Aponta para o amor em ação total no mundo; a caridade sem ego; a fraternidade universal; a generosidade a serviço do bem da humanidade; a força do amor consciente que considera alegrar-se pela existência do outro.',
    desafio: 'Em seus aspectos negativos remete aos empecilhos para ser feliz, devido ao envolvimento emocional com as desgraças do mundo; agressividade; tendência compulsiva de ajudar a quem não pede ajuda; egoísmo.',
  },
  45: {
    numero: 45,
    nome: 'Seis de Copas',
    palavraChave: 'Autoaceitação e Prazer',
    descricao: 'Aponta para a realização do amor por si mesmo, na plenitude da aceitação e o contato com o amor divino; o encontro com o outro; um novo relacionamento com perspectivas felizes; pode ser um amor visceral que envolve o intelecto, o instinto e a emoção; fidelidade, prazer e sensualidade.',
    desafio: 'Em seus aspectos negativos remete a uma relação egoística; narcisismo; retraimento em si mesmo; desprezo pelos outros ou indulgência excessiva consigo mesmo.',
  },
  46: {
    numero: 46,
    nome: 'Cinco de Copas',
    palavraChave: 'Fé Emocional',
    descricao: 'Aponta para a emergência de novos sentimentos que podem chegar ao fanatismo; a euforia da fé emocional que pode conduzir à cegueira da razão; a primeira abertura do coração em direção a uma solução que seja boa para a humanidade.',
    desafio: 'Em seus aspectos negativos, pode surgir uma excessiva confiança, cega de razão, em algum guia ou guru qualquer; desequilíbrio afetivo; decepção; amargura.',
  },
  47: {
    numero: 47,
    nome: 'Quatro de Copas',
    palavraChave: 'Amor Familiar',
    descricao: 'Aponta para o amor estabelecido e sólido na base de uma família; evoca confiança em si e no outro; amor visto como um pilar da realidade; busca por segurança na família, no dinheiro ou nos bens materiais; desejo de proteção.',
    desafio: 'Em seus aspectos negativos pode despertar o desejo de pôr as suas esperanças de realização nos outros; insegurança; falta de liberdade, sufocamento, limitação de sentimentos ou o amor excessivamente materialista.',
  },
  48: {
    numero: 48,
    nome: 'Três de Copas',
    palavraChave: 'Eclosão e Paixão',
    descricao: 'Aponta para a eclosão da primeira experiência do amor emocional num relacionamento; sua inexperiência e idealização; um novo estilo de vida; iniciação em níveis mais profundos nas experiências do coração; uma grande explosão de paixão num encontro; a redescoberta do amor ardente em qualquer idade.',
    desafio: 'Em seus aspectos negativos remete tanto a um entusiasmo excessivo como a falta de entusiasmo na relação; delírio erótico; fixação.',
  },
  49: {
    numero: 49,
    nome: 'Dois de Copas',
    palavraChave: 'Afeição e Reconciliação',
    descricao: 'Aponta para uma acumulação de devaneios amorosos; imaginação que leva ao amor idílico; sentimentalismo; pode ser início de um relacionamento ou uma reconciliação; afeição e amizade.',
    desafio: 'Em seus aspectos negativos representa a imaturidade emocional; incapacidade de estabelecer uma relação; isolamento; dependência emocional.',
  },
  50: {
    numero: 50,
    nome: 'Ás de Copas',
    palavraChave: 'Potencial de Amor',
    descricao: 'Aponta para todos os potenciais do coração ainda por desabrochar como amor; grande disposição para viver com alegria, saúde, prazer; novas oportunidades surgem nas áreas das relações humanas, das comunicações, do sentimento; religar-se consigo mesmo, com o outro, com o divino.',
    desafio: 'Em seus aspectos negativos pode manifestar ciúme, rancor, insatisfação afetiva.',
  },
  51: {
    numero: 51,
    nome: 'Rei de Espadas',
    palavraChave: 'Força Mental e Estratégia',
    descricao: 'Aponta para a força das novas ideias; as artimanhas das estratégias; as leis, as reformas, as alianças; a dualidade que esclarece o que é e o que não é verdadeiro; aquilo que se deve aceitar ou rejeitar.',
    desafio: 'Em seus aspectos negativos pode surgir ironia, cinismo e intelectualismo excessivo.',
  },
  52: {
    numero: 52,
    nome: 'Rainha de Espadas',
    palavraChave: 'Inteligência Espiritual',
    descricao: 'Aponta para transcendência de um ideal; o reconhecimento da inteligência espiritual; confrontação com a própria dimensão e a fé nos propósitos idealizados; confrontação com as armadilhas do pensamento, para chegar ao centro impessoal que é a consciência cósmica.',
    desafio: 'Em seus aspectos negativos representa ressentimento e dureza intelectual.',
  },
  53: {
    numero: 53,
    nome: 'Cavaleiro de Espadas',
    palavraChave: 'Mudança e Paradigma',
    descricao: 'Aponta para um grande salto do reino do intelecto em direção aos mistérios emocionais; o verbo se torna amor; a força da coragem em ação; mudança de paradigma; inquietação e agitação em meio a um processo de mudanças provocadas por uma nova ideia, por novo projeto, que surgem quebrando antigas regras de conduta.',
    desafio: 'Em seus aspectos negativos pode surgir contundência, impetuosidade ou atropelos.',
  },
  54: {
    numero: 54,
    nome: 'Valete de Espadas',
    palavraChave: 'Estratégia e Diplomacia',
    descricao: 'Aponta para as estratégias diplomáticas e políticas; os meandros do intelecto voltado para as próprias finalidades; delicadeza e elegância que podem se voltar para a hipocrisia; pensamentos contraditórios; direções opostas; hesitação diante da dualidade dos conceitos.',
    desafio: 'Em seus aspectos negativos aponta para a dificuldade de se engajar; defensividade.',
  },
  55: {
    numero: 55,
    nome: 'Dez de Espadas',
    palavraChave: 'Fim de Ciclo Doloroso',
    descricao: 'Aponta para uma noite escura da alma; finalização de um processo doloroso; concretização, julgamento, solidão meditativa resultante da conscientização de que o problema foi resolvido.',
    desafio: 'Positivamente, convida ao vislumbre de um resultado tão ansiosamente aguardado, superando a dor residual.',
  },
  56: {
    numero: 56,
    nome: 'Nove de Espadas',
    palavraChave: 'Paciência e Escuta',
    descricao: 'Aponta para um aprendizado muito importante – escutar os outros; suas ideias são uma parte do mundo, mas não a totalidade do mundo; indica que o intelecto não é uno em si mesmo, mas uma diversidade de ideias, pensamentos e memórias; a saída do subjetivismo para avançar no mundo e se unir ao todo.',
    desafio: 'A chave deste arcano reside no cultivo sincero da paciência e da resignação ativa.',
  },
  57: {
    numero: 57,
    nome: 'Oito de Espadas',
    palavraChave: 'Esvaziamento e Meditação',
    descricao: 'Aponta para o esvaziamento do intelecto para realizar sua perfeição – a prática da meditação; prudência na indecisão mental; impessoalidade; vacuidade no ideal búdico.',
    desafio: 'Positivamente, sinaliza um período crítico em fase de finalização, exigindo foco absoluto.',
  },
  58: {
    numero: 58,
    nome: 'Sete de Espadas',
    palavraChave: 'Prudência e Ação Diplomática',
    descricao: 'Aponta para um aprisionamento mental; esvaziamento de ideias; descrença na realidade subjetiva, justificada pela crença única na realidade objetiva; inatividade em evidência.',
    desafio: 'Positivamente, exige a preservação máxima das próprias forças pela ação diplomática, evitando confrontos diretos.',
  },
  59: {
    numero: 59,
    nome: 'Seis de Espadas',
    palavraChave: 'Unicidade e Interiorização',
    descricao: 'Aponta para a unicidade; assumir a própria individualidade em direção a uma interiorização, para alcançar a beleza através da meditação, seguindo em direção ao êxtase que é o coração de nossa consciência; a primeira alegria do intelecto que se vê útil à inteligência.',
    desafio: 'Negativamente, pode decair em sentimentos de separação do mundo ou vitimização.',
  },
  60: {
    numero: 60,
    nome: 'Cinco de Espadas',
    palavraChave: 'Crescimento e Limites',
    descricao: 'Aponta para uma ideia que pode se transformar em um caminho a seguir; atividade intelectual em expansão para fora de seu mundo particular; necessidade de encarar suas próprias limitações e reconhecer suas capacidades.',
    desafio: 'Negativamente, gera ansiedade extrema, dispersão de foco e aflições.',
  },
  61: {
    numero: 61,
    nome: 'Quatro de Espadas',
    palavraChave: 'Segurança Mental',
    descricao: 'Aponta para a segurança mental; a praticidade; inteligência e capacidade de organizar a vida material; base da inteligência científica; recuperação das forças para encarar novos desafios.',
    desafio: 'Em seus aspectos negativos, expressa tendência para o racionalismo fechado em si mesmo e a negação obstinada da intuição.',
  },
  62: {
    numero: 62,
    nome: 'Três de Espadas',
    palavraChave: 'Idealismo e Dúvida',
    descricao: 'Aponta para o intelecto ativo, entusiasta, idealista, desmedido; estado de confusão mental, com uma tonalidade adolescente; todos os problemas se colocam em crer ou saber; motivação por um ideal que pode ser mais falacioso que verdadeiro.',
    desafio: 'Positivamente, convida para que o pensamento seja bem orientado por um espaço de segurança estruturada.',
  },
  63: {
    numero: 63,
    nome: 'Dois de Espadas',
    palavraChave: 'Devaneio e Decisão',
    descricao: 'Aponta para a vida intelectual; devaneio mental por acumulação de projetos, de mitos, de informações, de teorias; indecisão no momento de definir as ações.',
    desafio: 'Positivamente, estimula o surgimento de um profundo desejo de alcançar a perfeição.',
  },
  64: {
    numero: 64,
    nome: 'Ás de Espadas',
    palavraChave: 'Início Mental e Inspiração',
    descricao: 'Aponta para um início no plano das ideias, das inspirações; a formação do intelecto que será útil na realização dos planos idealizados; o intelecto precisa ser forjado em sintonia com a inteligência, para que ele seja flexível, forte e afiado como uma espada; a mente afinada com a experiência emocional regida pela noção de poder.',
    desafio: 'Em seus aspectos negativos, resulta em racionalismo excessivo e mente friamente intelectualizada.',
  },
  65: {
    numero: 65,
    nome: 'Rei de Ouros',
    palavraChave: 'Trabalho Ético e Sucesso',
    descricao: 'Aponta para os frutos do trabalho honesto e ético; a canalização da autoconfiança e do aperfeiçoamento no processo de realização da vida material; a aceitação dos acidentes e mudanças incessantes da vida material; a compreensão dos desígnios superiores e a confiança em se deixar levar por eles e obedecê-los; a realização do propósito maior da vida material; o poder exercido com humildade.',
    desafio: 'Em seus aspectos negativos, traz o risco iminente de se tornar controlador.',
  },
  66: {
    numero: 66,
    nome: 'Rainha de Ouros',
    palavraChave: 'Presença e Proteção',
    descricao: 'Aponta para ser aquilo que se aspira ser; resignação e superação do desejo de posse e de poder; presença, coragem, proteção, fidelidade; a guardiã do tesouro oculto no solo do coração; a imanência do ser que se aplica na sua autorrealização.',
    desafio: 'Em seus aspectos negativos, traz o risco de superproteção asfixiante e interferência nos assuntos alheios.',
  },
  67: {
    numero: 67,
    nome: 'Cavaleiro de Ouros',
    palavraChave: 'Espiritualização da Matéria',
    descricao: 'Aponta para a espiritualização da matéria; uma transformação espiritual que fertiliza o solo sagrado da vida material; a transformação do exterior que expõe a essência profunda e imutável do ser espiritual; o ritmo preciso para uma vida saudável e promissora; disposição para aceitar as incessantes mudanças sabendo que elas conduzem ao progresso.',
    desafio: 'Em seus aspectos negativos, manifesta o medo crônico e a insegurança financeira.',
  },
  68: {
    numero: 68,
    nome: 'Valete de Ouros',
    palavraChave: 'Conexão e Renovação',
    descricao: 'Aponta para identificação com a Terra, com o planeta inteiro; as múltiplas direções e os caminhos que conduzem ao progresso material e espiritual; atividade e receptividade; a libertação do peso das tradições, dos grilhões do passado que aprisionam as emoções aos traumas; a materialização do espírito e a espiritualização da matéria; o alvorecer de um novo ato, sendo o próprio ato.',
    desafio: 'Em seus aspectos negativos, expressa ingenuidade material e suscetibilidade a golpes.',
  },
  69: {
    numero: 69,
    nome: 'Dez de Ouros',
    palavraChave: 'Estabilidade e Prosperidade',
    descricao: 'Aponta para a totalidade que se fecha sobre si mesma estabelecendo a estabilidade material do mundo; a descida e a subida em equilíbrio; atividade e receptividade; a prosperidade alcançada; o reino espiritual que se realiza a partir das riquezas materiais, intelectuais, culturais, morais e éticas obtidas pela prosperidade.',
    desafio: 'Em seus aspectos negativos, traz o risco de perdas severas e destruição pela conduta puramente egoísta.',
  },
  70: {
    numero: 70,
    nome: 'Nove de Ouros',
    palavraChave: 'Novos Conceitos e Saúde',
    descricao: 'Aponta para o nascimento de um novo conceito emergente do meio de outros conceitos; a iminente chegada de novas condições materiais; um novo trabalho, uma nova oportunidade, uma herança, a recuperação da saúde.',
    desafio: 'As precauções são imprescindíveis, sob o risco de se perder as oportunidades que surgem por precipitação.',
  },
  71: {
    numero: 71,
    nome: 'Oito de Ouros',
    palavraChave: 'Segurança e Riqueza Real',
    descricao: 'Aponta para a segurança da vida material; revela um quadro dinâmico espiritual; o poder espiritual exercido no mundo material; revela que, no centro da matéria existe a consciência da eternidade e do infinito; o espírito agindo simultaneamente na vida material e na vida espiritual; essa interação de mundos gera a prosperidade total; a verdadeira riqueza; a realização harmoniosa das necessidades materiais para uma vida saudável.',
    desafio: 'Em seus aspectos negativos, expressa o perigo de se apegar obsessivamente ao materialismo.',
  },
  72: {
    numero: 72,
    nome: 'Sete de Ouros',
    palavraChave: 'Gestão e Foco de Alma',
    descricao: 'Aponta para o espírito em gestação no centro da matéria; toda ação extrema no mundo da matéria é gestação do espírito, em um ideal interno de alma; a consciência no centro de tudo, da célula, do átomo, das partículas.',
    desafio: 'Em seus aspectos negativos, traz o risco iminente de se desviar dos propósitos espirituais elevados.',
  },
  73: {
    numero: 73,
    nome: 'Seis de Ouros',
    palavraChave: 'Realidade e Sinergia',
    descricao: 'Aponta para o princípio da realidade e da estabilidade que se abre para receber e agir; o reencontro dos dois mundos – o espiritual e o material; a complementariedade; a superação do que já existe em si mesmo.',
    desafio: 'Em seus aspectos negativos, há o risco sério de se tornar autossuficiente e isolar-se.',
  },
  74: {
    numero: 74,
    nome: 'Cinco de Ouros',
    palavraChave: 'Renovação e Mudança',
    descricao: 'Aponta para uma renovação dos antigos conceitos; abertura para um novo paradigma; uma transformação, uma aspiração, uma passagem para uma nova realidade, um novo investimento, mas conservando uma parte proeminente do que se conhece e funciona bem.',
    desafio: 'Em seus aspectos negativos surge o perigo de se investir em propostas de risco certo, agindo por puro impulso.',
  },
  75: {
    numero: 75,
    nome: 'Quatro de Ouros',
    palavraChave: 'Impermanência e Economia',
    descricao: 'Aponta para o centro que parece ser imutável, mas que há nele constante impermanência; aquele que tem a segurança e a saúde deve permanecer constantemente consciente do caráter efêmero de todos os bens materiais; a vida cotidiana material assegurada como a base para a vida espiritual; investir para fazer a riqueza se multiplicar gerando prosperidade na corrente da vida.',
    desafio: 'Em seus aspectos negativos, desperta a ganância, a avareza e o medo da escassez.',
  },
  76: {
    numero: 76,
    nome: 'Três de Ouros',
    palavraChave: 'Tesouro e Penetração',
    descricao: 'Aponta para um tesouro escondido no mundo, do qual é preciso tomar posse; interiorização, penetração na essência da matéria para lhe extrair as riquezas espirituais; símbolo ambivalente da riqueza material e da consciência cósmica; início entusiasmado de um novo projeto, de um novo empreendimento.',
    desafio: 'Em seus aspectos negativos surge o perigo de um investimento incerto com risco severo de perdas.',
  },
  77: {
    numero: 77,
    nome: 'Dois de Ouros',
    palavraChave: 'Trabalho e Adaptabilidade',
    descricao: 'Aponta para o trabalho que leva à consciência pela aceitação da matéria, que se espiritualizará em seguida; o desejo de espiritualização da matéria; uma transformação que vai do passado para o futuro, de baixo para cima; adaptação e flexibilidade para lidar bem com os recursos materiais frente às mudanças inevitáveis.',
    desafio: 'Em seus aspectos negativos, desperta rigidez e risco de inflexibilidade paralisante.',
  },
  78: {
    numero: 78,
    nome: 'Ás de Ouros',
    palavraChave: 'Coração da Matéria e Sol Interior',
    descricao: 'Aponta para o coração da matéria onde reside a energia divina, o impessoal, a totalidade; o sol interior resplandecente que se irradia para o exterior que é a vida material; o aperfeiçoamento espiritual sem se apartar do mundo material; estar no mundo sem pertencer ao mundo; o trabalho criando uma realidade abundante e próspera; extrair os tesouros das profundezas da terra com respeito e gratidão.',
    desafio: 'Em seus aspectos negativos, traz o risco iminente de perda da espontaneidade.',
  },

  // =========================================================================
  // ARCANOS COMPLEMENTARES (79–99)
  // =========================================================================
  79: {
    numero: 79,
    nome: 'Arcano 79',
    palavraChave: 'Recomeço e Triunfo',
    descricao: 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); indica recomeço e triunfo em nova jornada.',
    desafio: 'Exige desconstruir o que foi erguido sob bases egoicas para avançar com determinação e humildade.',
  },
  80: {
    numero: 80,
    nome: 'Arcano 80',
    palavraChave: 'Poder Espiritual',
    descricao: 'Remete ao arcano 8 (A Justiça); indica a colheita do poder espiritual e o equilíbrio absoluto de forças.',
    desafio: 'Exige agir com retidão estrita e integridade para evitar os efeitos do retorno kármico.',
  },
  81: {
    numero: 81,
    nome: 'Arcano 81',
    palavraChave: 'Consciência Desperta',
    descricao: 'Remete ao arcano 9 (O Eremita); indica a consciência desperta através da introspecção profunda e do amadurecimento.',
    desafio: 'Cuidado para não se fechar no isolamento ou na arrogância intelectual.',
  },
  82: {
    numero: 82,
    nome: 'Arcano 82',
    palavraChave: 'Diplomacia e Poder',
    descricao: 'Remete aos arcanos 10 (A Roda da Fortuna) e 1 (O Mago); indica a diplomacia a serviço do poder e a maestria diante dos ciclos.',
    desafio: 'Evitar a manipulação fria e o oportunismo excessivo nas flutuações da vida.',
  },
  83: {
    numero: 83,
    nome: 'Arcano 83',
    palavraChave: 'Criatividade e Progresso',
    descricao: 'Remete aos arcanos 11 (A Força) e 2 (A Papisa); representa a força criativa inteligente colocada a serviço do progresso de vida.',
    desafio: 'Cuidado para não reprimir a sensibilidade e evitar que a pressa gere impaciência.',
  },
  84: {
    numero: 84,
    nome: 'Arcano 84',
    palavraChave: 'Artífice da Política',
    descricao: 'Remete aos arcanos 12 (O Enforcado) e 3 (A Imperatriz); indica o artífice da política, a capacidade de negociar com inteligência sob pressão.',
    desafio: 'Evitar o conformismo excessivo ou agir puramente por autopreservação.',
  },
  85: {
    numero: 85,
    nome: 'Arcano 85',
    palavraChave: 'Transformação Dolorosa',
    descricao: 'Remete aos arcanos 13 (A Morte) e 4 (O Imperador); indica a transformação profunda conquistada pelo esforço concentrado e doloroso.',
    desafio: 'Evitar a rigidez ao lidar com as perdas e o apego excessivo a velhas estruturas desmoronadas.',
  },
  86: {
    numero: 86,
    nome: 'Arcano 86',
    palavraChave: 'Equilíbrio Integral',
    descricao: 'Remete aos arcanos 14 (A Temperança) e 5 (O Papa); indica o equilíbrio entre a vida material e espiritual e a busca pela verdade.',
    desafio: 'Evitar cair no fanatismo doutrinário ou na acomodação morna diante de polaridades.',
  },
  87: {
    numero: 87,
    nome: 'Arcano 87',
    palavraChave: 'Humanização e Espiritualização',
    descricao: 'Remete aos arcanos 15 (O Diabo) e 6 (Os Enamorados); indica a espiritualização do ser através da humanização e da superação das tentações.',
    desafio: 'Cuidado para não se deixar enredar pelas armadilhas das paixões materiais egoicas.',
  },
  88: {
    numero: 88,
    nome: 'Arcano 88',
    palavraChave: 'Poder e Justiça Divina',
    descricao: 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); representa o triunfo do poder espiritual sobre as estruturas falsas e a justiça divina.',
    desafio: 'Exige humildade absoluta para não sofrer quedas geradas pela soberba ou megalomania.',
  },
  89: {
    numero: 89,
    nome: 'Arcano 89',
    palavraChave: 'Sabedoria e Poder',
    descricao: 'Remete aos arcanos 17 (A Estrela) e 8 (A Justiça); indica a retidão e o poder exercido com sabedoria prática e esperança.',
    desafio: 'Evitar a ingenuidade ou a passividade perante leis de causa e efeito.',
  },
  90: {
    numero: 90,
    nome: 'Arcano 90',
    palavraChave: 'Amplitude de Consciência',
    descricao: 'Remete ao arcano 9 (O Eremita); indica a amplitude da consciência através da busca solitária e integrada.',
    desafio: 'Evitar a solidão amarga e a resistência em compartilhar a luz interior.',
  },
  91: {
    numero: 91,
    nome: 'Arcano 91',
    palavraChave: 'Renascimento e Ciclo Novo',
    descricao: 'Remete aos arcanos 10 (A Roda da Fortuna) e 1 (O Mago); indica o início de um novo ciclo evolutivo e o renascimento espiritual.',
    desafio: 'Exige foco e coragem para abraçar a nova jornada sem resíduos do passado.',
  },
  92: {
    numero: 92,
    nome: 'Arcano 92',
    palavraChave: 'União e Serviço',
    descricao: 'Remete aos arcanos 11 (A Força) e 2 (A Papisa); indica a sinergia entre o autodomínio inteligente e a intuição profunda para servir ao próximo.',
    desafio: 'Evitar o desgaste por timidez ou a falta de ação externa correspondente.',
  },
  93: {
    numero: 93,
    nome: 'Arcano 93',
    palavraChave: 'Sabedoria Criativa',
    descricao: 'Remete aos arcanos 12 (O Enforcado) e 3 (A Imperatriz); indica a criatividade aliada à sabedoria silenciosa obtida pelo desapego.',
    desafio: 'Evitar o desânimo diante de atrasos temporários de manifestação comercial.',
  },
  94: {
    numero: 94,
    nome: 'Arcano 94',
    palavraChave: 'Renascimento para o Mundo',
    descricao: 'Remete aos arcanos 13 (A Morte) e 4 (O Imperador); representa o renascimento estruturado da personalidade perante a sociedade.',
    desafio: 'Evitar a resistência nervosa ao fim de rotinas familiares desatualizadas.',
  },
  95: {
    numero: 95,
    nome: 'Arcano 95',
    palavraChave: 'Despertar Superior',
    descricao: 'Remete aos arcanos 14 (A Temperança) e 5 (O Papa); indica o despertar de um conhecimento superior através do equilíbrio alquímico.',
    desafio: 'Cuidado para não isolar a sabedoria em dogmas inflexíveis de comportamento.',
  },
  96: {
    numero: 96,
    nome: 'Arcano 96',
    palavraChave: 'Livre Arbítrio',
    descricao: 'Remete aos arcanos 15 (O Diabo) e 6 (Os Enamorados); aponta para o exercício maduro e livre de escolhas conscientes contra os apegos.',
    desafio: 'Evitar adiar escolhas vitais de mudança por ilusão ou medo de perdas materiais temporárias.',
  },
  97: {
    numero: 97,
    nome: 'Arcano 97',
    palavraChave: 'Triunfo da Espiritualidade',
    descricao: 'Remete aos arcanos 16 (A Torre) e 7 (O Carro); representa o triunfo definitivo da espiritualidade sobre o colapso do egoísmo.',
    desafio: 'Exige resiliência total e adaptabilidade no processo de destruição de ilusões.',
  },
  98: {
    numero: 98,
    nome: 'Arcano 98',
    palavraChave: 'Espiritualização do Mundo',
    descricao: 'Remete aos arcanos 17 (A Estrela) e 8 (A Justiça); indica a espiritualização das realidades do mundo material por retidão ética.',
    desafio: 'Evitar a idealização ingênua que ignora a lei de causa e efeito prática.',
  },
  99: {
    numero: 99,
    nome: 'Arcano 99',
    palavraChave: 'Iluminação da Consciência',
    descricao: 'Remete aos arcanos 18 (A Lua) e 9 (O Eremita); indica a iluminação máxima da consciência individual que cruzou o inconsciente.',
    desafio: 'Evitar as últimas fantasias de autoengano e a melancolia espiritual de fim de ciclo.',
  },
};

/**
 * Retorna o arcano para exibição.
 */
export function getArcano(numero: number): Arcano & { numeroOriginal?: number } {
  if (numero === 0) return { ...ARCANOS[22]!, numeroOriginal: 0 };
  if (ARCANOS[numero]) return { ...ARCANOS[numero]!, numeroOriginal: numero };

  // Caso extraordinário (acima de 99, o que é evitado pelas reduções de linha base)
  const base = reduzirArcano(numero);
  const arcanoBase = ARCANOS[base] ?? ARCANOS[1]!;

  return {
    ...arcanoBase,
    numero: base,
    numeroOriginal: numero,
    palavraChave: `${arcanoBase.palavraChave} (Arcano ${numero})`,
  };
}

/**
 * Nome curto do arcano para exibição em triângulos.
 */
export function nomeArcano(numero: number): string {
  if (numero === 0) return 'O Louco (22)';
  const a = ARCANOS[numero];
  if (a) return `${a.numero} — ${a.nome}`;
  const base = reduzirArcano(numero);
  return `${numero} (base ${base})`;
}
