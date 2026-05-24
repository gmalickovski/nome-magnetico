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
import { calcularScore, calcularScoreTeto } from './score';
import type { Bloqueio } from './triangle';

export interface AvaliacaoNome {
  nome: string;
  expressao: number;
  temBloqueio: boolean;
  bloqueios: Bloqueio[];
  sequenciasNegativas: string[];
  compatibilidadeDestino: 'favoravel' | 'neutro' | 'desfavoravel';
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

export const TABELA_HARMONIZACAO: Record<
  number,
  { favoravel: number[]; desfavoravel: number[]; neutro: number[] }
> = {
  1: { favoravel: [3, 5, 9], desfavoravel: [6], neutro: [1, 2, 4, 7, 8, 11, 22] },
  2: { favoravel: [2, 4, 6, 7], desfavoravel: [5, 9], neutro: [1, 3, 8, 11, 22] },
  3: { favoravel: [1, 3, 5, 6], desfavoravel: [4, 7, 8], neutro: [2, 9, 11, 22] },
  4: { favoravel: [2, 6, 8], desfavoravel: [3, 5, 7, 9], neutro: [1, 4, 11, 22] },
  5: { favoravel: [1, 3, 5, 7, 9], desfavoravel: [2, 4, 6, 8], neutro: [11, 22] },
  6: { favoravel: [2, 3, 4, 8, 9], desfavoravel: [1, 5, 7], neutro: [6, 11, 22] },
  7: { favoravel: [2, 5, 7], desfavoravel: [3, 4, 6, 8, 9], neutro: [1, 11, 22] },
  8: { favoravel: [4, 6], desfavoravel: [3, 5, 7, 8, 9], neutro: [1, 2, 11, 22] },
  9: { favoravel: [1, 5, 6, 9], desfavoravel: [2, 4, 7, 8], neutro: [3, 11, 22] },
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

  // 1. Tentar com valor direto (preservando master)
  const direto = verificar(expR);
  if (direto !== null) return direto;

  // 2. Se for 11 ou 22, tentar com seu valor reduzido (11 -> 2, 22 -> 4)
  if (expR === 11 || expR === 22) {
    const reduzidoVal = expR === 11 ? 2 : 4;
    const reduzido = verificar(reduzidoVal);
    if (reduzido !== null) return reduzido;
  }

  return 'neutro'; // Fallback padrão
}

// ================================================================
// SCORE DE UM NOME
// ================================================================

/**
 * Calcula o score de uma variação de nome (0–100).
 */
export function avaliarNome(
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

  return {
    nome: nomeCompleto,
    expressao,
    temBloqueio: bloqueios.length > 0,
    bloqueios,
    sequenciasNegativas: sequencias,
    compatibilidadeDestino: compatibilidade,
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
function gerarCandidatos(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiroNome = partes[0]!;
  const sobrenomes = partes.slice(1).join(' ');
  const candidatos = new Set<string>();

  // 1. Variações por acento (modifica valor)
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

  // 2. Adição de letra no final
  const finais = ['a', 'e', 'i', 'o', 'u', 'na', 'ia', 'ela', 'ara', 'ão'];
  for (const f of finais) {
    const base = primeiroNome.replace(/[aeiou]$/i, '');
    if (base.length >= 2) {
      const novo = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + f;
      candidatos.add([novo, sobrenomes].filter(Boolean).join(' '));
    }
  }

  // 3. Usar nome do meio como primeiro
  if (partes.length >= 3) {
    const nomeMeio = partes[1]!;
    const resto = partes.slice(2).join(' ');
    candidatos.add([nomeMeio, resto].filter(Boolean).join(' '));
    // Nome do meio + primeiro nome
    candidatos.add([nomeMeio, primeiroNome, resto].filter(Boolean).join(' '));
  }

  // 4. Adicionar "Maria" ou "Ana" ou "João" como complemento
  const prefixosFemininos = ['Maria', 'Ana', 'Luíza', 'Clara'];
  const prefixosMasculinos = ['João', 'José', 'Carlos', 'Pedro'];
  [...prefixosFemininos, ...prefixosMasculinos].forEach(p => {
    candidatos.add([p, nomeCompleto].filter(Boolean).join(' '));
    candidatos.add([primeiroNome, p, sobrenomes].filter(Boolean).join(' '));
  });

  // 5. Remoção de letra duplicada / simplificação
  const simplificado = primeiroNome
    .replace(/(.)\1+/g, '$1') // remove letras duplicadas consecutivas
    .replace(/ph/gi, 'f')
    .replace(/th/gi, 't')
    .replace(/ck/gi, 'c');
  if (simplificado !== primeiroNome) {
    const capitalizado = simplificado.charAt(0).toUpperCase() + simplificado.slice(1).toLowerCase();
    candidatos.add([capitalizado, sobrenomes].filter(Boolean).join(' '));
  }

  // Remover o nome original da lista
  candidatos.delete(nomeCompleto);

  return Array.from(candidatos).filter(c => c.trim().length >= 3);
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
  quantidadeSugestoes = 5
): ResultadoHarmonizacao {
  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimento);
  const bloqueiosOriginais = detectarBloqueios(todos);
  const sequenciasOriginais = todasSequenciasNegativas(todos);
  const expressaoOriginal = calcularExpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);

  const candidatos = gerarCandidatos(nomeCompleto);

  const sugestoes = candidatos
    .map(c => avaliarNome(c, dataNascimento))
    .filter(a => !a.temBloqueio) // priorizar sem bloqueios
    .sort((a, b) => b.score - a.score)
    .slice(0, quantidadeSugestoes);

  // Se não houver sugestões sem bloqueio, incluir as melhores com menos bloqueios
  if (sugestoes.length < quantidadeSugestoes) {
    const comBloqueio = candidatos
      .map(c => avaliarNome(c, dataNascimento))
      .filter(a => a.temBloqueio)
      .sort((a, b) => b.score - a.score)
      .slice(0, quantidadeSugestoes - sugestoes.length);
    sugestoes.push(...comBloqueio);
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
