/**
 * Shared Cabalistic Blockage Interpretations Dictionary
 * 
 * Maps each of the 9 blockage sequences (111 to 999) to its precise spiritual,
 * physical, and practical consequences across all 4 life triangles:
 * - Vida (Saúde, Vitalidade e Prosperidade Material)
 * - Pessoal (Mundo Íntimo, Emoções e Relacionamentos Próximos)
 * - Social (Carreira, Visibilidade Pública e Magnetismo Social)
 * - Destino (Propósito, Realização Concreta e Legado Eterno)
 */

export const INTERPRETACOES_TRIANGULOS: Record<string, Record<string, string>> = {
  '111': {
    vida: 'Este bloqueio drena a força de iniciativa e o vigor físico. Age como uma fraqueza no motor vital, gerando cansaço sem causa aparente, falta de iniciativa e hesitação constante para dar novos passos, além de possíveis oscilações na pressão arterial ou saúde cardíaca.',
    pessoal: 'Cria uma barreira na autoafirmação afetiva. O indivíduo hesita em expor quem realmente é por medo de rejeição, gerando uma perigosa dependência emocional do parceiro e dificuldade crônica em estabelecer limites íntimos.',
    social: 'Bloqueia a liderança profissional e a iniciativa pública. A pessoa é incapaz de se destacar em apresentações ou reuniões, permitindo que colegas de trabalho tomem o crédito por suas ideias e fiquem com as promoções.',
    destino: 'Trava a manifestação do propósito de alma. A pessoa hesita em assumir sua verdadeira missão por medo de falhar, iniciando múltiplos caminhos que são abandonados pelo meio, deixando o seu legado permanentemente inacabado.'
  },
  '222': {
    vida: 'Cria uma vulnerabilidade no sistema imunológico e dependência de estímulos externos para manter o vigor. A energia física oscila de acordo com o ambiente, somatizando tensões sob a forma de dores nas articulações ou debilidades linfáticas.',
    pessoal: 'Provoca uma anulação profunda do self nas relações afetivas. A indecisão em expressar sentimentos gera uma timidez paralisante e o medo constante de ser subjugado ou abandonado, gerando ciclos de submissão.',
    social: 'Falta de posicionamento firme em negociações e parcerias. A pessoa aceita acordos profissionais desvantajosos por receio de confrontos, sendo frequentemente explorada por associados ou chefes sem escrúpulos.',
    destino: 'O propósito de vida fica refém de decisões alheias. A incapacidade de agir de forma independente desvia o rumo do destino planejado, fazendo com que parcerias e laços societários comandem sua jornada de alma.'
  },
  '333': {
    vida: 'Dificulta a livre circulação da energia vital e compromete a saúde respiratória. Gera uma sensação de opressão no peito ou garganta, afetando a imunidade e criando propensão a alergias, inflamações ou problemas articulares que limitam o movimento físico.',
    pessoal: 'Autoexpressão emocional bloqueada. O indivíduo silencia suas mágoas e desejos, criando uma barreira invisível de comunicação que afasta as pessoas próximas e gera discussões baseadas em silêncios e mal-entendidos.',
    social: 'Ruído severo na comunicação e marketing profissional. A imagem pública fica distorcida ou apagada; a pessoa sente dificuldade extrema em vender suas ideias ou falar em público, parecendo invisível no mercado.',
    destino: 'Impossibilidade de propagar sua mensagem e legado no tempo. A criatividade de alma fica enclausurada e incapaz de florescer, impedindo que o indivíduo inspire as pessoas e cumpra sua missão expressiva terrena.'
  },
  '444': {
    vida: 'Fragmenta as defesas físicas e a estabilidade material. O esforço exigido para manter a saúde e a rotina de trabalho é desproporcional, gerando rigidez óssea, dores na coluna ou cansaço estrutural que dificulta a sustentação firme do corpo.',
    pessoal: 'Rigidez e frieza na intimidade. Dificuldade em relaxar e expressar afeto de forma espontânea, frequentemente associando o amor ao dever ou à cobrança, o que atrai relacionamentos pesados e de cobrança mútua.',
    social: 'Esforço extremo sem reconhecimento profissional correspondente. A carreira parece estagnada, com baixos salários e pouca valorização dos talentos práticos, exigindo o dobro de trabalho para qualquer pequeno avanço.',
    destino: 'Realização material de longo prazo severamente obstaculizada. A construção do legado de vida desmorona por falta de alinhamento energético, parecendo que o propósito é uma subida contínua sob o peso de rochas pesadas.'
  },
  '555': {
    vida: 'Provoca uma instabilidade nervosa crônica no organismo. A falta de ritmo biológico gera estresse severo, distúrbios digestivos ou propensão a vícios e excessos que drenam a imunidade física e a estabilidade das finanças diárias.',
    pessoal: 'Instabilidade emocional incontrolável. Medo profundo de compromisso misturado com o desejo de intimidade, fazendo com que a pessoa crie brigas do nada ou sabote sentimentos puros para fugir da vulnerabilidade.',
    social: 'Mudanças profissionais caóticas e instabilidade na carreira. A falta de constância impede que a pessoa se consolide em uma profissão, gerando demissões súbitas ou perda de reputação por atitudes impensadas.',
    destino: 'Dispersão total da jornada espiritual e material. Desvios e caprichos erráticos impedem que a pessoa concentre sua energia na construção de um legado, deixando rastros de projetos começados e vazios.'
  },
  '666': {
    vida: 'Sobrecarga glandular e hormonal decorrente de estresse acumulado. As energias do corpo físico somatizam conflitos afetivos, afetando o sistema endócrino e a tireoide, enfraquecendo a âncora material de vitalidade da pessoa.',
    pessoal: 'Cobrança afetiva asfixiante e ciúmes. A pessoa assume um papel de salvador ou controlador da família, cobrando dos entes queridos uma perfeição impossível, o que gera mágoa profunda e sensação crônica de rejeição.',
    social: 'Carga profissional excessiva por incapacidade de dizer "não". A pessoa assume todas as responsabilidades do time, sacrificando sua visibilidade e prestígio individual para manter a harmonia superficial do ambiente.',
    destino: 'O propósito pessoal é totalmente sacrificado em prol de dramas familiares. A pessoa se anula para carregar o carma de outros, falhando em materializar a missão única que veio desempenhar nesta existência.'
  },
  '777': {
    vida: 'Esgotamento do sistema nervoso por excesso de atividade mental e isolamento. Age gerando melancolia, insônia e enxaquecas frequentes, sinalizando que a mente racional está consumindo a energia que deveria nutrir os órgãos vitais.',
    pessoal: 'Isolamento voluntário do coração. A pessoa ergue muralhas intelectuais para se proteger da dor, preferindo a solidão à entrega íntima sincera, gerando um profundo sentimento de incompreensão recíproca na vida amorosa.',
    social: 'Afastamento público e dificuldades em trabalhar em equipe. A postura excessivamente crítica e analítica é interpretada como frieza ou arrogância, gerando barreiras para atrair novos clientes ou investidores.',
    destino: 'Dificuldade em aceitar a intuição espiritual como guia de vida. O ceticismo rígido ou a arrogância intelectual impedem que o indivíduo enxergue as portas que o destino abre, gerando um eterno descontentamento existencial.'
  },
  '888': {
    vida: 'Tensão contínua ligada à sobrevivência e finanças. Causa bloqueios digestivos e gástricos graves (úlceras, refluxos) e afeta os rins, refletindo a ansiedade extrema gerada pela luta para manter a segurança material e o controle.',
    pessoal: 'Disputas de poder e controle financeiro na família. A segurança emocional é projetada na estabilidade material, fazendo com que o dinheiro e a autoridade ditem as relações mais íntimas, minando a espontaneidade.',
    social: 'Ciclos exaustivos de perdas profissionais ou litígios comerciais. Dificuldades extremas em gerir o sucesso ou delegar autoridade, gerando problemas severos com chefias, contratos mal formulados e estresse.',
    destino: 'Ruína ou crises morais que destroem a colheita prática da vida. A obsessão pelo controle material ou a aversão ao poder minam a realização concreta do destino, bloqueando o fluxo do legado abundante.'
  },
  '999': {
    vida: 'Dificuldade extrema em concluir ciclos de cura e restauração física. Gera um desgaste crônico e fadiga ao final de tarefas, fazendo com que o corpo demore a se regenerar e sofra com baixa imunidade nas transições da vida.',
    pessoal: 'Dificuldade crônica em perdoar e soltar mágoas passadas. A pessoa apega-se a traições ou términos antigos, repetindo padrões tóxicos em novas relações por medo inconsciente de sofrer a mesma dor novamente.',
    social: 'Persistência em carreiras ou empresas falidas. Dificuldade em encerrar ciclos profissionais obsoletos ou demitir funcionários ineficientes, travando o crescimento e adiando a transição para novos rumos lucrativos.',
    destino: 'Incapacidade de fechar capítulos cármicos, travando a evolução para o próximo patamar espiritual. O indivíduo arrasta arrependimentos e laços energéticos do passado, impedindo que o seu propósito se realize em plenitude.'
  }
};

/**
 * Retorna a interpretação específica de um bloqueio para um determinado triângulo.
 * 
 * @param codigo Código do bloqueio (ex.: "111", "222")
 * @param triangulo Nome do triângulo (ex.: "vida", "pessoal", "social", "destino")
 */
export function obterInterpretacaoEspecifica(codigo: string, triangulo: string): string {
  const normTri = triangulo.toLowerCase().trim();
  const c = codigo.replace(/[^0-9]/g, '');
  return INTERPRETACOES_TRIANGULOS[c]?.[normTri] || '';
}
