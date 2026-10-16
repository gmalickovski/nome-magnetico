/**
 * Geração e scoring de variações do nome sem bloqueios.
 */

import { calcularTrianguloDaVida } from './triangle';
import { calcularExpressao, calcularMotivacao, calcularImpressao } from './numbers';
import { reduzirNumero } from './core';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from './karmic';
import { calcularScore, calcularScoreTeto } from './score'; // legado v1 — aposentar na F2+
import { avaliarCompatibilidade } from './harmonization';

export interface VariacaoNome {
  nome: string;
  numerosExpressao: number;
  motivacao: number;
  impressao: number;
  temBloqueio: boolean;
  score: number;
  /** Score máximo atingível para esta pessoa (100 - débitos fixos × 12). */
  scoreTeto: number;
  justificativa: string;
}

// Substituições de letras comuns para variações
const SUBSTITUICOES: Record<string, string[]> = {
  A: ['Á', 'Â', 'Ã'],
  E: ['É', 'Ê'],
  I: ['Í'],
  O: ['Ó', 'Ô', 'Õ'],
  U: ['Ú', 'Ü'],
  C: ['Ç'],
  Y: ['I', 'J'],
  K: ['C', 'Q'],
  W: ['V', 'U'],
  PH: ['F'],
  TH: ['T'],
  CH: ['X'],
};

// Sufixos comuns em nomes brasileiros baseados no gênero
const SUFIXOS_MASCULINOS = ['o', 'us', 'os'];
const SUFIXOS_FEMININOS = ['a', 'e', 'i', 'is', 'as', 'es'];

// Prefixos base
const PREFIXOS_MASCULINOS = ['João', 'José', 'Pedro', 'Luiz', 'Carlos'];
const PREFIXOS_FEMININOS = ['Ana', 'Maria', 'Laura', 'Clara', 'Rosa'];

/**
 * Gera variações de um nome completo.
 * Modifica o primeiro nome mantendo o(s) sobrenome(s).
 */
export function gerarVariacoes(nomeCompleto: string, quantidade = 5, gender: string = 'Neutro'): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeiroNome = partes[0]!;
  const sobrenomes = partes.slice(1).join(' ');

  const variacoes = new Set<string>();

  // Variação 1: adicionar/remover letra final
  if (primeiroNome.endsWith('a') || primeiroNome.endsWith('A')) {
    variacoes.add(`${primeiroNome.slice(0, -1)}e ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome.slice(0, -1)}i ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome}na ${sobrenomes}`.trim());
  }
  if (primeiroNome.endsWith('o') || primeiroNome.endsWith('O')) {
    variacoes.add(`${primeiroNome.slice(0, -1)}a ${sobrenomes}`.trim());
    variacoes.add(`${primeiroNome.slice(0, -1)}e ${sobrenomes}`.trim());
  }

  // Variação 2: adicionar prefixo baseado no gênero
  let prefixosAUsar: string[] = [];
  if (gender === 'Masculino') {
    prefixosAUsar = PREFIXOS_MASCULINOS;
  } else if (gender === 'Feminino') {
    prefixosAUsar = PREFIXOS_FEMININOS;
  } else {
    prefixosAUsar = [...PREFIXOS_MASCULINOS, ...PREFIXOS_FEMININOS];
  }

  for (const prefixo of prefixosAUsar.slice(0, 3)) {
    variacoes.add(`${prefixo} ${primeiroNome} ${sobrenomes}`.trim());
  }

  // Variação 3: substituições de letras (acentos)
  for (const [orig, subs] of Object.entries(SUBSTITUICOES)) {
    if (primeiroNome.toUpperCase().includes(orig)) {
      for (const sub of subs.slice(0, 2)) {
        const novo = primeiroNome.replace(new RegExp(orig, 'gi'), sub);
        if (novo !== primeiroNome) {
          variacoes.add(`${novo} ${sobrenomes}`.trim());
        }
      }
    }
  }

  // Variação 4: diminutivos/hipocorísticos comuns baseados no Gênero
  const nomeBase = primeiroNome.replace(/[aeiou]$/i, '');
  let sufixosAUsar: string[] = [];
  if (gender === 'Masculino') {
    sufixosAUsar = SUFIXOS_MASCULINOS;
  } else if (gender === 'Feminino') {
    sufixosAUsar = SUFIXOS_FEMININOS;
  } else {
    sufixosAUsar = [...SUFIXOS_MASCULINOS, ...SUFIXOS_FEMININOS];
  }

  for (const sufixo of sufixosAUsar.slice(0, 3)) {
    const novo = nomeBase + sufixo;
    if (novo.length >= 3 && novo !== primeiroNome.toLowerCase()) {
      const nomeCapitalizado = novo.charAt(0).toUpperCase() + novo.slice(1);
      variacoes.add(`${nomeCapitalizado} ${sobrenomes}`.trim());
    }
  }

  // Filtrar o nome original e limitar
  const resultado = Array.from(variacoes)
    .filter(v => v.toLowerCase() !== nomeCompleto.toLowerCase())
    .slice(0, quantidade * 3); // pegar mais para filtrar depois

  return resultado;
}

/**
 * Calcula o score de uma variação do nome.
 * Score 0-100 baseado em: sem bloqueios, boa expressão, harmonia numérica,
 * lições kármics, tendências ocultas e débitos kármicos.
 */
export function scoreVariacao(
  nomeSugerido: string,
  numeroExpressaoAlvo: number,
  numeroDestinoAlvo: number,
  dataNascimento: string = ''
): VariacaoNome {
  const triangulo = calcularTrianguloDaVida(nomeSugerido);
  const expressao = calcularExpressao(nomeSugerido);
  const motivacao = calcularMotivacao(nomeSugerido);
  const impressao = calcularImpressao(nomeSugerido);
  const temBloqueio = (triangulo.sequenciasNegativas ?? []).length > 0;

  const licoes = detectarLicoesCarmicas(nomeSugerido);
  const tendencias = detectarTendenciasOcultas(nomeSugerido);
  const debitos = dataNascimento
    ? calcularDebitosCarmicos(dataNascimento, numeroDestinoAlvo, motivacao, expressao)
    : [];
  const compatibilidade = avaliarCompatibilidade(expressao, numeroDestinoAlvo);

  const debitosFixosCount = debitos.filter(d => d.fixo).length;
  const score = calcularScore({
    bloqueios: (triangulo.sequenciasNegativas ?? []).length,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitosFixosCount,
    compatibilidade,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  const justificativas: string[] = [];
  if (temBloqueio) {
    justificativas.push(`Contém ${(triangulo.sequenciasNegativas ?? []).length} bloqueio(s)`);
  } else {
    justificativas.push('Sem bloqueios energéticos');
  }
  if (licoes.length > 0) justificativas.push(`${licoes.length} lição(ões) kármica(s)`);
  if (tendencias.length > 0) justificativas.push(`${tendencias.length} tendência(s) oculta(s)`);
  if (debitos.length > 0) justificativas.push(`${debitos.length} débito(s) kármico(s)`);
  justificativas.push(`Compatibilidade: ${compatibilidade}`);

  return {
    nome: nomeSugerido,
    numerosExpressao: expressao,
    motivacao,
    impressao,
    temBloqueio,
    score,
    scoreTeto,
    justificativa: justificativas.join(' | '),
  };
}

/**
 * Gera e rankeia variações sem bloqueios.
 *
 * @param minScore Score mínimo desejado para as sugestões (padrão: 0).
 *   Se não houver candidatos suficientes com score >= minScore, usa fallback
 *   para as melhores disponíveis sem bloqueio.
 */
export function gerarNomesMagneticos(
  nomeCompleto: string,
  numeroExpressao: number,
  numeroDestino: number,
  gender: string,
  dataNascimento: string = '',
  quantidade = 5,
  minScore = 0
): VariacaoNome[] {
  // Pool ampliado para ter mais candidatos a filtrar
  const poolSize = Math.max(quantidade * 6, 20);
  const variacoes = gerarVariacoes(nomeCompleto, poolSize, gender);
  const scoredAll = variacoes.map(v => scoreVariacao(v, numeroExpressao, numeroDestino, dataNascimento));

  // Preferência 1: sem bloqueio + score >= minScore (alvo: excelente alto)
  const primarios = scoredAll
    .filter(v => !v.temBloqueio && v.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (primarios.length >= quantidade) {
    return primarios.slice(0, quantidade);
  }

  // Fallback 1: sem bloqueio + score >= 70 (mínimo "Excelente" no ScoreDisplay)
  const SCORE_EXCELENTE = 70;
  const excelentes = scoredAll
    .filter(v => !v.temBloqueio && v.score >= SCORE_EXCELENTE)
    .sort((a, b) => b.score - a.score);

  if (excelentes.length >= quantidade) {
    return excelentes.slice(0, quantidade);
  }

  // Fallback 2: sem bloqueio (qualquer score) — NUNCA retornar nomes com bloqueio
  const semBloqueio = scoredAll.filter(v => !v.temBloqueio).sort((a, b) => b.score - a.score);
  return semBloqueio.slice(0, quantidade);
}
