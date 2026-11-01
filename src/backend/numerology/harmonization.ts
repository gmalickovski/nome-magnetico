/**
 * Harmonização Numerológica de Nome / Assinatura.
 *
 * Procedimento formal baseado no curso de numerologia cabalística:
 * 1. Detectar sequências negativas em todos os 4 triângulos.
 * 2. Definir um número de Expressão compatível com o número de Destino.
 * 3. Gerar variações do nome que eliminem os bloqueios E tenham
 *    Expressão compatível com o Destino.
 * 4. Avaliar critérios objetivos da assinatura.
 *
 * Compatibilidade Expressão × Destino:
 * - Harmonia total: mesma vibração após redução
 * - Harmonia complementar: números que se somam formando o Destino
 * - Aceitável: diferença de 1 na vibração final
 */

import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from './triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao } from './numbers';
import { reduzirNumero, calcularValor, extrairLetras } from './core';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from './karmic';
import { calcularScore, calcularScoreTeto } from './score'; // legado v1 — aposentar na F2+
import type { Bloqueio } from './triangle';

export interface AvaliacaoNome {
  nome: string;
  expressao: number;
  temBloqueio: boolean;
  bloqueios: Bloqueio[];
  sequenciasNegativas: string[];
  compatibilidadeDestino: 'favoravel' | 'neutro' | 'desfavoravel';
  aviso?: string;
  score: number; // 0–100
  /** Score máximo atingível para esta pessoa (100 - débitos fixos × 12). */
  scoreTeto: number;
  justificativa: string[];
}

export interface ResultadoHarmonizacao {
  nomeOriginal: string;
  expressaoOriginal: number;
  destino: number;
  bloqueiosOriginais: Bloqueio[];
  sequenciasOriginais: string[];
  sugestoes: AvaliacaoNome[];
  criteriosAssinatura: CriteriosAssinatura;
}

export interface CriteriosAssinatura {
  deveSerLegivel: string;
  inclinacao: string;
  semTracosNegativos: string;
  esteticaGeral: string;
}

// Critérios objetivos da assinatura (método não-radiestésico)
export const CRITERIOS_ASSINATURA: CriteriosAssinatura = {
  deveSerLegivel:
    'A assinatura deve ser totalmente legível, permitindo identificar claramente o nome. Assinaturas ilegíveis criam uma "máscara" energética que dificulta a manifestação da identidade.',
  inclinacao:
    'A inclinação ideal é levemente ascendente (da esquerda para a direita), simbolizando progresso e evolução. Inclinações descendentes indicam tendência à resignação.',
  semTracosNegativos:
    'Evitar traços que cortam as letras (especialmente o "t" cruzado de forma agressiva), pontos excessivos e sublinhos que criam barreiras energéticas no nome.',
  esteticaGeral:
    'A assinatura deve ser esteticamente equilibrada, sem excessos de ornamentos ou compressão das letras. O espaçamento entre as letras reflete a abertura para as oportunidades.',
};

// ================================================================
// AVALIAÇÃO DE COMPATIBILIDADE
// ================================================================

export type TipoCompatibilidade = 'favoravel' | 'neutro' | 'desfavoravel';

// DEV-260: 11 e 22 removidos dos neutros nos Destinos 1–9. Destinos 11 e 22 mantidos.
export const TABELA_HARMONIZACAO: Record<
  number,
  { favoravel: number[]; desfavoravel: number[]; neutro: number[] }
> = {
  1: { favoravel: [3, 5, 9], desfavoravel: [6], neutro: [1, 2, 4, 7, 8] },
  2: { favoravel: [2, 4, 6, 7], desfavoravel: [5, 9], neutro: [1, 3, 8] },
  3: { favoravel: [1, 3, 5, 6], desfavoravel: [4, 7, 8], neutro: [2, 9] },
  4: { favoravel: [2, 6, 8], desfavoravel: [3, 5, 7, 9], neutro: [1, 4] },
  5: { favoravel: [1, 3, 5, 7, 9], desfavoravel: [2, 4, 6, 8], neutro: [] },
  6: { favoravel: [2, 3, 4, 8, 9], desfavoravel: [1, 5, 7], neutro: [6] },
  7: { favoravel: [2, 5, 7], desfavoravel: [3, 4, 6, 8, 9], neutro: [1] },
  8: { favoravel: [4, 6], desfavoravel: [3, 5, 7, 8, 9], neutro: [1, 2] },
  9: { favoravel: [1, 5, 6, 9], desfavoravel: [2, 4, 7, 8], neutro: [3] },
  11: { favoravel: [1, 3, 5, 7, 9, 11], desfavoravel: [2, 4, 6, 8], neutro: [22] },
  22: { favoravel: [1, 2, 3, 4, 5, 6, 7, 8, 9, 22], desfavoravel: [], neutro: [11] }
};

/**
 * Avalia a compatibilidade entre o número de Expressão e o de Destino.
 */
export function avaliarCompatibilidade(
  expressao: number,
  destino: number
): TipoCompatibilidade {
  const expR = reduzirNumero(expressao, true); // preservar 11 e 22
  const destR = reduzirNumero(destino, true);   // preservar 11 e 22

  // Se o destino reduzido não estiver no mapeamento, faz a redução simples dele
  let rowKey = destR;
  if (!TABELA_HARMONIZACAO[rowKey]) {
    rowKey = reduzirNumero(destR, false);
  }

  const config = TABELA_HARMONIZACAO[rowKey];
  if (!config) return 'neutro'; // Fallback absoluto

  // Função auxiliar de busca
  const verificar = (num: number): TipoCompatibilidade | null => {
    if (config.favoravel.includes(num)) return 'favoravel';
    if (config.desfavoravel.includes(num)) return 'desfavoravel';
    if (config.neutro.includes(num)) return 'neutro';
    return null;
  };

  // DEV-260: Tenta direto com valor preservando master. Fallback 11->2 / 22->4 removido.
  const direto = verificar(expR);
  if (direto !== null) return direto;

  // Se não está listado nem em favorável nem em neutro (ex.: 11/22 em Destinos 1-9), é desfavorável.
  return 'desfavoravel';
}


/**
 * DEV-260: Aviso quando a compatibilidade for desfavorável (Tensão Vibracional).
 */
export function obterAvisoCompatibilidade(compatibilidade: TipoCompatibilidade): string | undefined {
  if (compatibilidade === 'desfavoravel') {
    return 'Atenção: Combinação com Tensão Vibracional entre Expressão e Destino.';
  }
  return undefined;
}

/**
 * DEV-260: Verifica se a pessoa já possui 11 ou 22 em seus números básicos.
 */
export function pessoaTemMaster11ou22(dados: {
  destino?: number;
  motivacao?: number;
  missao?: number;
  diaNascimento?: number;
  dataNascimento?: string;
}): boolean {
  let dia = dados.diaNascimento;
  if (dia === undefined && dados.dataNascimento) {
    const partes = dados.dataNascimento.split(/[\/\-]/);
    if (partes[0]) dia = parseInt(partes[0], 10);
  }
  return (
    dados.destino === 11 || dados.destino === 22 ||
    dados.motivacao === 11 || dados.motivacao === 22 ||
    dados.missao === 11 || dados.missao === 22 ||
    dia === 11 || dia === 22
  );
}

// ================================================================
// SCORE DE UM NOME
// ================================================================

/**
 * Calcula o score de uma variação de nome (0–100) com fórmula v1.
 * @deprecated Legado — preferir `avaliarNome` de `score.ts` quando SCORE_VERSION=v3.
 */
export function avaliarNomeHarmonizacaoLegado(
  nomeCompleto: string,
  dataNascimento: string
): AvaliacaoNome {
  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimento);
  const bloqueios = detectarBloqueios(todos);
  const sequencias = todasSequenciasNegativas(todos);
  const expressao = calcularExpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);

  const motivacao = calcularMotivacao(nomeCompleto);
  const licoesCarmicas = detectarLicoesCarmicas(nomeCompleto);
  const tendenciasOcultas = detectarTendenciasOcultas(nomeCompleto);
  const debitosCarmicos = calcularDebitosCarmicos(dataNascimento, destino, motivacao, expressao);

  const debitosFixosCount = debitosCarmicos.filter(d => d.fixo).length;
  const totalOcorrencias = bloqueios.reduce((sum, b) => sum + b.totalOcorrencias, 0);
  const ocorrenciasExtras = totalOcorrencias - bloqueios.length;
  const score = calcularScore({
    bloqueios: bloqueios.length,
    ocorrenciasExtras,
    licoesCarmicas: licoesCarmicas.length,
    tendenciasOcultas: tendenciasOcultas.length,
    debitosCarmicos: debitosCarmicos.length,
    debitosCarmicoFixos: debitosFixosCount,
    compatibilidade,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  const justificativa: string[] = [];

  if (bloqueios.length === 0) {
    justificativa.push('✓ Sem sequências negativas em nenhum triângulo');
  } else {
    justificativa.push(
      `✗ ${bloqueios.length} bloqueio(s) detectado(s): ${bloqueios.map(b => b.codigo).join(', ')}`
    );
    for (const b of bloqueios) {
      const detTriangulos = Object.entries(b.repeticoesPortriangulo)
        .map(([t, c]) => (c > 1 ? `${t}(${c}×)` : t))
        .join(', ');
      justificativa.push(`  • ${b.titulo} → aparece em: ${detTriangulos}`);
    }
  }

  switch (compatibilidade) {
    case 'favoravel':
      justificativa.push(`✓ Expressão (${expressao}) totalmente harmônica e favorável com Destino (${destino})`);
      break;
    case 'neutro':
      justificativa.push(`~ Expressão (${expressao}) neutra em relação ao Destino (${destino})`);
      break;
    case 'desfavoravel':
      justificativa.push(`✗ Expressão (${expressao}) pouco compatível e desfavorável com o Destino (${destino})`);
      break;
  }

  const aviso = obterAvisoCompatibilidade(compatibilidade);
  if (aviso) {
    justificativa.push(`⚠️ ${aviso}`);
  }

  return {
    nome: nomeCompleto,
    expressao,
    temBloqueio: bloqueios.length > 0,
    bloqueios,
    sequenciasNegativas: sequencias,
    compatibilidadeDestino: compatibilidade,
    aviso,
    score,
    scoreTeto,
    justificativa,
  };
}

// ================================================================
// GERAÇÃO DE VARIAÇÕES
// ================================================================

/**
 * Gera variações do nome usando técnicas de harmonização cabalística:
 * - Adição/remoção de letras
 * - Substituição de acentos (modifica o valor numérico)
 * - Variações do primeiro nome mantendo os sobrenomes
 * - Abreviações e hipocorísticos
 */
/** Candidatos do gerador atual (potencial v3). */
export interface OpcoesHarmonizacao {
  sobrenomeCasamento?: string;
  destino?: number;
  motivacao?: number;
  missao?: number;
  diaNascimento?: number;
}

export function gerarCandidatosHarmonizacao(
  nomeCompleto: string,
  opcoes?: OpcoesHarmonizacao
): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiroNome = partes[0]!;
  const sobrenomesArr = partes.slice(1);
  const sobrenomes = sobrenomesArr.join(' ');
  const candidatos = new Set<string>();

  // DEV-260: Novos métodos de sugestão seguindo as regras do curso
  // Ordem: estruturais primeiro (remover sobrenome/primeiro nome, inicial, casamento), acento por último.
  // NUNCA usar anel ° (Å/å) em nome social.

  // 1. Estrutural: Tirar sobrenome (se tiver >= 2 sobrenomes)
  if (sobrenomesArr.length >= 2) {
    for (let i = 0; i < sobrenomesArr.length; i++) {
      const restantes = sobrenomesArr.filter((_, idx) => idx !== i);
      candidatos.add([primeiroNome, ...restantes].join(' '));
    }
    // Apenas primeiro nome + último sobrenome
    candidatos.add(`${primeiroNome} ${sobrenomesArr[sobrenomesArr.length - 1]}`);
  }

  // 2. Estrutural: Tirar primeiro nome (se tiver >= 2 partes totais)
  if (partes.length >= 3) {
    candidatos.add(sobrenomes); // apenas os sobrenomes
    const segundoNome = partes[1]!;
    const resto = partes.slice(2).join(' ');
    candidatos.add([segundoNome, resto].filter(Boolean).join(' '));
  }

  // 3. Estrutural: Abreviar com inicial (ex.: "M. Silva Santos" ou "Maria S. Santos")
  if (primeiroNome.length > 1) {
    const inicial = primeiroNome.charAt(0).toUpperCase() + '.';
    if (sobrenomes) {
      candidatos.add(`${inicial} ${sobrenomes}`);
    }
  }
  if (sobrenomesArr.length >= 2) {
    // Abreviar o sobrenome do meio
    const meioAbreviado = sobrenomesArr.map((s, idx) => {
      if (idx === 0) return s.charAt(0).toUpperCase() + '.';
      return s;
    }).join(' ');
    candidatos.add(`${primeiroNome} ${meioAbreviado}`);
  }

  // 4. Estrutural: Sobrenome de casamento (quando informado)
  if (opcoes?.sobrenomeCasamento && opcoes.sobrenomeCasamento.trim()) {
    const casam = opcoes.sobrenomeCasamento.trim();
    candidatos.add(`${nomeCompleto} ${casam}`);
    candidatos.add(`${primeiroNome} ${casam}`);
    if (sobrenomesArr.length >= 1) {
      candidatos.add(`${primeiroNome} ${sobrenomesArr[0]} ${casam}`);
    }
  }

  // 5. Adição de sufixo suave no primeiro nome
  const finais = ['a', 'e', 'i', 'o', 'u', 'na', 'ia', 'ela', 'ara'];
  for (const f of finais) {
    const base = primeiroNome.replace(/[aeiou]$/i, '');
    if (base.length >= 2) {
      const novo = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + f;
      candidatos.add([novo, sobrenomes].filter(Boolean).join(' '));
    }
  }

  // 6. Prefixo tradicional
  const prefixos = ['Maria', 'Ana', 'João', 'José', 'Pedro', 'Lucas', 'Luíza', 'Clara'];
  prefixos.forEach(p => {
    candidatos.add([p, nomeCompleto].filter(Boolean).join(' '));
    candidatos.add([primeiroNome, p, sobrenomes].filter(Boolean).join(' '));
  });

  // 7. Acentos por ÚLTIMO (substituição de acento, nunca anel °)
  const varAcento: [RegExp, string][] = [
    [/a/gi, 'á'], [/a/gi, 'â'], [/a/gi, 'ã'],
    [/e/gi, 'é'], [/e/gi, 'ê'],
    [/i/gi, 'í'],
    [/o/gi, 'ó'], [/o/gi, 'ô'], [/o/gi, 'õ'],
    [/u/gi, 'ú'],
    [/c/gi, 'ç'],
  ];

  for (const [pat, rep] of varAcento) {
    const novo = primeiroNome.replace(pat, rep);
    if (novo !== primeiroNome) {
      candidatos.add([novo, sobrenomes].filter(Boolean).join(' '));
    }
  }

  // Remover o nome original da lista e qualquer nome com anel °
  candidatos.delete(nomeCompleto);

  return Array.from(candidatos).filter(c => {
    const limpo = c.trim();
    if (limpo.length < 3) return false;
    // NUNCA usar anel ° em nome social
    if (limpo.normalize('NFD').includes('\u030A')) return false;
    return true;
  });
}

// ================================================================
// HARMONIZAÇÃO COMPLETA
// ================================================================

/**
 * Executa o procedimento completo de harmonização do nome.
 * Retorna a análise do nome original + sugestões harmonizadas, ranqueadas.
 */
export function harmonizarNome(
  nomeCompleto: string,
  dataNascimento: string,
  quantidadeSugestoes = 5,
  opcoes?: OpcoesHarmonizacao
): ResultadoHarmonizacao {
  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimento);
  const bloqueiosOriginais = detectarBloqueios(todos);
  const sequenciasOriginais = todasSequenciasNegativas(todos);
  const expressaoOriginal = calcularExpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);
  const motivacaoOriginal = calcularMotivacao(nomeCompleto);

  const candidatos = gerarCandidatosHarmonizacao(nomeCompleto, opcoes);

  // DEV-260: Só sugerir Expressão 11/22 para Destino 1–9 se 11 ou 22 já aparecer em outro número da pessoa
  const temMaster = pessoaTemMaster11ou22({
    destino,
    motivacao: opcoes?.motivacao ?? motivacaoOriginal,
    missao: opcoes?.missao,
    diaNascimento: opcoes?.diaNascimento,
    dataNascimento,
  });

  const avaliados = candidatos.map(c => avaliarNomeHarmonizacaoLegado(c, dataNascimento));

  // Filtra 11/22 se destino 1-9 e pessoa não tem master
  const validos = avaliados.filter(a => {
    if (destino >= 1 && destino <= 9 && (a.expressao === 11 || a.expressao === 22)) {
      return temMaster;
    }
    return true;
  });

  // Priorizar sem bloqueios e favoráveis/neutros
  const semBloqueio = validos
    .filter(a => !a.temBloqueio)
    .sort((a, b) => b.score - a.score);

  const sugestoes = semBloqueio.slice(0, Math.max(quantidadeSugestoes, 2));

  // Fallback: se tiver menos de 2 opções, pegar de validos com menor bloqueio
  if (sugestoes.length < 2) {
    const restantes = validos
      .filter(a => !sugestoes.some(s => s.nome === a.nome))
      .sort((a, b) => b.score - a.score);
    for (const r of restantes) {
      if (sugestoes.length >= 2) break;
      sugestoes.push(r);
    }
  }

  return {
    nomeOriginal: nomeCompleto,
    expressaoOriginal,
    destino,
    bloqueiosOriginais,
    sequenciasOriginais,
    sugestoes,
    criteriosAssinatura: CRITERIOS_ASSINATURA,
  };
}
