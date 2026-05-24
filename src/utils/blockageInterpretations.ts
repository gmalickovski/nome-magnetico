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
    vida: 'Ao se manifestar no Triângulo da Vida, esta paralisia afeta diretamente sua vitalidade e ação física.',
    pessoal: 'No Triângulo Pessoal, essa perda de iniciativa gera uma forte dependência afetiva.',
    social: 'No Triângulo Social, a falta de coragem resulta na perda de oportunidades profissionais e invisibilidade.',
    destino: 'Como força do Destino, a estagnação impede que você assuma sua verdadeira missão.'
  },
  '222': {
    vida: 'No Triângulo da Vida, a indecisão constante pode gerar instabilidade imunológica e dependência de estímulos.',
    pessoal: 'No Triângulo Pessoal, essa timidez cria um padrão de anulação e submissão nos relacionamentos íntimos.',
    social: 'No Triângulo Social, o medo de confrontos faz com que aceite condições desvantajosas na carreira.',
    destino: 'No Triângulo do Destino, a dependência excessiva desvia o rumo das suas maiores realizações.'
  },
  '333': {
    vida: 'No Triângulo da Vida, essa repressão da fala afeta a vitalidade e pode somatizar tensões corporais.',
    pessoal: 'No Triângulo Pessoal, a dificuldade no diálogo cria barreiras e silêncios pesados nas relações íntimas.',
    social: 'No Triângulo Social, a falha na comunicação obscurece sua imagem pública e seu prestígio profissional.',
    destino: 'No Triângulo do Destino, o silenciamento impede que sua criatividade deixe a marca que deveria no mundo.'
  },
  '444': {
    vida: 'No Triângulo da Vida, as dificuldades profissionais somatizam na forma de cansaço estrutural e desgaste físico.',
    pessoal: 'No Triângulo Pessoal, a rigidez e a frustração profissional tornam as relações íntimas frias e baseadas em cobranças.',
    social: 'No Triângulo Social, o esforço extremo não encontra reconhecimento, estagnando o avanço na carreira.',
    destino: 'No Triângulo do Destino, a falta de estabilidade adia a materialização dos seus grandes objetivos.'
  },
  '555': {
    vida: 'No Triângulo da Vida, a instabilidade crônica gera estresse no organismo e esgota suas energias diárias.',
    pessoal: 'No Triângulo Pessoal, as oscilações atraem o caos afetivo e o medo inconsciente de assumir compromissos.',
    social: 'No Triângulo Social, as mudanças constantes impedem a construção de uma reputação profissional sólida.',
    destino: 'No Triângulo do Destino, a dispersão energética desvia você repetidamente do seu propósito final.'
  },
  '666': {
    vida: 'No Triângulo da Vida, a sobrecarga de responsabilidades alheias afeta diretamente sua estabilidade hormonal e física.',
    pessoal: 'No Triângulo Pessoal, a decepção e as cobranças tornam a vida familiar uma fonte de desgaste e isolamento.',
    social: 'No Triângulo Social, o esforço para agradar a todos consome o tempo que deveria ser dedicado ao seu próprio sucesso.',
    destino: 'No Triângulo do Destino, o auto-sacrifício excessivo impede que você construa o seu próprio legado.'
  },
  '777': {
    vida: 'No Triângulo da Vida, o esgotamento mental e o isolamento drenam a energia que deveria nutrir sua vitalidade.',
    pessoal: 'No Triângulo Pessoal, a postura arredia cria distanciamento profundo daqueles que tentam se aproximar.',
    social: 'No Triângulo Social, o isolamento e o ceticismo dificultam parcerias e afastam oportunidades de mercado.',
    destino: 'No Triângulo do Destino, o ceticismo e a arrogância bloqueiam as portas da intuição e da realização superior.'
  },
  '888': {
    vida: 'No Triângulo da Vida, o estresse material constante afeta gravemente o equilíbrio nervoso e gástrico do corpo.',
    pessoal: 'No Triângulo Pessoal, a disputa pelo controle e a tensão financeira ditam as regras das relações mais íntimas.',
    social: 'No Triângulo Social, a dificuldade em gerir a pressão resulta em perdas bruscas ou litígios profissionais.',
    destino: 'No Triângulo do Destino, a oscilação material mina a construção prática do seu propósito maior.'
  },
  '999': {
    vida: 'No Triângulo da Vida, a dificuldade em encerrar ciclos gera uma fadiga crônica, retardando a regeneração física.',
    pessoal: 'No Triângulo Pessoal, o apego ao passado impede a cura de feridas antigas, repetindo padrões tóxicos.',
    social: 'No Triângulo Social, a persistência em caminhos profissionais obsoletos bloqueia qualquer chance de renovação.',
    destino: 'No Triângulo do Destino, a incapacidade de soltar o passado paralisa sua evolução para o próximo nível.'
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
