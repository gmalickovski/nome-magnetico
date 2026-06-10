/**
 * Triângulos Numerológicos Cabalísticos.
 *
 * São quatro triângulos, cada um revelando uma dimensão diferente da vida:
 *
 * 1. Triângulo da Vida (Básico)  — aspectos gerais da vida
 * 2. Triângulo Pessoal           — vida íntima e reações internas
 * 3. Triângulo Social            — influências externas
 * 4. Triângulo do Destino        — eventuais resultados e previsões
 *
 * Montagem de cada triângulo:
 * - Linha base: valor de cada letra somado com um modificador (varia por triângulo)
 *   e REDUZIDO a 1 dígito para entrada na estrutura.
 * - Próximas linhas: soma reduzida dos pares adjacentes até restar 1 número = Arcano Regente.
 * - Arcanos Dominantes: concatenação dos pares da linha base (ex: 3 e 5 → 35).
 * - Sequências Negativas: 3 ou mais dígitos iguais consecutivos em qualquer linha.
 */

import { calcularValor, reduzirNumero, calcularIdade } from './core';

// ================================================================
// TIPOS
// ================================================================

export interface Triangulo {
  tipo: 'vida' | 'pessoal' | 'social' | 'destino';
  linhas: number[][];
  arcanoRegente: number | null;
  arcanosDoMinantes: number[];
  sequenciasNegativas: string[];
  /** Quantidade de vezes que cada código de bloqueio aparece neste triângulo (em linhas distintas). */
  contagemSequencias: Record<string, number>;
  /** Sequência cronológica completa sem remover duplicatas (Arcanos de Passagem) */
  arcanosDePassagem: number[];
  /** Arcano de Trânsito atual (baseado na idade) */
  arcanoAtual?: {
    numero: number | null;
    periodo: string;
    idadeInicio: number;
    idadeFim: number;
    indice?: number;
  };
}

export interface TodosTriangulos {
  vida: Triangulo;
  pessoal: Triangulo;
  social: Triangulo;
  destino: Triangulo;
}

export interface Bloqueio {
  codigo: string;
  titulo: string;
  descricao: string;
  aspectoSaude: string;
  triangulos: Array<'vida' | 'pessoal' | 'social' | 'destino'>;
  /** Número de ocorrências deste bloqueio em cada triângulo. */
  repeticoesPortriangulo: Partial<Record<'vida' | 'pessoal' | 'social' | 'destino', number>>;
  /** Soma total de ocorrências em todos os triângulos. */
  totalOcorrencias: number;
}

// ================================================================
// MAPA DE BLOQUEIOS (sequências negativas)
// ================================================================
export const BLOQUEIOS_MAP: Record<
  string,
  { titulo: string; descricao: string; aspectoSaude: string }
> = {
  '111': {
    titulo: 'Bloqueio de Iniciação (111)',
    descricao: 'Limitação profunda da força de vontade, perda de coragem e inatividade crônica. A presença deste bloqueio gera uma forte tendência à dependência de terceiros e cria bloqueios sistêmicos ao tentar iniciar projetos, defender ideias próprias ou afirmar a sua individualidade autêntica. O grande antídoto kármico para transcender essa energia é desenvolver ativamente a coragem, fortalecer a autonomia pessoal e recuperar a confiança absoluta no próprio potencial de liderança inato.',
    aspectoSaude: 'Tendência para desenvolver alguns distúrbios ou doenças cardíacas.',
  },
  '222': {
    titulo: 'Bloqueio de Associação (222)',
    descricao: 'Timidez extrema, indecisão constante e uma perigosa tendência a ser subjugado e apagado pelos outros. Este bloqueio manifesta dificuldades severas em manter parcerias, sociedades e relacionamentos saudáveis, muitas vezes resultando em drástica perda de autoestima e anulação da própria vontade. O antídoto fundamental é cultivar a diplomacia, a paciência e estabelecer limites claros para manter o equilíbrio inegociável entre o que você oferece e o que você recebe.',
    aspectoSaude: 'Pode, eventualmente, surgir alguma doença que provoque dependência.',
  },
  '333': {
    titulo: 'Bloqueio de Expressão (333)',
    descricao: 'Dificuldade profunda no diálogo e barreiras persistentes ao tentar se comunicar com clareza. Este bloqueio gera a constante sensação de ser incompreendido e uma forte dificuldade em se impor e expressar seus sentimentos verdadeiros nas relações pessoais e profissionais. Para transcender esse obstáculo, o antídoto exige focar na expressão criativa, treinar a comunicação autêntica e transparente, e sustentar o otimismo mesmo diante das barreiras sociais.',
    aspectoSaude: 'Indica possibilidade de doenças respiratórias ou de articulações.',
  },
  '444': {
    titulo: 'Bloqueio de Estruturação (444)',
    descricao: 'Bloqueio severo na realização profissional e financeira. Indica uma forte tendência a não receber o reconhecimento merecido pelo seu esforço, além de dificuldade crônica em manter estabilidade. Pode gerar excesso de rigidez, pessimismo ou, pelo contrário, extrema desorganização. O antídoto para destravar este fluxo exige o cultivo diário da disciplina, estabelecimento de métodos claros de ação, e uma resiliência inabalável para construir bases sólidas.',
    aspectoSaude: 'Indica possibilidade de doenças reumáticas ou arteriais.',
  },
  '555': {
    titulo: 'Bloqueio de Liberdade (555)',
    descricao: 'Dificuldade crônica em aceitar e lidar com mudanças, acompanhada de instabilidade contínua. Este bloqueio provoca insatisfação constante, agitação interna e uma perigosa atração pela rebeldia ou vícios como válvula de escape. A liberdade pessoal frequentemente se torna uma fonte de caos em vez de paz. O antídoto principal é aprender a aceitar o fluxo natural da vida, desenvolver flexibilidade mental, adaptar-se sem resistência e usar a liberdade com profunda responsabilidade.',
    aspectoSaude: 'Desenvolver alguma doença de pele.',
  },
  '666': {
    titulo: 'Bloqueio de Harmonia (666)',
    descricao: 'Conflitos persistentes e instabilidade na vida familiar e afetiva. Este bloqueio gera decepções frequentes nos relacionamentos íntimos, ciúmes, possessividade e uma tendência ao isolamento emocional. Muitas vezes, você atrai parceiros incompatíveis ou se sente sobrecarregado por responsabilidades domésticas. O antídoto essencial é desenvolver o amor-próprio antes de buscar afeto externo, aprender a perdoar e cultivar a compreensão de que as relações devem ser fontes de equilíbrio, não de peso.',
    aspectoSaude: 'Algum tipo de doença cardíaca pode aparecer nesse estado.',
  },
  '777': {
    titulo: 'Bloqueio de Conexão Espiritual (777)',
    descricao: 'Desconexão dolorosa do plano espiritual e do propósito maior de vida. Este bloqueio gera desânimo, melancolia, confusão mental frequente, medos infundados e uma sensação de vazio interno que o sucesso material não preenche. A energia fica dispersa e a mente nebulosa. O antídoto fundamental para esta vibração é a interiorização diária, o estudo profundos de temas existenciais, a meditação e o desenvolvimento ativo da sua intuição e sabedoria oculta.',
    aspectoSaude: 'Doenças nervosas, dependências e, eventualmente, algum tipo de câncer.',
  },
  '888': {
    titulo: 'Bloqueio de Poder e Abundância (888)',
    descricao: 'Bloqueio crítico no fluxo da abundância financeira e na relação com o mundo material. Manifesta-se através de perdas financeiras súbitas, dificuldades extremas em acumular ou reter riquezas, e um constante sentimento de estagnação na carreira. Pode indicar ambição desmedida ou total aversão ao poder. O antídoto central requer a harmonização da sua relação com o dinheiro, compreendendo-o como energia de troca justa, agindo com máxima ética, justiça e reequilibrando a balança entre a matéria e o espírito.',
    aspectoSaude: 'Como consequência desse estresse extremo, poderá desenvolver alguma doença.',
  },
  '999': {
    titulo: 'Bloqueio de Compaixão Universal (999)',
    descricao: 'Prolongamento exaustivo de ciclos que já deveriam ter se encerrado. Este bloqueio cria forte apego ao passado, ressentimentos duradouros e dificuldades crônicas em perdoar e soltar o que não serve mais. Pode gerar desilusões frequentes, perdas emocionais e uma sensação de sacrifício contínuo pelos outros. O antídoto kármico definitivo é o desenvolvimento da compaixão universal, a prática ativa do desapego, o perdão incondicional (a si mesmo e aos outros) e a aceitação pacífica das conclusões.',
    aspectoSaude: 'Tudo isto pode afetar diretamente o sistema nervoso e o coração.',
  },
};

// ================================================================
// MONTAGEM DOS TRIÂNGULOS
// ================================================================

/**
 * Calcula o Arcano de Trânsito atual baseado na idade e na sequência de arcanos de passagem.
 */
function calcularArcanoAtual(idade: number, dataNascimento: string, sequenciaCompletaArcanos: number[]) {
  if (!dataNascimento) return undefined;
  const partes = dataNascimento.split('/');
  if (partes.length !== 3) return undefined;

  const [diaNasc, mesNasc, anoNasc] = partes.map(Number);
  if (isNaN(diaNasc) || isNaN(mesNasc) || isNaN(anoNasc)) return undefined;

  const numArcanos = sequenciaCompletaArcanos.length;
  if (numArcanos === 0) return undefined;

  const duracaoCicloArcano = 90 / numArcanos;
  
  let indiceArcano = Math.floor(idade / duracaoCicloArcano);
  if (indiceArcano >= numArcanos) {
    indiceArcano = numArcanos - 1; // Fica no último arcano para idades além de 90
  }
  if (indiceArcano < 0) {
    indiceArcano = 0; // Previne idades negativas (ex: empresas não nascidas)
  }
  
  const numeroArcano = sequenciaCompletaArcanos[indiceArcano] || null;

  const idadeInicioCiclo = indiceArcano * duracaoCicloArcano;
  const idadeFimCiclo = idadeInicioCiclo + duracaoCicloArcano;

  const dataInicioCiclo = new Date(anoNasc + Math.floor(idadeInicioCiclo), mesNasc - 1, diaNasc);
  const dataFimCiclo = new Date(anoNasc + Math.floor(idadeFimCiclo), mesNasc - 1, diaNasc);

  const formatarData = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  const periodo = `${formatarData(dataInicioCiclo)} a ${formatarData(dataFimCiclo)}`;

  return { 
    numero: numeroArcano, 
    periodo, 
    idadeInicio: Math.round(idadeInicioCiclo), 
    idadeFim: Math.round(idadeFimCiclo),
    indice: indiceArcano
  };
}

/**
 * Constrói um triângulo a partir de uma linha base já calculada.
 */
function construirTriangulo(
  tipo: Triangulo['tipo'],
  linhaBase: number[],
  dataNascimento?: string
): Triangulo {
  const linhas: number[][] = [linhaBase];

  // Arcanos dominantes: concatenação dos pares da linha base
  const arcanosDePassagem: number[] = [];
  for (let k = 0; k < linhaBase.length - 1; k++) {
    arcanosDePassagem.push(parseInt(`${linhaBase[k]}${linhaBase[k + 1]}`));
  }

  // Construir triângulo reduzindo pares
  let linhaAtual = linhaBase;
  while (linhaAtual.length > 1) {
    const proxima: number[] = [];
    for (let j = 0; j < linhaAtual.length - 1; j++) {
      proxima.push(reduzirNumero(linhaAtual[j]! + linhaAtual[j + 1]!, false));
    }
    linhas.push(proxima);
    linhaAtual = proxima;
  }

  // Contar sequências negativas em todas as linhas (mesmo código em linhas diferentes = +1)
  const sequenciasContagem = new Map<string, number>();
  for (const linha of linhas) {
    const s = linha.join('');
    const matches = s.match(/(\d)\1{2,}/g) ?? [];
    matches.forEach(m => {
      const codigo = m.charAt(0).repeat(3);
      if (BLOQUEIOS_MAP[codigo]) {
        sequenciasContagem.set(codigo, (sequenciasContagem.get(codigo) ?? 0) + 1);
      }
    });
  }

  let arcanoAtual = undefined;
  if (dataNascimento) {
    const idade = calcularIdade(dataNascimento);
    arcanoAtual = calcularArcanoAtual(idade, dataNascimento, arcanosDePassagem);
  }

  return {
    tipo,
    linhas,
    arcanoRegente: linhaAtual[0] ?? null,
    arcanosDoMinantes: [...new Set(arcanosDePassagem)],
    sequenciasNegativas: Array.from(sequenciasContagem.keys()),
    contagemSequencias: Object.fromEntries(sequenciasContagem),
    arcanosDePassagem,
    arcanoAtual,
  };
}

// ----------------------------------------------------------------
// 1. Triângulo da Vida (Básico) — só o valor de cada letra (sem pré-redução)
// ----------------------------------------------------------------
export function calcularTrianguloVida(nome: string, dataNascimento?: string): Triangulo {
  const nomeLimpo = nome.replace(/\s+/g, '').toUpperCase();
  if (!nomeLimpo) return construirTriangulo('vida', [], dataNascimento);

  // Filtra letras sem valor e reduz cada valor de letra da linha base a dígito único (1-9)
  const linhaBase = nomeLimpo
    .split('')
    .map(l => calcularValor(l))
    .filter(v => v > 0)
    .map(v => reduzirNumero(v, false));
  return construirTriangulo('vida', linhaBase, dataNascimento);
}

// ----------------------------------------------------------------
// 2. Triângulo Pessoal — letra + dia de nascimento (reduzido)
// ----------------------------------------------------------------
export function calcularTrianguloPessoal(nome: string, dataNascimento: string): Triangulo {
  const nomeLimpo = nome.replace(/\s+/g, '').toUpperCase();
  if (!nomeLimpo) return construirTriangulo('pessoal', [], dataNascimento);

  // Extrair dia da data DD/MM/AAAA
  const partes = dataNascimento.replace(/\D/g, '');
  const dia = parseInt(partes.slice(0, 2));
  const diaReduzido = reduzirNumero(dia, false);

  const linhaBase = nomeLimpo
    .split('')
    .map(l => calcularValor(l))
    .filter(v => v > 0)
    .map(v => reduzirNumero(v + diaReduzido, false));

  return construirTriangulo('pessoal', linhaBase, dataNascimento);
}

// ----------------------------------------------------------------
// 3. Triângulo Social — letra + mês de nascimento (reduzido)
// ----------------------------------------------------------------
export function calcularTrianguloSocial(nome: string, dataNascimento: string): Triangulo {
  const nomeLimpo = nome.replace(/\s+/g, '').toUpperCase();
  if (!nomeLimpo) return construirTriangulo('social', [], dataNascimento);

  const partes = dataNascimento.replace(/\D/g, '');
  const mes = parseInt(partes.slice(2, 4));
  const mesReduzido = reduzirNumero(mes, false);

  const linhaBase = nomeLimpo
    .split('')
    .map(l => calcularValor(l))
    .filter(v => v > 0)
    .map(v => reduzirNumero(v + mesReduzido, false));

  return construirTriangulo('social', linhaBase, dataNascimento);
}

// ----------------------------------------------------------------
// 4. Triângulo do Destino — letra + (dia + mês reduzidos)
// ----------------------------------------------------------------
export function calcularTrianguloDestino(nome: string, dataNascimento: string): Triangulo {
  const nomeLimpo = nome.replace(/\s+/g, '').toUpperCase();
  if (!nomeLimpo) return construirTriangulo('destino', [], dataNascimento);

  const partes = dataNascimento.replace(/\D/g, '');
  const dia = parseInt(partes.slice(0, 2));
  const mes = parseInt(partes.slice(2, 4));
  const modificador = reduzirNumero(
    reduzirNumero(dia, false) + reduzirNumero(mes, false),
    false
  );

  const linhaBase = nomeLimpo
    .split('')
    .map(l => calcularValor(l))
    .filter(v => v > 0)
    .map(v => reduzirNumero(v + modificador, false));

  return construirTriangulo('destino', linhaBase, dataNascimento);
}

// ----------------------------------------------------------------
// Calcular todos os 4 triângulos de uma vez
// ----------------------------------------------------------------
export function calcularTodosTriangulos(
  nome: string,
  dataNascimento: string
): TodosTriangulos {
  return {
    vida: calcularTrianguloVida(nome, dataNascimento),
    pessoal: calcularTrianguloPessoal(nome, dataNascimento),
    social: calcularTrianguloSocial(nome, dataNascimento),
    destino: calcularTrianguloDestino(nome, dataNascimento),
  };
}

// ================================================================
// DETECÇÃO DE BLOQUEIOS
// ================================================================

/**
 * Detecta todos os bloqueios presentes em um ou mais triângulos.
 * Consolida bloqueios por código, registrando em quais triângulos aparecem
 * e quantas vezes cada um ocorre por triângulo.
 */
export function detectarBloqueios(
  triangulos: Partial<TodosTriangulos>
): Bloqueio[] {
  const mapa = new Map<string, Bloqueio>();

  for (const [tipoKey, triangulo] of Object.entries(triangulos)) {
    const tipo = tipoKey as Triangulo['tipo'];
    if (!triangulo) continue;

    // Usar contagemSequencias para obter contagens reais por triângulo
    const contagem = triangulo.contagemSequencias ?? {};

    for (const [codigo, count] of Object.entries(contagem)) {
      const dados = BLOQUEIOS_MAP[codigo];
      if (!dados) continue;

      if (mapa.has(codigo)) {
        const b = mapa.get(codigo)!;
        b.triangulos.push(tipo);
        b.repeticoesPortriangulo[tipo] = count;
        b.totalOcorrencias += count;
      } else {
        mapa.set(codigo, {
          codigo,
          titulo: dados.titulo,
          descricao: dados.descricao,
          aspectoSaude: dados.aspectoSaude,
          triangulos: [tipo],
          repeticoesPortriangulo: { [tipo]: count },
          totalOcorrencias: count,
        });
      }
    }
  }

  return Array.from(mapa.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/**
 * Retorna as sequências negativas de todos os triângulos consolidadas.
 */
export function todasSequenciasNegativas(todos: TodosTriangulos): string[] {
  const set = new Set<string>();
  for (const t of Object.values(todos)) {
    for (const s of t.sequenciasNegativas) {
      set.add(s.charAt(0).repeat(3));
    }
  }
  return Array.from(set).sort();
}

// Re-export legacy para compatibilidade com código existente
export { calcularTrianguloVida as calcularTrianguloDaVida };
