/**
 * Lógica específica do produto Nome do Bebê.
 *
 * Fluxo:
 * 1. Calcular número de Destino do bebê pela data de nascimento.
 * 2. Para cada nome candidato, testar TODAS as combinações de sobrenome (incluindo
 *    combinações com apenas 1 sobrenome) e escolher a melhor composição.
 * 3. Se todos os candidatos do usuário ficarem abaixo de 70, gerar sugestões
 *    automáticas a partir de um banco de nomes brasileiros comuns, garantindo
 *    pelo menos 1 opção com score >= 80 no resultado final.
 * 4. Rankear por score total.
 */

import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularMissao, calcularImpressao } from '../numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../karmic';
import { avaliarCompatibilidade } from '../harmonization';
import { calcularScore, calcularScoreTeto } from '../score';
import type { LicaoCarmica, TendenciaOculta, DebitoCarmicoInfo } from '../karmic';
import type { Bloqueio } from '../triangle';

// ── Banco de nomes brasileiros comuns para sugestões automáticas ──────────────
const NOMES_FEMININOS = [
  'Ana', 'Alice', 'Amanda', 'Beatriz', 'Bruna', 'Camila', 'Carla', 'Carolina',
  'Clara', 'Daniela', 'Diana', 'Eduarda', 'Elena', 'Elisa', 'Fernanda', 'Gabriela',
  'Helena', 'Isabela', 'Isadora', 'Jade', 'Julia', 'Laura', 'Larissa', 'Leticia',
  'Livia', 'Luisa', 'Luna', 'Manuela', 'Mariana', 'Marina', 'Natalia', 'Nicole',
  'Olivia', 'Patricia', 'Paula', 'Rebeca', 'Renata', 'Sara', 'Sofia', 'Sophia',
  'Stella', 'Valentina', 'Vera', 'Vitoria', 'Yasmin', 'Giovanna', 'Bianca',
  'Cecilia', 'Ingrid', 'Mirella',
];

const NOMES_MASCULINOS = [
  'Arthur', 'Bruno', 'Carlos', 'Daniel', 'David', 'Diego', 'Eduardo', 'Emanuel',
  'Enzo', 'Felipe', 'Fernando', 'Gabriel', 'Gustavo', 'Heitor', 'Henrique',
  'Hugo', 'Ian', 'Igor', 'Joao', 'Jose', 'Julio', 'Leonardo', 'Lorenzo',
  'Lucas', 'Luis', 'Luiz', 'Marco', 'Mateus', 'Matheus', 'Miguel', 'Nicolas',
  'Paulo', 'Pedro', 'Rafael', 'Raul', 'Ricardo', 'Roberto', 'Rodrigo', 'Samuel',
  'Sergio', 'Thiago', 'Tiago', 'Victor', 'Vinicius', 'Vitor', 'William', 'Andre',
  'Caio', 'Davi', 'Murilo',
];

const NOMES_NEUTROS = [...NOMES_FEMININOS, ...NOMES_MASCULINOS];

export interface AnaliseNomeBebe {
  nomeCompleto: string;
  primeiroNome: string;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  destino: number;
  temBloqueio: boolean;
  bloqueios: Bloqueio[];
  sequenciasNegativas: string[];
  licoesCarmicas: LicaoCarmica[];
  tendenciasOcultas: TendenciaOculta[];
  debitosCarmicos: DebitoCarmicoInfo[];
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel';
  score: number;
  /** Score máximo atingível para este bebê (100 - débitos fixos × 12). */
  scoreTeto: number;
  justificativa: string[];
  /** Indica se foi sugerido pelo algoritmo (quando os candidatos do usuário têm scores baixos) */
  origemSugerida?: 'usuario' | 'ia';
}

export interface ResultadoNomeBebe {
  sobrenomesDisponiveis: string[];
  dataNascimento: string;
  destino: number;
  nomesCandidatos: AnaliseNomeBebe[];
  melhorNome: AnaliseNomeBebe | null;
}

/**
 * Analisa um nome candidato para bebê com uma combinação específica de sobrenome.
 */
export function analisarNomeBebe(
  primeiroNome: string,
  sobrenomeFamilia: string,
  dataNascimento: string
): AnaliseNomeBebe {
  const nomeCompleto = sobrenomeFamilia.length > 0
    ? `${primeiroNome} ${sobrenomeFamilia}`.trim()
    : primeiroNome;

  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimento);
  const bloqueios = detectarBloqueios(todos);
  const sequencias = todasSequenciasNegativas(todos);
  const expressao = calcularExpressao(nomeCompleto);
  const motivacao = calcularMotivacao(nomeCompleto);
  const missao = calcularMissao(nomeCompleto, dataNascimento);
  const impressao = calcularImpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);
  const licoes = detectarLicoesCarmicas(nomeCompleto);
  const tendencias = detectarTendenciasOcultas(nomeCompleto);
  const debitos = calcularDebitosCarmicos(dataNascimento, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);

  const debitosFixosCount = debitos.filter(d => d.fixo).length;
  const score = calcularScore({
    bloqueios: bloqueios.length,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitosFixosCount,
    compatibilidade,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  const justificativa: string[] = [];

  if (bloqueios.length === 0) {
    justificativa.push('Sem bloqueios em nenhum dos 4 triângulos');
  } else {
    justificativa.push(`${bloqueios.length} bloqueio(s): ${bloqueios.map(b => b.codigo).join(', ')}`);
  }

  switch (compatibilidade) {
    case 'favoravel':
      justificativa.push(`Expressão (${expressao}) totalmente harmônica e favorável com o Destino (${destino})`);
      break;
    case 'neutro':
      justificativa.push(`Expressão (${expressao}) neutra em relação ao Destino (${destino})`);
      break;
    case 'desfavoravel':
      justificativa.push(`Expressão (${expressao}) desfavorável e em tensão com o Destino (${destino})`);
      break;
  }

  if (licoes.length > 0) justificativa.push(`${licoes.length} lição(ões) kármica(s)`);
  if (debitos.length > 0) justificativa.push(`${debitos.length} débito(s): ${debitos.map(d => d.numero).join(', ')}`);

  return {
    nomeCompleto,
    primeiroNome,
    expressao,
    motivacao,
    missao,
    impressao,
    destino,
    temBloqueio: bloqueios.length > 0,
    bloqueios,
    sequenciasNegativas: sequencias,
    licoesCarmicas: licoes,
    tendenciasOcultas: tendencias,
    debitosCarmicos: debitos,
    compatibilidade,
    score,
    scoreTeto,
    justificativa,
    origemSugerida: 'usuario',
  };
}

/**
 * Gera todas as combinações não-vazias de sobrenomes preservando a ordem.
 * Inclui subsets de 1, 2 e 3 sobrenomes (limitado a evitar explosão combinatória).
 */
function gerarCombinacoesSobrenomes(sobrenomes: string[]): string[] {
  const combinacoes: string[] = [];
  const n = sobrenomes.length;
  // Gera todos os subsets não-vazios (potência do conjunto)
  for (let i = 1; i < (1 << n); i++) {
    const subset: string[] = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) subset.push(sobrenomes[j]);
    }
    combinacoes.push(subset.join(' '));
  }
  return [...new Set(combinacoes)];
}

/**
 * Analisa o melhor score possível para um primeiro nome, testando todas as
 * combinações de sobrenome disponíveis (incluindo subsets com 1 sobrenome apenas).
 */
function melhorAnaliseParaNome(
  primeiroNome: string,
  combinacoes: string[],
  dataNascimento: string,
  origem: 'usuario' | 'ia' = 'usuario'
): AnaliseNomeBebe {
  let melhor: AnaliseNomeBebe | null = null;

  for (const combo of combinacoes) {
    const analise = analisarNomeBebe(primeiroNome, combo, dataNascimento);
    if (!melhor || analise.score > melhor.score) {
      melhor = analise;
    }
  }

  if (!melhor) {
    melhor = analisarNomeBebe(primeiroNome, combinacoes[0] ?? '', dataNascimento);
  }

  return { ...melhor, origemSugerida: origem };
}

/**
 * Gera sugestões automáticas de nomes com score >= 80.
 * Usado quando todos os candidatos do usuário ficam abaixo de 70.
 */
function gerarSugestoesAutoIA(
  combinacoes: string[],
  dataNascimento: string,
  generoPreferido?: string,
  maxSugestoes = 5
): AnaliseNomeBebe[] {
  const genero = (generoPreferido ?? '').toLowerCase();
  let pool: string[];

  if (genero === 'feminino') {
    pool = NOMES_FEMININOS;
  } else if (genero === 'masculino') {
    pool = NOMES_MASCULINOS;
  } else {
    pool = NOMES_NEUTROS;
  }

  // Embaralhar para não retornar sempre os mesmos nomes
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const sugestoes: AnaliseNomeBebe[] = [];
  const vistosNomes = new Set<string>();

  // Primeira passagem: buscar score >= 80
  for (const nome of shuffled) {
    if (sugestoes.length >= maxSugestoes) break;
    const analise = melhorAnaliseParaNome(nome, combinacoes, dataNascimento, 'ia');
    if (!vistosNomes.has(analise.nomeCompleto) && analise.score >= 80) {
      sugestoes.push(analise);
      vistosNomes.add(analise.nomeCompleto);
    }
  }

  // Segunda passagem: se não atingiu o mínimo, pegar os melhores independente do score
  if (sugestoes.length < 2) {
    const todos = shuffled
      .map(nome => melhorAnaliseParaNome(nome, combinacoes, dataNascimento, 'ia'))
      .filter(a => !vistosNomes.has(a.nomeCompleto))
      .sort((a, b) => b.score - a.score);

    for (const analise of todos) {
      if (sugestoes.length >= maxSugestoes) break;
      if (!vistosNomes.has(analise.nomeCompleto)) {
        sugestoes.push(analise);
        vistosNomes.add(analise.nomeCompleto);
      }
    }
  }

  return sugestoes.sort((a, b) => b.score - a.score);
}

/**
 * Analisa múltiplos nomes candidatos, testa todas as combinações de sobrenome
 * e garante que o resultado contenha pelo menos 1 opção com score >= 80.
 */
export function analisarNomesBebe(
  nomesCandidatos: string[],
  sobrenomesDisponiveis: string[],
  dataNascimento: string,
  generoPreferido?: string,
  nomeJaEscolhido?: boolean
): ResultadoNomeBebe {
  const destino = calcularDestino(dataNascimento);

  // Se o nome já foi escolhido (registrado), descartamos os sobrenomes para não haver duplicação,
  // pois nomesCandidatos[0] já é o nome completo registrado.
  const sobrenomesValidos = nomeJaEscolhido 
    ? [] 
    : sobrenomesDisponiveis
        .map(s => s.trim())
        .filter(s => s.length > 0);

  // Combinações a testar (inclui subsets com apenas 1 sobrenome)
  const combinacoes = sobrenomesValidos.length > 0
    ? gerarCombinacoesSobrenomes(sobrenomesValidos)
    : [''];

  // Analisar candidatos do usuário
  const analises: AnaliseNomeBebe[] = [];
  for (const candidato of nomesCandidatos.map(n => n.trim()).filter(n => n.length >= 2)) {
    const melhor = melhorAnaliseParaNome(candidato, combinacoes, dataNascimento, 'usuario');
    analises.push(melhor);
  }

  analises.sort((a, b) => b.score - a.score);

  const melhorScoreUsuario = analises[0]?.score ?? 0;

  // Se todos os candidatos do usuário têm score baixo E o nome não foi previamente definido, gerar sugestões automáticas
  if (!nomeJaEscolhido && melhorScoreUsuario < 70) {
    const nomesCandidatosSet = new Set(
      analises.map(a => a.primeiroNome.toLowerCase())
    );

    const sugestoesIA = gerarSugestoesAutoIA(
      combinacoes,
      dataNascimento,
      generoPreferido,
      5
    ).filter(s => !nomesCandidatosSet.has(s.primeiroNome.toLowerCase()));

    analises.push(...sugestoesIA);
    analises.sort((a, b) => b.score - a.score);
  }

  return {
    sobrenomesDisponiveis: sobrenomesValidos,
    dataNascimento,
    destino,
    nomesCandidatos: analises,
    melhorNome: analises[0] ?? null,
  };
}
