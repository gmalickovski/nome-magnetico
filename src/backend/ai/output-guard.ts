/**
 * DEV-304 — Guarda da saída da IA.
 *
 * A LLM só redige texto a partir de números e nomes que o motor numerológico já calculou e
 * validou. Este módulo garante duas coisas, sem rede e sem banco:
 *
 * 1. Nenhum nome que a IA "sugerir" chega ao usuário se não estiver na lista que o motor
 *    ofereceu (zero bloqueio, nota mínima da DEV-301).
 * 2. Vocabulário proibido (radiestesia, "incompatível", prazo de entrega, preço) não passa:
 *    a tentativa é refeita e, na última, as frases problemáticas são removidas.
 */

import { motivoNaoOfertavel } from '../numerology/suggestion-birth-invariant';

// ── Vocabulário proibido ─────────────────────────────────────────────────────

export interface RegraCopyProibida {
  id: 'radiestesia' | 'incompativel' | 'prazo_entrega' | 'preco';
  regex: RegExp;
}

export const COPY_PROIBIDA: readonly RegraCopyProibida[] = [
  // Projeto usa só critérios formais objetivos (CLAUDE.md, regra 11).
  { id: 'radiestesia', regex: /radiest[eé]s|p[eê]ndulo|radi[oô]nic/i },
  // Copy ao cliente usa "Tensão Vibracional".
  { id: 'incompativel', regex: /incompat[ií]ve(?:l|is)/i },
  // O produto é self-service e o acesso é imediato: sem "entrega em 24h" nem revisão individual.
  {
    id: 'prazo_entrega',
    regex:
      /entreg(?:a|amos|aremos|ue|ues)\b[^.!?\n]{0,40}\b(?:em|no prazo de|dentro de)\s+(?:at[eé]\s+)?\d+\s*(?:h\b|horas?|dias?)|revis[aã]o individual da (?:sua )?an[aá]lise/i,
  },
  // O prompt interno menciona o valor do relatório; ele nunca deve aparecer no texto.
  { id: 'preco', regex: /R\$\s?\d/ },
];

export function encontrarCopyProibida(texto: string): RegraCopyProibida['id'][] {
  const achadas: RegraCopyProibida['id'][] = [];
  for (const regra of COPY_PROIBIDA) {
    if (regra.regex.test(texto)) achadas.push(regra.id);
  }
  return achadas;
}

/** Remove só as frases com vocabulário proibido; o resto do parágrafo e os títulos ficam. */
export function removerFrasesProibidas(texto: string): string {
  const proibida = (trecho: string) => COPY_PROIBIDA.some((r) => r.regex.test(trecho));
  return texto
    .split('\n')
    .map((linha) => {
      if (!proibida(linha)) return linha;
      if (/^\s*#{1,6}\s/.test(linha)) return linha;
      const frases = linha.split(/(?<=[.!?])\s+/);
      return frases.filter((f) => !proibida(f)).join(' ');
    })
    .join('\n');
}

// ── Nomes que a IA menciona ──────────────────────────────────────────────────

/** Normaliza para comparar: espaços e marcação de negrito; mantém acento (muda o cálculo). */
function limparNome(bruto: string): string {
  return bruto
    .replace(/[*_`[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Nomes apresentados nos títulos "### ✨ Nome: <nome completo>" (formato do prompt de sugestões).
 */
export function extrairNomesSugeridos(texto: string): string[] {
  const nomes: string[] = [];
  const re = /^\s*#{1,6}\s*(?:[^\p{L}\p{N}\s]+\s*)*Nome\s*:\s*(.+?)\s*$/gimu;
  for (const m of texto.matchAll(re)) {
    const limpo = m[1]!.replace(/[*_`[\]]/g, '').replace(/\s+/g, ' ').trim();
    if (limpo) nomes.push(limpo);
  }
  return nomes;
}

export interface ResultadoValidacaoNomes {
  ok: boolean;
  /** Nomes que a IA apresentou e que não estavam na lista oferecida pelo motor. */
  invalidos: string[];
  /** Quantidade de nomes apresentados. */
  apresentados: number;
}

export function validarNomesSugeridos(texto: string, permitidos: readonly string[]): ResultadoValidacaoNomes {
  const lista = new Set(permitidos.map(limparNome));
  const apresentados = extrairNomesSugeridos(texto);
  const invalidos = apresentados.filter((n) => !lista.has(limparNome(n)));
  return { ok: invalidos.length === 0, invalidos, apresentados: apresentados.length };
}

// ── Candidatas que podem ir para a IA ────────────────────────────────────────

export interface CandidataParaIA {
  nome: string;
  score: number;
  temBloqueio: boolean;
}

/**
 * Só chegam à IA candidatas que o motor poderia oferecer (zero bloqueio e nota mínima).
 * Assim a IA nem vê um nome inválido para "escolher".
 */
export function filtrarCandidatasOfertaveis<T extends CandidataParaIA>(
  candidatas: readonly T[],
  scoreNascimento: number,
): T[] {
  return candidatas.filter((c) => motivoNaoOfertavel(c, scoreNascimento) === null);
}
