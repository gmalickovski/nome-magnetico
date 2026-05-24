/**
 * Lições Kármicas e Tendências Ocultas.
 *
 * Lições Kármicas: números de 1 a 8 ausentes no nome completo.
 * Cada ausência indica uma qualidade que a alma ainda não desenvolveu
 * e que precisa ser trabalhada nesta encarnação.
 *
 * Tendências Ocultas: número que aparece 4 ou mais vezes no nome.
 * Indica um exagero daquela qualidade — pode ser positivo quando
 * bem canalizado, mas tende ao excesso.
 */

import { calcularValor, reduzirNumero, extrairLetras } from './core';

export interface LicaoCarmica {
  numero: number;
  titulo: string;
  descricao: string;
  comoTrabalhar: string;
}

export interface TendenciaOculta {
  numero: number;
  frequencia: number;
  titulo: string;
  descricao: string;
  comoEquilibrar: string;
}

// ================================================================
// LIÇÕES CÁRMICAS (números 1–8 ausentes no nome)
// ================================================================
export const LICOES_CARMICAS: Record<number, Omit<LicaoCarmica, 'numero'>> = {
  1: {
    titulo: 'Lição Kármica 1 — Desenvolver a Individualidade',
    descricao:
      'A ausência do 1 indica que a pessoa ainda não aprendeu a afirmar sua própria identidade, a liderar e a confiar em si mesma. Há tendência a depender excessivamente dos outros para tomar decisões e a ter dificuldades em iniciar projetos.',
    comoTrabalhar:
      'Praticar a autonomia nas pequenas decisões do dia a dia. Cultivar projetos pessoais. Desenvolver a autoconfiança sem esperar validação externa.',
  },
  2: {
    titulo: 'Lição Kármica 2 — Aprender a Cooperar',
    descricao:
      'A ausência do 2 indica dificuldades em parcerias, sensibilidade às relações e falta de diplomacia. A pessoa pode ser excessivamente independente ou, ao contrário, insegura ao lidar com o outro.',
    comoTrabalhar:
      'Praticar a escuta ativa e a empatia. Trabalhar em equipe com intenção consciente. Valorizar as contribuições dos outros.',
  },
  3: {
    titulo: 'Lição Kármica 3 — Desenvolver a Expressão',
    descricao:
      'A ausência do 3 indica bloqueios na comunicação, criatividade reprimida ou dificuldade em expressar sentimentos e ideias. A pessoa pode se sentir incompreendida ou ter dificuldades com o otimismo.',
    comoTrabalhar:
      'Praticar formas de expressão: escrita, arte, música, oratória. Trabalhar o humor e a leveza. Permitir-se criar sem julgamento.',
  },
  4: {
    titulo: 'Lição Kármica 4 — Construir a Disciplina',
    descricao:
      'A ausência do 4 indica falta de estrutura, dificuldades com rotina e comprometimento, e tendência a deixar projetos incompletos. Pode haver resistência ao trabalho metódico.',
    comoTrabalhar:
      'Criar e manter rotinas. Comprometer-se com projetos de longo prazo. Valorizar o trabalho concreto e as bases sólidas da vida.',
  },
  5: {
    titulo: 'Lição Kármica 5 — Aprender com a Experiência',
    descricao:
      'A ausência do 5 indica medo de mudanças, zona de conforto excessiva, resistência ao novo e dificuldades de adaptação. A pessoa pode ter perdido oportunidades por excesso de precaução.',
    comoTrabalhar:
      'Sair da zona de conforto de forma gradual. Aceitar convites para novas experiências. Cultivar a curiosidade e a adaptabilidade.',
  },
  6: {
    titulo: 'Lição Kármica 6 — Assumir Responsabilidades',
    descricao:
      'A ausência do 6 indica dificuldades com responsabilidades familiares ou comunitárias, tendência a fugir do cuidado com o outro ou, no extremo oposto, dificuldade de receber cuidado.',
    comoTrabalhar:
      'Cultivar os laços familiares e de amizade. Praticar o serviço ao próximo. Aprender a receber cuidado com gratidão.',
  },
  7: {
    titulo: 'Lição Kármica 7 — Desenvolver a Espiritualidade',
    descricao:
      'A ausência do 7 indica ceticismo excessivo, dificuldades com a introspecção e desconexão da dimensão espiritual. A pessoa pode se apoiar excessivamente no racional e evitar questões mais profundas.',
    comoTrabalhar:
      'Cultivar práticas de silêncio e contemplação. Estudar temas de autoconhecimento. Abrir-se para questões que vão além do material.',
  },
  8: {
    titulo: 'Lição Kármica 8 — Equilibrar o Poder e o Dinheiro',
    descricao:
      'A ausência do 8 indica dificuldades com a gestão de recursos materiais, medo do sucesso ou do poder, tendência a sabotar conquistas ou a ter uma relação desequilibrada com o dinheiro.',
    comoTrabalhar:
      'Desenvolver consciência financeira. Trabalhar a relação com autoridade e liderança. Aprender que o poder material pode ser usado para o bem.',
  },
};

// ================================================================
// TENDÊNCIAS OCULTAS (número que aparece ≥4 vezes)
// ================================================================
export const TENDENCIAS_OCULTAS: Record<number, Omit<TendenciaOculta, 'numero' | 'frequencia'>> = {
  1: {
    titulo: 'Tendência Oculta 1 — Excesso de Individualismo',
    descricao:
      'Quando o 1 aparece 4 ou mais vezes no nome, há uma forte tendência ao individualismo, à imposição da própria vontade e à dificuldade de aceitar a opinião alheia. O ego pode ser hipertrofiado.',
    comoEquilibrar:
      'Praticar a humildade e a escuta ativa. Trabalhar a colaboração. Reconhecer que a liderança verdadeira inspira, não impõe.',
  },
  2: {
    titulo: 'Tendência Oculta 2 — Excesso de Dependência',
    descricao:
      'Quando o 2 aparece 4 ou mais vezes, há tendência à dependência emocional, hipersensibilidade e dificuldade de tomar decisões sozinho. A pessoa pode ser excessivamente influenciável.',
    comoEquilibrar:
      'Desenvolver autonomia emocional. Praticar a tomada de decisões independentes. Trabalhar a autoestima.',
  },
  3: {
    titulo: 'Tendência Oculta 3 — Excesso de Dispersão',
    descricao:
      'Quando o 3 aparece 4 ou mais vezes, há tendência à dispersão, superficialidade, excesso de palavras e falta de foco. A criatividade pode se tornar frenética e improdutiva.',
    comoEquilibrar:
      'Cultivar o foco. Concluir o que se começa. Usar a criatividade com direcionamento e propósito.',
  },
  4: {
    titulo: 'Tendência Oculta 4 — Excesso de Rigidez',
    descricao:
      'Quando o 4 aparece 4 ou mais vezes, há tendência ao perfeccionismo excessivo, rigidez, dificuldade de mudança e possível teimosia. O trabalho pode se tornar obsessivo.',
    comoEquilibrar:
      'Praticar a flexibilidade. Aceitar que a perfeição é inimiga do bom. Aprender a delegar.',
  },
  5: {
    titulo: 'Tendência Oculta 5 — Excesso de Instabilidade',
    descricao:
      'Quando o 5 aparece 4 ou mais vezes, há tendência à impulsividade, inconstância, dificuldade de compromisso e busca compulsiva por novidades e sensações.',
    comoEquilibrar:
      'Desenvolver a constância. Criar raízes e vínculos duradouros. Canalizar a energia para projetos com substância.',
  },
  6: {
    titulo: 'Tendência Oculta 6 — Excesso de Controle',
    descricao:
      'Quando o 6 aparece 4 ou mais vezes, há tendência ao perfeccionismo nas relações, ao ciúme, à necessidade de controlar o ambiente e os outros para se sentir seguro.',
    comoEquilibrar:
      'Praticar a confiança. Respeitar a autonomia dos outros. Aprender que o amor não controla — liberta.',
  },
  7: {
    titulo: 'Tendência Oculta 7 — Excesso de Isolamento',
    descricao:
      'Quando o 7 aparece 4 ou mais vezes, há tendência ao isolamento, ao ceticismo exagerado e à dificuldade de se relacionar. A introspecção pode se tornar distanciamento.',
    comoEquilibrar:
      'Buscar equilíbrio entre o silêncio interior e a participação social. Compartilhar o conhecimento acumulado.',
  },
  8: {
    titulo: 'Tendência Oculta 8 — Excesso de Materialismo',
    descricao:
      'Quando o 8 aparece 4 ou mais vezes, há tendência à ambição desmedida, ao materialismo e à dificuldade de separar valor pessoal de valor financeiro.',
    comoEquilibrar:
      'Cultivar valores além do material. Praticar a generosidade. Lembrar que o poder é um meio, não um fim.',
  },
};

// ================================================================
// FUNÇÕES DE CÁLCULO
// ================================================================

/**
 * Detecta as lições kármics: números de 1 a 8 ausentes no nome.
 */
export function detectarLicoesCarmicas(nomeCompleto: string): LicaoCarmica[] {
  const letras = extrairLetras(nomeCompleto);

  // Mapear quais números (1–8) aparecem no nome
  const numerosPresentes = new Set<number>();
  for (const letra of letras) {
    const v = calcularValor(letra);
    const reduzido = reduzirNumero(v, false);
    if (reduzido >= 1 && reduzido <= 8) {
      numerosPresentes.add(reduzido);
    }
  }

  // Números ausentes = lições kármics
  const licoes: LicaoCarmica[] = [];
  for (let n = 1; n <= 8; n++) {
    if (!numerosPresentes.has(n)) {
      const dados = LICOES_CARMICAS[n];
      if (dados) {
        licoes.push({ numero: n, ...dados });
      }
    }
  }

  return licoes;
}

/**
 * Detecta as tendências ocultas: número que aparece ≥4 vezes no nome.
 */
export function detectarTendenciasOcultas(nomeCompleto: string): TendenciaOculta[] {
  const letras = extrairLetras(nomeCompleto);

  // Contar frequência de cada número
  const frequencias: Record<number, number> = {};
  for (const letra of letras) {
    const v = calcularValor(letra);
    const reduzido = reduzirNumero(v, false);
    if (reduzido >= 1 && reduzido <= 8) {
      frequencias[reduzido] = (frequencias[reduzido] ?? 0) + 1;
    }
  }

  // Números com frequência ≥4 = tendências ocultas
  const tendencias: TendenciaOculta[] = [];
  for (const [numStr, freq] of Object.entries(frequencias)) {
    const n = parseInt(numStr);
    if (freq >= 4 && TENDENCIAS_OCULTAS[n]) {
      tendencias.push({
        numero: n,
        frequencia: freq,
        ...TENDENCIAS_OCULTAS[n]!,
      });
    }
  }

  // Ordenar por frequência (maior primeiro)
  return tendencias.sort((a, b) => b.frequencia - a.frequencia);
}

// ================================================================
// DÉBITOS KÁRMICOS (13, 14, 16, 19)
// ================================================================

export type DebitoFonte = 'dia_natalicio' | 'destino' | 'motivacao' | 'expressao';

export interface DebitoCarmicoInfo {
  numero: number; // 13, 14, 16 ou 19
  titulo: string;
  descricao: string;
  /** Origens que geraram este débito */
  fontes: DebitoFonte[];
  /**
   * true  → vem APENAS do dia de nascimento e/ou Destino (imutáveis).
   *         Nenhuma variação de nome pode eliminar este débito.
   * false → vem também de Motivação ou Expressão (mutáveis pelo nome).
   */
  fixo: boolean;
}

export const DEBITOS_CARMICOS_MAP: Record<number, Omit<DebitoCarmicoInfo, 'numero' | 'fontes' | 'fixo'>> = {
  13: {
    titulo: 'Débito Kármico 13 — Transformação pela Disciplina',
    descricao:
      'O 13 indica que em vidas passadas houve preguiça, abuso da generosidade alheia ou fuga das responsabilidades. Nesta encarnação, o caminho exige esforço consistente, disciplina e comprometimento com o trabalho. Resultados chegam, mas pedem persistência — atalhos serão bloqueados até que a lição seja integrada.',
  },
  14: {
    titulo: 'Débito Kármico 14 — Equilíbrio da Liberdade',
    descricao:
      'O 14 surge de vidas em que houve abuso dos prazeres, excesso de liberdade às custas dos outros ou dependências que prejudicaram o próprio desenvolvimento. Esta vida pede moderação, constância e a capacidade de construir algo duradouro sem se perder em excessos ou impulsividade.',
  },
  16: {
    titulo: 'Débito Kármico 16 — Renascimento pelo Ego',
    descricao:
      'O 16 carrega a memória de orgulho excessivo, relacionamentos conduzidos com egoísmo ou abuso de posição de poder. Nesta encarnação, situações de "queda" podem surgir para reconstruir a identidade em bases mais humildes e genuínas. A transformação profunda do ego é a chave deste débito.',
  },
  19: {
    titulo: 'Débito Kármico 19 — Independência Responsável',
    descricao:
      'O 19 indica que em encarnações passadas o poder foi exercido de forma egoísta, desconsiderando o impacto sobre os outros. Esta vida pede que a liderança e a independência sejam exercidas com responsabilidade e compaixão. O isolamento surge quando há resistência a reconhecer a interdependência com os demais.',
  },
};

// Mapa: número numerológico → débito kármico associado
const NUMERO_PARA_DEBITO: Record<number, number> = {
  4: 13,
  5: 14,
  7: 16,
  1: 19,
};

/**
 * Calcula os débitos kármicos presentes na pessoa.
 * Fontes:
 *   1. Dia de nascimento ∈ {13, 14, 16, 19} → débito direto (FIXO)
 *   2. Destino ∈ {1, 4, 5, 7} → débito correspondente (FIXO)
 *   3. Motivação ∈ {1, 4, 5, 7} → débito correspondente (variável)
 *   4. Expressão ∈ {1, 4, 5, 7} → débito correspondente (variável)
 *
 * Um débito é `fixo = true` quando sua única origem é dia_natalicio e/ou destino
 * (imutáveis pela data de nascimento). Se também vier de Motivação ou Expressão,
 * `fixo = false` — pode ser eliminado por uma variação do nome.
 */
export function calcularDebitosCarmicos(
  dataNascimento: string, // DD/MM/YYYY
  numeroDestino: number,
  numeroMotivacao: number,
  numeroExpressao: number
): DebitoCarmicoInfo[] {
  // Acumula as fontes de cada débito
  const debitoFontes = new Map<number, Set<DebitoFonte>>();

  const adicionar = (numero: number, fonte: DebitoFonte) => {
    if (!debitoFontes.has(numero)) debitoFontes.set(numero, new Set());
    debitoFontes.get(numero)!.add(fonte);
  };

  // 1. Dia de nascimento (fixo)
  const partes = dataNascimento.split('/');
  const dia = partes[0] ? parseInt(partes[0], 10) : 0;
  if ([13, 14, 16, 19].includes(dia)) {
    adicionar(dia, 'dia_natalicio');
  }

  // 2. Destino (fixo — deriva da data de nascimento)
  const dDebito = NUMERO_PARA_DEBITO[reduzirNumero(numeroDestino, false)];
  if (dDebito !== undefined) adicionar(dDebito, 'destino');

  // 3. Motivação (variável — depende das vogais do nome)
  const mDebito = NUMERO_PARA_DEBITO[reduzirNumero(numeroMotivacao, false)];
  if (mDebito !== undefined) adicionar(mDebito, 'motivacao');

  // 4. Expressão (variável — depende de todas as letras do nome)
  const eDebito = NUMERO_PARA_DEBITO[reduzirNumero(numeroExpressao, false)];
  if (eDebito !== undefined) adicionar(eDebito, 'expressao');

  return Array.from(debitoFontes.entries())
    .sort(([a], [b]) => a - b)
    .map(([numero, fontesSet]) => {
      const fontes = Array.from(fontesSet) as DebitoFonte[];
      const fixo = fontes.every(f => f === 'dia_natalicio' || f === 'destino');
      return {
        numero,
        ...DEBITOS_CARMICOS_MAP[numero]!,
        fontes,
        fixo,
      };
    });
}

/**
 * Retorna a frequência de todos os números no nome (útil para visualização).
 */
export function mapearFrequencias(nomeCompleto: string): Record<number, number> {
  const letras = extrairLetras(nomeCompleto);
  const freq: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

  for (const letra of letras) {
    const v = calcularValor(letra);
    const r = reduzirNumero(v, false);
    if (r >= 1 && r <= 8) {
      freq[r] = (freq[r] ?? 0) + 1;
    }
  }

  return freq;
}
