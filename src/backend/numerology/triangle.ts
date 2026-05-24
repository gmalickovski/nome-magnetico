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
    descricao: 'Esta sequência gera uma limitação energética que bloqueia a iniciativa, fazendo com que você perca a coragem de se aventurar no novo. Sob essa influência, é comum enfrentar longos períodos de inatividade, estagnação profissional ou uma sensação de impotência para realizar seus desejos, permanecendo nesse estado o tempo que durar o Arcano regente do período.',
    aspectoSaude: 'Tendência para desenvolver alguns distúrbios ou doenças cardíacas.',
  },
  '222': {
    titulo: 'Bloqueio de Associação (222)',
    descricao: 'Esta frequência vibra na polaridade da timidez e indecisão, criando um campo onde você pode ser facilmente subjugado(a) pelas pessoas mais próximas — sejam amigos, sócios ou colegas de trabalho. Esse bloqueio enfraquece a autoestima e limita drasticamente o avanço de seus projetos pessoais e realizações.',
    aspectoSaude: 'Pode, eventualmente, surgir alguma doença que provoque dependência.',
  },
  '333': {
    titulo: 'Bloqueio de Expressão (333)',
    descricao: 'Esta sequência gera uma barreira profunda na comunicação, trazendo a possibilidade de ser constantemente incompreendido(a). Há uma dificuldade severa no diálogo, especialmente no ambiente de trabalho e nas relações afetivas, dificultando a sua imposição em projetos e o seu poder de convencimento.',
    aspectoSaude: 'Indica possibilidade de doenças respiratórias ou de articulações.',
  },
  '444': {
    titulo: 'Bloqueio de Estruturação (444)',
    descricao: 'Reflete uma dificuldade direta na realização profissional. Esse bloqueio atrai cenários de má remuneração, estagnação na carreira e dificuldade de se firmar em empregos ou de se dar bem em qualquer atividade, tornando as perspectivas de futuro muito difíceis e pesadas.',
    aspectoSaude: 'Indica possibilidade de doenças reumáticas ou arteriais.',
  },
  '555': {
    titulo: 'Bloqueio de Liberdade (555)',
    descricao: 'Indica possíveis mudanças não desejadas de casa, de profissão ou de círculo social. Sob essa influência, a pessoa passa por frequentes altos e baixos, não se fixando profissionalmente e buscando sempre melhores oportunidades com enorme dificuldade de encontrá-las. Pode causar, também, uma fuga do meio social em que habita.',
    aspectoSaude: 'Desenvolver alguma doença de pele.',
  },
  '666': {
    titulo: 'Bloqueio de Harmonia (666)',
    descricao: 'Indica a possibilidade de haver grandes decepções com amigos, sócios, parentes e até com o parceiro amoroso. Cria uma aura onde as pessoas próximas parecem não compreender seus propósitos e sentimentos, gerando frustrações e quebras de confiança constantes.',
    aspectoSaude: 'Algum tipo de doença cardíaca pode aparecer nesse estado.',
  },
  '777': {
    titulo: 'Bloqueio de Conexão Espiritual (777)',
    descricao: 'Faz com que a pessoa se afaste de tudo e de todos. Pode levar ao desmando, transformando-o(a) em um ser dependente, vaidoso(a), arrogante e, consequentemente, vítima da própria intolerância. A persistência nesse bloqueio gera profundos sentimentos de solidão existencial.',
    aspectoSaude: 'Doenças nervosas, dependências e, eventualmente, algum tipo de câncer.',
  },
  '888': {
    titulo: 'Bloqueio de Poder e Abundância (888)',
    descricao: 'Esta sequência torna a pessoa arredia, afastando-a das atividades sociais. Caso não seja evoluído(a) espiritualmente, poderá descontrolar-se emocionalmente com muita facilidade frente aos problemas. Sob esta vibração, a vida oscila violentamente entre a riqueza e a pobreza.',
    aspectoSaude: 'Como consequência desse estresse extremo, poderá desenvolver alguma doença.',
  },
  '999': {
    titulo: 'Bloqueio de Compaixão Universal (999)',
    descricao: 'Reflete uma tendência a passar por grandes dificuldades financeiras, eventuais perdas de bens, fracassos nos negócios e vários tipos de provações provocadas pelos longos períodos de estagnação. Traz o peso das paralisações e dos encerramentos difíceis de ciclos.',
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
