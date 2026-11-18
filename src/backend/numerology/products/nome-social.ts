/**
 * Lógica específica do produto Nome Social (Motor NM v3 · DEV-186 + DEV-235).
 *
 * Fluxo de geração em 3 etapas:
 * 1. Etapa 1 (Encurtar sem acento):
 *    - Nivel 10: estrutural — remove 1 sobrenome, sem modificação (se >= 2 sobrenomes)
 *    - Nivel 20: estrutural — mantém primeiro nome + 1 sobrenome
 *    - Nivel 25: estrutural — apenas o primeiro nome
 *
 * 2. Etapa 2 (Acento sutil):
 *    - 2a (forma curta com 1 acento):
 *      - Nivel 50: (n-1) sobrenomes + 1 acento
 *      - Nivel 60: primeiro nome + 1 sobrenome + 1 acento
 *      - Nivel 65: primeiro nome + 1 acento
 *    - 2b (nome completo com 1 acento):
 *      - Nivel 70: nome completo + 1 acento
 *    - 2c (nome completo com 2 acentos):
 *      - Nivel 80: nome completo + 2 acentos (palavras diferentes)
 *
 * 3. Etapa 3 (Último recurso):
 *    - Letra dobrada:
 *      - Nivel 90: primeiro nome + 1 sobrenome + 1 duplicação
 *      - Nivel 95: (n-1) sobrenomes + 1 duplicação
 *      - Nivel 100: nome completo + 1 duplicação
 *      - Nivel 105: primeiro nome + 1 duplicação
 *    - Corte no meio:
 *      - Nivel 110: corte no meio ("Guilher", "Guilher Correa", etc.)
 *    - Diminutivo/apelido:
 *      - Nivel 120: diminutivo tradicional (cortar na 2ª vogal) + sobrenomes
 *
 * Ranking (Motor v3):
 * - Filtro: sem sequência repetida no Triângulo da Vida
 * - Corte em N5 (score v3 >= 85)
 * - Desempate por score v3 DESC, compatibilidade Expressão x Destino e normas ortográficas do português
 * - Top 3 diverso: mudança mínima, encurtado e alternativa, cada um com campo `explicacao`
 */

import { NOME_SOCIAL_SUGESTOES_INICIAIS } from '../../../shared/nome-social/gerar-mais-limits';
import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularMissao, calcularImpressao } from '../numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../karmic';
import { avaliarCompatibilidade } from '../harmonization';
import { avaliarNome, calcularScoreTeto, calcularScoreV1ComOcorrenciasExtras } from '../score';
import { isScoreV3 } from '../score-version';
import type { LicaoCarmica, TendenciaOculta, DebitoCarmicoInfo } from '../karmic';
import type { Bloqueio } from '../triangle';
import { SUGESTAO_CONFIG_V4 } from '../score-config';
import {
  explicarAderenciaPerfil,
  pontuarAderenciaPerfil,
  temAfinidades,
  type AfinidadesPerfil,
} from '../profile-affinity';
import {
  dedupeCandidatosEstavel,
  filtrarOfertaveis,
  getGanhoMinimoPontos,
  isMotorV4,
  motivoNaoOfertavel,
  ordenarPorNotaDescEstavel,
  scoreMinimoSugestao,
} from '../suggestion-birth-invariant';

// ── Tabelas de acentos ────────────────────────────────────────────────────────
const ACENTOS_LOWER: Record<string, string[]> = {
  a: ['á', 'ã'], e: ['é', 'ê'], i: ['í'], o: ['ó', 'ô', 'õ'], u: ['ú'],
};
const ACENTOS_UPPER: Record<string, string[]> = {
  A: ['Á', 'Ã'], E: ['É', 'Ê'], I: ['Í'], O: ['Ó', 'Ô', 'Õ'], U: ['Ú'],
};
const LETRAS_DUPLICAVEIS = 'bcdfghjklmnpqrstvwxyzaeiou';
const VOGAIS_DIM = 'aeiouáàãâéêíóôõú';
const PARTICULAS_SOBRENOME = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);

// ── Utilitários de normalização e sobrenomes (DEV-235) ────────────────────────

/** Normaliza token removendo acentos/diacríticos para comparação insensível a acento sutil. */
export function normalizarToken(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extrai os sobrenomes principais do nome completo, ignorando o primeiro nome
 * e partículas isoladas (de, da, do, dos, das, e).
 */
export function extrairSobrenomes(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return [];
  const resultado: string[] = [];
  for (let i = 1; i < partes.length; i++) {
    const token = partes[i]!;
    const norm = normalizarToken(token);
    if (!norm || PARTICULAS_SOBRENOME.has(norm)) continue;
    const formatado = token.charAt(0).toUpperCase() + token.slice(1);
    if (!resultado.some(r => normalizarToken(r) === norm)) {
      resultado.push(formatado);
    }
  }
  return resultado;
}

function contarAcentos(texto: string): number {
  return (texto.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || []).length;
}

function contarSobrenomesSignificativos(nome: string): number {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return 0;
  let count = 0;
  for (let i = 1; i < partes.length; i++) {
    if (!PARTICULAS_SOBRENOME.has(normalizarToken(partes[i]!))) {
      count++;
    }
  }
  return count;
}

function candidatoContemSobrenome(nomeCandidato: string, sobrenome: string): boolean {
  const alvo = normalizarToken(sobrenome);
  if (!alvo) return false;
  const partes = nomeCandidato.trim().split(/\s+/);
  return partes.slice(1).some(p => normalizarToken(p) === alvo);
}

// ── Helpers de variação ───────────────────────────────────────────────────────

/** Acentua vogais em TODAS as palavras, uma substituição por variação. */
function gerarVariacoesAcento(nome: string): string[] {
  const partes = nome.split(/\s+/);
  const out: string[] = [];
  for (let wi = 0; wi < partes.length; wi++) {
    const palavra = partes[wi]!;
    for (let ci = 0; ci < palavra.length; ci++) {
      const ch = palavra[ci]!;
      const isUpper = ch >= 'A' && ch <= 'Z';
      const acentos = isUpper ? ACENTOS_UPPER[ch] : ACENTOS_LOWER[ch];
      if (!acentos) continue;
      for (const acento of acentos) {
        const p = [...partes];
        p[wi] = palavra.slice(0, ci) + acento + palavra.slice(ci + 1);
        out.push(p.join(' '));
      }
    }
  }
  return out;
}

/** Acentua vogais APENAS na palavra de índice `wi`. */
function gerarVariacoesAcentoPalavra(nome: string, wi: number): string[] {
  const partes = nome.split(/\s+/);
  if (wi >= partes.length) return [];
  const palavra = partes[wi]!;
  const out: string[] = [];
  for (let ci = 0; ci < palavra.length; ci++) {
    const ch = palavra[ci]!;
    const isUpper = ch >= 'A' && ch <= 'Z';
    const acentos = isUpper ? ACENTOS_UPPER[ch] : ACENTOS_LOWER[ch];
    if (!acentos) continue;
    for (const acento of acentos) {
      const p = [...partes];
      p[wi] = palavra.slice(0, ci) + acento + palavra.slice(ci + 1);
      out.push(p.join(' '));
    }
  }
  return out;
}

/** Duplica vogais e consoantes, uma por palavra por variação. Nunca duplica a 1ª letra. */
function gerarVariacoesDuplicacao(nome: string): string[] {
  const partes = nome.split(/\s+/);
  const out: string[] = [];
  for (let wi = 0; wi < partes.length; wi++) {
    const palavra = partes[wi]!;
    for (let ci = 1; ci < palavra.length; ci++) {
      const ch = palavra[ci]!.toLowerCase();
      if (!LETRAS_DUPLICAVEIS.includes(ch)) continue;
      if (palavra[ci - 1]?.toLowerCase() === ch) continue;
      if (palavra[ci + 1]?.toLowerCase() === ch) continue;
      const p = [...partes];
      p[wi] = palavra.slice(0, ci + 1) + palavra[ci] + palavra.slice(ci + 1);
      out.push(p.join(' '));
    }
  }
  return out;
}

/**
 * Diminutivo/apelido: corta até a 2ª vogal.
 * "Guilherme" → "Gui", "Claudia" → "Clau", "Malickovski" → "Mali".
 * Retorna null se a palavra já é curta ou o corte não encurta pelo menos 2 chars.
 */
function gerarDiminutivo(palavra: string): string | null {
  if (palavra.length <= 4) return null;
  let count = 0;
  for (let i = 0; i < palavra.length; i++) {
    if (VOGAIS_DIM.includes(palavra[i]!.toLowerCase())) {
      count++;
      if (count === 2) {
        const dim = palavra.slice(0, i + 1);
        return dim.length >= 2 && dim.length <= palavra.length - 2 ? dim : null;
      }
    }
  }
  return null;
}

/**
 * Variações com diminutivo do primeiro nome + sobrenomes (completos ou diminutivos).
 * Exemplos: "Gui Malickovski Correa", "Gui Malickovski", "Gui Correa", "Gui Mali".
 */
function gerarVariacoesDiminutivo(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const prim = partes[0]!;
  const sobs = partes.slice(1);
  const out = new Set<string>();
  const dimPrim = gerarDiminutivo(prim);
  if (!dimPrim) return [];

  if (sobs.length > 0) out.add([dimPrim, ...sobs].join(' '));
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      out.add([dimPrim, ...sobs.filter((_, j) => j !== i)].join(' '));
    }
  }
  for (const sob of sobs) out.add(`${dimPrim} ${sob}`);
  for (const sob of sobs) {
    const dimSob = gerarDiminutivo(sob);
    if (dimSob) out.add(`${dimPrim} ${dimSob}`);
  }
  return Array.from(out);
}

/**
 * Corte no meio (DEV-186): variante para palavras com >= 6 caracteres.
 * "Guilherme" (9 letras) → "Guilher" (7 letras).
 */
export function gerarCorteNoMeio(palavra: string): string | null {
  if (palavra.length < 6) return null;
  const cortado = palavra.slice(0, palavra.length - 2);
  return cortado.length >= 4 ? cortado : null;
}

/**
 * Variações com corte no meio do primeiro nome + sobrenomes.
 * Exemplo: "Guilher", "Guilher Correa", "Guilher Malickovski", "Guilher Malickovski Correa".
 */
function gerarVariacoesCorteNoMeio(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/);
  const prim = partes[0]!;
  const sobs = partes.slice(1);
  const out = new Set<string>();
  const cortePrim = gerarCorteNoMeio(prim);
  if (!cortePrim) return [];

  out.add(cortePrim);
  for (const sob of sobs) {
    out.add(`${cortePrim} ${sob}`);
  }
  if (sobs.length >= 2) {
    out.add([cortePrim, ...sobs].join(' '));
  }
  return Array.from(out);
}

// ── Ortografia e naturalidade do português (DEV-186) ──────────────────────────

/**
 * Pontuação heurística de naturalidade de acentos no português.
 * - Prioriza acentos em posições naturais
 * - Penaliza palavras com múltiplos diacríticos (ex: "Jôão", "Máríá")
 * - Penaliza til fora de ã/õ ou no início (ex: "Ãna")
 */
export function pontuarOrtografiaPortugues(nome: string): number {
  let score = 100;
  const palavras = nome.split(/\s+/);

  for (const p of palavras) {
    const diacriticos = p.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || [];
    if (diacriticos.length > 1) {
      score -= 40 * (diacriticos.length - 1);
    }
    if (/[ẽĩũẼĨŨ]/i.test(p)) {
      score -= 50;
    }
    if (/^[Ãã][a-zA-Z]/.test(p)) {
      score -= 25;
    }
    if (/ô.*ã|ã.*ô/i.test(p)) {
      score -= 40;
    }
  }

  return score;
}

// ── Grafia plausível (DEV-301 · motor v4) ─────────────────────────────────────

export type ClasseGrafia = 'natural' | 'artificial' | 'proibida';

const REGEX_ACENTO_VOGAL = /[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g;
const REGEX_ACENTO_INICIAL = /^[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/;

/**
 * Classifica a grafia de uma variação em relação ao nome de nascimento.
 * - proibida: anel (°), mais de 1 acento novo por palavra, til na letra inicial,
 *   acento novo na vogal inicial de sobrenome. Nunca é oferecida.
 * - artificial: til novo fora de ã (final, ão, ãe) ou õ (õe). Só entra quando
 *   não há opções suficientes com grafia natural.
 * - natural: o resto.
 */
export function classificarGrafia(nome: string, nomeNascimento: string): ClasseGrafia {
  const originais = new Map<string, string>();
  for (const w of nomeNascimento.trim().split(/\s+/)) originais.set(normalizarToken(w), w);

  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  let artificial = false;

  for (let i = 0; i < palavras.length; i++) {
    const w = palavras[i]!;
    if (w.normalize('NFD').includes('̊')) return 'proibida';

    const ow = originais.get(normalizarToken(w)) ?? '';
    const novos = (w.match(REGEX_ACENTO_VOGAL) ?? []).length - (ow.match(REGEX_ACENTO_VOGAL) ?? []).length;
    if (novos > 1) return 'proibida';

    if (REGEX_ACENTO_INICIAL.test(w) && w.charAt(0) !== ow.charAt(0)) {
      if (/^[ãõÃÕ]/.test(w) || i >= 1) return 'proibida';
    }

    for (let k = 0; k < w.length; k++) {
      const ch = w[k]!;
      if (!/[ãõÃÕ]/.test(ch) || ow[k] === ch) continue;
      const prox = (w[k + 1] ?? '').toLowerCase();
      const ehA = ch === 'ã' || ch === 'Ã';
      const natural = ehA ? k === w.length - 1 || prox === 'o' || prox === 'e' : prox === 'e';
      if (!natural) artificial = true;
    }
  }

  return artificial ? 'artificial' : 'natural';
}

/** Identifica a etapa (1, 2 ou 3) a partir do nível de geração. */
export function etapaDoNivel(nivel: number): 1 | 2 | 3 {
  if (nivel <= 25) return 1;
  if (nivel <= 85) return 2;
  return 3;
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export type TipoOpcaoSugestao = 'mudanca_minima' | 'encurtado' | 'alternativa';

export type EstiloAssinaturaPreferido =
  | 'sobrenome_forte'    // Prioridade 1: Nome + 1 sobrenome forte sem acento extra
  | 'ajuste_sutil'       // Prioridade 2: Nome atual com 1 acento discreto
  | 'curto_direto'       // Prioridade 3: Assinatura curta ou primeiro nome
  | 'qualquer';          // Padrão aberto ao melhor cálculo

export type MotivoRefinamentoAssinatura =
  | 'forcar_sobrenome'
  | 'preferir_sem_acento'
  | 'preferir_nome_curto'
  | 'preferir_nome_completo'
  | 'testar_variacao_propria';

export interface AvisoSobrenomeExigido {
  sobrenome: string;
  precisouAcento: boolean;
  notaAlcancada: number;
}

export interface AnaliseNomeSocial {
  nomeCompleto: string;
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
  scoreTeto: number;
  justificativa: string[];
  origemSugerida: 'usuario' | 'ia';
  /** Nível de prioridade da fase de geração (apenas sugestões do sistema). */
  nivelGerado?: number;
  etapa?: 1 | 2 | 3;
  etapaGeracao?: 1 | 2 | 3;
  temAcentoAdicionado?: boolean;
  quantidadeSobrenomes?: number;
  tipoOpcao?: TipoOpcaoSugestao;
  explicacao?: string;
  semSequenciaVida?: boolean;
  /** DEV-301: sugestão de maior nota entre as oferecidas (selo "Maior nota"). */
  maiorNota?: boolean;
  /** DEV-304: til fora de ã final/ão/ãe/õe. Só entra quando faltam opções naturais e fica atrás delas. */
  grafiaArtificial?: boolean;
  /** DEV-301: false quando o nome do usuário não passa em R1/R2 (só comparação). */
  ofertavel?: boolean;
  motivoNaoOfertavel?: 'bloqueio' | 'abaixo_do_nascimento' | 'abaixo_do_piso';
  /** DEV-317: sem bloqueio e acima do nascimento, mas abaixo de 70 (entra só quando faltam opções >= 70). */
  pisoRelaxado?: boolean;
  /** DEV-317: atende às preferências da entrevista (nomes do próprio usuário contam como sim). */
  atendePerfil?: boolean;
  /** DEV-317: selo "Principal": maior nota entre as que atendem à entrevista. */
  principal?: boolean;
  /** DEV-302: aderência (0 a 1) dos números do nome ao perfil da entrevista. Não altera a nota. */
  aderenciaPerfil?: number;
  /** DEV-302: "por que este nome para você", só com afinidades realmente atendidas. */
  explicacaoPerfil?: string;
}

export interface ResultadoNomeSocial {
  nomeNascimento: string;
  dataNascimento: string;
  destino: number;
  nomesCandidatos: AnaliseNomeSocial[];
  melhorNome: AnaliseNomeSocial | null;
  top3: AnaliseNomeSocial[];
  avisoSobrenomeExigido?: AvisoSobrenomeExigido | null;
  /** Nota do nome de nascimento (mesmo motor, sem arredondamento extra). */
  scoreNascimento?: number;
  /** Nenhuma sugestão passou do ganho mínimo sobre o nascimento. */
  semOpcoesElegiveis?: boolean;
  ganhoMinimoPontos?: number;
  /** DEV-301: menor nota que uma sugestão podia ter nesta análise. */
  scoreMinimoSugestao?: number;
  /** DEV-301: nomes do usuário avaliados que não podem ser oferecidos (comparação). */
  comparacao?: AnaliseNomeSocial[];
  motorV4?: boolean;
}

// ── Análise de um nome ────────────────────────────────────────────────────────

/** Nota de referência do nascimento para invariante DEV-275. */
export function scoreNascimentoNomeSocial(
  nomeNascimento: string,
  dataNascimento: string,
): number {
  return analisarNomeSocial(nomeNascimento.trim(), dataNascimento, 'usuario').score;
}

export function analisarNomeSocial(
  nomeCandidato: string,
  dataNascimentoUsuario: string,
  origem: 'usuario' | 'ia' = 'usuario'
): AnaliseNomeSocial {
  const nomeCompleto = nomeCandidato.trim();
  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimentoUsuario);
  const bloqueios = detectarBloqueios(todos);
  const sequencias = todasSequenciasNegativas(todos);
  const expressao = calcularExpressao(nomeCompleto);
  const motivacao = calcularMotivacao(nomeCompleto);
  const missao = calcularMissao(nomeCompleto, dataNascimentoUsuario);
  const impressao = calcularImpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimentoUsuario);
  const licoes = detectarLicoesCarmicas(nomeCompleto);
  const tendencias = detectarTendenciasOcultas(nomeCompleto);
  const debitos = calcularDebitosCarmicos(dataNascimentoUsuario, destino, motivacao, expressao);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);
  const debitosFixosCount = debitos.filter(d => d.fixo).length;
  const scoreLegado = calcularScoreV1ComOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length,
    debitosCarmicos: debitos,
    compatibilidade,
  });
  const score = isScoreV3()
    ? avaliarNome(nomeCompleto, dataNascimentoUsuario).score_v3
    : scoreLegado;
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

  // No v3, verifica ausência de sequências especificamente no Triângulo da Vida
  const sequenciasVida = todos.vida.contagemSequencias ?? {};
  const semSequenciaVida = Object.keys(sequenciasVida).length === 0;
  const quantidadeSobrenomes = contarSobrenomesSignificativos(nomeCompleto);

  const justificativa: string[] = [];
  if (bloqueios.length === 0) {
    justificativa.push('Sem bloqueios em nenhum dos 4 triângulos');
  } else {
    justificativa.push(`${bloqueios.length} bloqueio(s): ${bloqueios.map(b => b.codigo).join(', ')}`);
  }
  switch (compatibilidade) {
    case 'favoravel':    justificativa.push(`Expressão (${expressao}) totalmente harmônica e favorável com o Destino (${destino})`); break;
    case 'neutro':       justificativa.push(`Expressão (${expressao}) neutra em relação ao Destino (${destino})`); break;
    case 'desfavoravel': justificativa.push(`Expressão (${expressao}) desfavorável e em tensão com o Destino (${destino})`); break;
  }
  if (licoes.length > 0) justificativa.push(`${licoes.length} lição(ões) kármica(s)`);
  if (debitos.length > 0) justificativa.push(`${debitos.length} débito(s): ${debitos.map(d => d.numero).join(', ')}`);

  return {
    nomeCompleto, expressao, motivacao, missao, impressao, destino,
    temBloqueio: bloqueios.length > 0, bloqueios, sequenciasNegativas: sequencias,
    licoesCarmicas: licoes, tendenciasOcultas: tendencias, debitosCarmicos: debitos,
    compatibilidade, score, scoreTeto, justificativa, origemSugerida: origem,
    semSequenciaVida,
    quantidadeSobrenomes,
  };
}

// ── Geração de sugestões do sistema (3 Etapas · DEV-186) ──────────────────────

/**
 * DEV-317 · Ordem de tentativas definida pelo Guilherme (18/11/2026), da mudança mais sutil à mais
 * severa. O número do nível É a ordem: quanto menor, mais perto do nome de nascimento.
 *
 *  V1 (10–14)  tirar sobrenome(s), mantendo o primeiro nome e pelo menos 1 sobrenome;
 *              sobrenome extra informado na entrevista entra aqui também
 *  V2 (28–35)  nome completo sem os acentos de nascimento (28), com 1 acento sutil (30) ou 2 (35)
 *  V3 (38–45)  formas da V1 sem acento (38), com 1 acento (40) ou 2 (45)
 *  V4 (50)     só o primeiro nome
 *  V5 (53–55)  primeiro nome sem acento (53) ou com 1 acento (55)
 *  D  (56–59)  apelido/diminutivo do primeiro nome nas mesmas estruturas, depois com acento
 *  V6 (60–62)  só os sobrenomes, sem o primeiro nome (2 ou mais)
 *  V7 (63–65)  V6 sem acento ou com acento
 *  V8 (70)     1 sobrenome sozinho (cada um)
 *  Quem usa o sobrenome profissionalmente (entrevista) vê V6–V8 antes do apelido (D vai para 76–79).
 *  X (130–157) último recurso, só com `incluirSevero`: dobrar 1 consoante que não muda o som
 *              (ll, nn, mm, tt, dd, ff, pp, bb) nas mesmas estruturas, depois com acento.
 *
 * Saíram (descaracterizam o nome): tirar letras ("Cáudia") e o corte no meio ("Guilher").
 */
export const NIVEL_SEVERO_MIN = 100;

/** Consoantes que, dobradas no meio da palavra, mantêm a pronúncia. */
const CONSOANTES_DUPLICACAO_SUTIL = 'lnmtdfpb';

function semAcentos(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/** Duplica 1 consoante que não muda o som. Nunca a 1ª nem a última letra, nunca ao lado de outra igual. */
function gerarDuplicacaoSutil(nome: string): string[] {
  const partes = nome.split(/\s+/);
  const out: string[] = [];
  for (let wi = 0; wi < partes.length; wi++) {
    const palavra = partes[wi]!;
    if (PARTICULAS_SOBRENOME.has(palavra.toLowerCase())) continue;
    for (let ci = 1; ci < palavra.length - 1; ci++) {
      const ch = palavra[ci]!.toLowerCase();
      if (!CONSOANTES_DUPLICACAO_SUTIL.includes(ch)) continue;
      if (palavra[ci - 1]?.toLowerCase() === ch || palavra[ci + 1]?.toLowerCase() === ch) continue;
      const p = [...partes];
      p[wi] = palavra.slice(0, ci + 1) + palavra[ci] + palavra.slice(ci + 1);
      out.push(p.join(' '));
    }
  }
  return out;
}

/** 1 acento sutil, ou 2 acentos em palavras diferentes. Partículas ("da", "de") não recebem acento. */
function comAcentos(base: string, quantos: 1 | 2): string[] {
  const partes = base.split(/\s+/);
  const indices = partes
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !PARTICULAS_SOBRENOME.has(p.toLowerCase()))
    .map(({ i }) => i);
  const out: string[] = [];
  if (quantos === 1) {
    for (const wi of indices) out.push(...gerarVariacoesAcentoPalavra(base, wi));
    return out;
  }
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      for (const v1 of gerarVariacoesAcentoPalavra(base, indices[a]!)) {
        for (const v2 of gerarVariacoesAcentoPalavra(v1, indices[b]!)) out.push(v2);
      }
    }
  }
  return out;
}

/** Agrupa partículas com o sobrenome seguinte: "da Silva" conta como 1 sobrenome. */
export function agruparSobrenomes(tokens: string[]): string[] {
  const out: string[] = [];
  let pendente = '';
  for (const t of tokens) {
    if (PARTICULAS_SOBRENOME.has(t.toLowerCase())) {
      pendente = pendente ? `${pendente} ${t}` : t;
      continue;
    }
    out.push(pendente ? `${pendente} ${t}` : t);
    pendente = '';
  }
  if (pendente && out.length > 0) out[out.length - 1] = `${out[out.length - 1]} ${pendente}`;
  return out;
}

/** Subconjuntos dos sobrenomes (mantendo a ordem), de `min` até `max` itens. Mais sobrenomes primeiro. */
function combinacoesSobrenomes(sobs: string[], min: number, max: number): string[][] {
  const out: string[][] = [];
  const n = Math.min(sobs.length, 8);
  for (let mask = 1; mask < 1 << n; mask++) {
    const sel = sobs.slice(0, n).filter((_, i) => mask & (1 << i));
    if (sel.length >= min && sel.length <= max) out.push(sel);
  }
  return out.sort((a, b) => b.length - a.length);
}

export interface OpcoesGeradorCandidatos {
  /** Último recurso: duplicação sutil de consoante. */
  incluirSevero?: boolean;
  /** Sobrenomes informados na entrevista que não estão no nome de nascimento. */
  sobrenomesExtras?: string[];
  /** Entrevista indica uso profissional do sobrenome: V6–V8 vêm antes do apelido. */
  sobrenomeAntesDoApelido?: boolean;
}

export function gerarCandidatosComNivel(
  nomeNascimento: string,
  opcoesOuSevero: boolean | OpcoesGeradorCandidatos = false,
): { nome: string; nivel: number }[] {
  const opts: OpcoesGeradorCandidatos =
    typeof opcoesOuSevero === 'boolean' ? { incluirSevero: opcoesOuSevero } : opcoesOuSevero;
  const tokens = nomeNascimento.trim().split(/\s+/).filter(Boolean);
  const prim = tokens[0]!;
  const sobs = agruparSobrenomes(tokens.slice(1));
  const nomeFull = tokens.join(' ');
  const origLow = nomeFull.toLowerCase();
  const sobsNorm = new Set(sobs.map((s) => normalizarToken(s)));
  const extras = (opts.sobrenomesExtras ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !sobsNorm.has(normalizarToken(s)));

  const todos: { nome: string; nivel: number }[] = [];
  function add(nome: string, nivel: number) {
    const limpo = nome.trim().replace(/\s+/g, ' ');
    if (limpo.length >= 2 && limpo.toLowerCase() !== origLow) todos.push({ nome: limpo, nivel });
  }
  function addAcentuadas(base: string, nivelSem: number, nivel1: number, nivel2: number) {
    if (semAcentos(base) !== base) add(semAcentos(base), nivelSem);
    for (const v of comAcentos(base, 1)) add(v, nivel1);
    for (const v of comAcentos(base, 2)) add(v, nivel2);
  }

  // Estruturas (sem mudar letras)
  const v1Bases: { nome: string; nivel: number }[] = [];
  for (const sel of combinacoesSobrenomes(sobs, 1, Math.max(1, sobs.length - 1))) {
    if (sel.length === sobs.length) continue;
    v1Bases.push({ nome: [prim, ...sel].join(' '), nivel: sel.length === sobs.length - 1 ? 10 : 12 });
  }
  for (const extra of extras) {
    v1Bases.push({ nome: [prim, ...sobs, extra].join(' '), nivel: 14 });
    v1Bases.push({ nome: `${prim} ${extra}`, nivel: 14 });
  }
  const v6Bases = sobs.length >= 2
    ? combinacoesSobrenomes(sobs, 2, sobs.length).map((sel) => ({
        nome: sel.join(' '),
        nivel: sel.length === sobs.length ? 60 : 62,
      }))
    : [];

  // V1
  for (const b of v1Bases) add(b.nome, b.nivel);
  // V2
  addAcentuadas(nomeFull, 28, 30, 35);
  // V3
  for (const b of v1Bases) addAcentuadas(b.nome, 38, 40, 45);
  // V4 e V5
  if (sobs.length > 0) {
    add(prim, 50);
    if (semAcentos(prim) !== prim) add(semAcentos(prim), 53);
    for (const v of comAcentos(prim, 1)) add(v, 55);
  }
  // D: apelido/diminutivo do primeiro nome
  const dOffset = opts.sobrenomeAntesDoApelido ? 20 : 0;
  const dim = gerarDiminutivo(prim);
  if (dim) {
    const comDim = (nome: string) => [dim, ...nome.split(/\s+/).slice(1)].join(' ');
    if (sobs.length > 0) add([dim, ...sobs].join(' '), 56 + dOffset);
    for (const b of v1Bases) add(comDim(b.nome), 57 + dOffset);
    add(dim, 58 + dOffset);
    if (sobs.length > 0) for (const v of comAcentos([dim, ...sobs].join(' '), 1)) add(v, 59 + dOffset);
    for (const b of v1Bases) for (const v of comAcentos(comDim(b.nome), 1)) add(v, 59 + dOffset);
    for (const v of comAcentos(dim, 1)) add(v, 59 + dOffset);
  }
  // V6 e V7
  for (const b of v6Bases) add(b.nome, b.nivel);
  for (const b of v6Bases) {
    if (semAcentos(b.nome) !== b.nome) add(semAcentos(b.nome), 63);
    for (const v of comAcentos(b.nome, 1)) add(v, 65);
  }
  // V8
  if (sobs.length >= 2) for (const sob of sobs) add(sob, 70);

  // X: duplicação sutil (último recurso)
  if (opts.incluirSevero) {
    for (const d of gerarDuplicacaoSutil(nomeFull)) add(d, 130);
    for (const b of v1Bases) for (const d of gerarDuplicacaoSutil(b.nome)) add(d, 132);
    for (const d of gerarDuplicacaoSutil(nomeFull)) for (const v of comAcentos(d, 1)) add(v, 135);
    for (const b of v1Bases) {
      for (const d of gerarDuplicacaoSutil(b.nome)) for (const v of comAcentos(d, 1)) add(v, 137);
    }
    for (const d of gerarDuplicacaoSutil(prim)) add(d, 140);
    for (const d of gerarDuplicacaoSutil(prim)) for (const v of comAcentos(d, 1)) add(v, 145);
    if (dim && sobs.length > 0) {
      for (const d of gerarDuplicacaoSutil([dim, ...sobs].join(' '))) add(d, 148);
    }
    for (const b of v6Bases) for (const d of gerarDuplicacaoSutil(b.nome)) add(d, 150);
    for (const b of v6Bases) {
      for (const d of gerarDuplicacaoSutil(b.nome)) for (const v of comAcentos(d, 1)) add(v, 155);
    }
  }

  // Deduplica mantendo o nível mais baixo (mais sutil)
  const dedup = new Map<string, { nome: string; nivel: number }>();
  for (const c of todos) {
    const key = c.nome.toLowerCase();
    const ex = dedup.get(key);
    if (!ex || c.nivel < ex.nivel) dedup.set(key, c);
  }
  return Array.from(dedup.values()).sort((a, b) => a.nivel - b.nivel);
}

/** Nomes candidatos do gerador atual (potencial v3 · DEV-185 e DEV-186). */
export function listarNomesCandidatosGerador(nomeNascimento: string): string[] {
  return gerarCandidatosComNivel(nomeNascimento).map(c => c.nome);
}

/**
 * Gera texto explicativo de "o que mudou e por quê" para a sugestão (§8.6).
 */
export function gerarExplicacaoSugestao(
  sugestao: string,
  nomeNascimento: string,
  _etapa: 1 | 2 | 3
): string {
  const origPartes = nomeNascimento.trim().split(/\s+/);
  const sugPartes = sugestao.trim().split(/\s+/);

  const acentosOrig = nomeNascimento.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || [];
  const acentosSug = sugestao.match(/[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/g) || [];
  const ortografia = pontuarOrtografiaPortugues(sugestao);

  let texto = '';
  if (acentosSug.length > acentosOrig.length) {
    let detalhe = '';
    for (let i = 0; i < sugPartes.length; i++) {
      const sp = sugPartes[i]!;
      const op = origPartes[i] ?? '';
      if (sp !== op) {
        for (let c = 0; c < sp.length; c++) {
          if (sp[c] !== op[c] && /[áàãâéêíóôõúÁÀÃÂÉÊÍÓÔÕÚ]/.test(sp[c]!)) {
            detalhe = `no ${sp[c]} de ${sp}`;
            break;
          }
        }
      }
      if (detalhe) break;
    }
    texto = detalhe
      ? `Acrescentamos um acento ${detalhe}. É a menor mudança que elimina sequências negativas e mantém a Expressão favorável ao seu Destino.`
      : `Adicionamos um acento sutil para neutralizar sequências na Vida e elevar a harmonia vibracional.`;
  } else if (sugPartes.length < origPartes.length) {
    texto = `Adotamos a forma encurtada "${sugestao}", eliminando sequências no Triângulo da Vida e alinhando sua Expressão com seu Destino.`;
  } else {
    texto = `Ajustamos a estrutura da assinatura para eliminar bloqueios e harmonizar sua Expressão com seu Destino.`;
  }

  if (ortografia < 80) {
    texto += ' Grafia propositalmente única: deixa sua assinatura mais pessoal e mais difícil de imitar.';
  } else {
    texto += ' A grafia vale para a assinatura e o uso diário; seus documentos não mudam.';
  }

  return texto;
}

export interface OpcoesRankingNomeSocial {
  /**
   * Quando false (padrão), não libera a Etapa 3 de encurtar/corte no meio/apelido (fases 110 e 120),
   * a menos que não haja candidatos suficientes nas etapas 1 e 2.
   * Quando true ("Topa encurtar ou usar apelido?"), libera a Etapa 3 normalmente e bonifica variações curtas.
   */
  aceitaEncurtarOuApelido?: boolean;
  /**
   * Contextos de uso selecionados em "Onde vai usar o novo nome?" (múltipla escolha).
   * Ex: ['redes_sociais', 'profissional', 'documentos', 'artistico']
   */
  ondeVaiUsar?: string[];
  /**
   * Linha de base ("Como você assina hoje?"), incluída na avaliação comparativa se informada.
   */
  assinaturaAtual?: string;
  /** Sobrenomes que o usuário fixou com 1 toque no mobile (devem estar presentes no candidato) */
  sobrenomesObrigatorios?: string[];
  /** Sobrenomes que o usuário marcou como "Pode sair" (não devem estar presentes no candidato) */
  sobrenomesExcluidos?: string[];
  /** Estilo preferido selecionado no formulário ou inferido pelo JEV */
  estiloPreferido?: EstiloAssinaturaPreferido;
  /** Lista de nomes já exibidos que devem ser filtrados ao pedir novas sugestões */
  nomesExcluidos?: string[];
  /** Motivo rápido clicado no drawer "Quero ver outras sugestões de assinatura" */
  motivoRefinamento?: MotivoRefinamentoAssinatura;
  /** Variação digitada manualmente pelo usuário no drawer do resultado */
  variacaoPropria?: string;
  /** Contratos/documentos: só variações legais (etapas 1–2, sem apelido) */
  restricaoDocumentosLegais?: boolean;
  /** Teto de nível de geração (ex.: 50 = só acento sutil) — filtro, não altera score */
  maxNivelGeracao?: number;
  /**
   * Export/chat: usa somente os nomes informados em `nomesCandidatos`, na ordem recebida,
   * sem gerar sugestões automáticas do motor (gerarSugestoesAutoSocial).
   */
  somenteCandidatosInformados?: boolean;
  /**
   * DEV-302: afinidades do perfil (como quer ser percebido, foco e subfoco). Só desempata
   * entre sugestões válidas (R1/R2); não muda nota nem cria candidatos.
   */
  afinidades?: AfinidadesPerfil;
  /**
   * DEV-303: preferências moles do questionário. Só valem dentro do conjunto válido (R1/R2) e
   * relaxam em cascata quando faltam sugestões; nunca relaxam zero bloqueio nem a nota mínima.
   */
  /** "Manter meu primeiro nome": o primeiro nome da sugestão fica igual ao do nascimento. */
  manterPrimeiroNome?: boolean;
  /** "Prefiro sem acento": prefere sugestões sem acento novo. */
  acentoNaAssinatura?: 'prefere_sem';
  /** "Se for preciso escolher": nota mais alta primeiro ou menor mudança primeiro. */
  prioridadeConflito?: 'nota' | 'mudanca';
}

/**
 * Função de ordenação do ranking v3 (DEV-186 + DEV-190 §6 + DEV-235).
 */
/**
 * Quanto a sugestão distorce o nome real (menor é melhor). A maioria das pessoas quer uma assinatura
 * que mude pouco, de preferência o primeiro nome mais UM dos sobrenomes; acento vem depois e o que
 * foge do nome real (apagar todos os sobrenomes, duplicar letra, cortar, apelido) fica por último.
 * Só serve de padrão quando a entrevista não define o estilo: a entrevista sempre manda.
 */
export function distorcaoDoNome(a: Pick<AnaliseNomeSocial, 'nivelGerado' | 'etapa' | 'grafiaArtificial'>): number {
  // DEV-317: o nível do gerador já é a ordem da mudança mais sutil à mais severa.
  const d = a.nivelGerado ?? 999;
  return a.grafiaArtificial ? d + 1000 : d;
}

function criarComparadorCandidatosV3(
  opcoes?: OpcoesRankingNomeSocial,
  contexto?: { scoreMaximo?: number; primeiroNomeOriginal?: string },
) {
  const obrigatorios = (opcoes?.sobrenomesObrigatorios ?? []).map(normalizarToken).filter(Boolean);
  const excluidos = (opcoes?.sobrenomesExcluidos ?? []).map(normalizarToken).filter(Boolean);
  const estilo = opcoes?.estiloPreferido;
  const motivo = opcoes?.motivoRefinamento;
  const afinidades =
    isMotorV4() && temAfinidades(opcoes?.afinidades) ? opcoes!.afinidades : undefined;
  const faixaDeNota = (score: number) => Math.floor(score / 5);
  const aderenciaEmCache = new WeakMap<AnaliseNomeSocial, number>();
  function aderenciaQuantizada(a: AnaliseNomeSocial): number {
    let valor = aderenciaEmCache.get(a);
    if (valor === undefined) {
      valor = Math.round(
        pontuarAderenciaPerfil(
          { expressao: a.expressao, motivacao: a.motivacao, impressao: a.impressao },
          afinidades,
        ) * 4,
      );
      aderenciaEmCache.set(a, valor);
    }
    return valor;
  }

  const prefereSemAcento =
    estilo === 'sobrenome_forte' || motivo === 'preferir_sem_acento';
  // DEV-303: "Prefiro sem acento" vale para qualquer sugestão sem acento novo (só no motor v4).
  const preferenciaSemAcento = isMotorV4() && opcoes?.acentoNaAssinatura === 'prefere_sem';
  // DEV-303: "a nota mais alta pesa mais" (só no motor v4).
  const prioridadeNota = isMotorV4() && opcoes?.prioridadeConflito === 'nota';
  const prefereCompletoComAcento =
    estilo === 'ajuste_sutil' || motivo === 'preferir_nome_completo';
  const prefereCurtoExplicito =
    estilo === 'curto_direto' || motivo === 'preferir_nome_curto';

  const prefereCurto = Boolean(
    prefereCurtoExplicito ||
      opcoes?.aceitaEncurtarOuApelido ||
      opcoes?.ondeVaiUsar?.some(u =>
        ['redes_sociais', 'artistico', 'assinatura_diaria', 'presenca_digital', 'marca_autoria'].includes(u)
      )
  );
  const prefereFormal = Boolean(
    !prefereCurto &&
      (estilo === 'sobrenome_forte' ||
        opcoes?.ondeVaiUsar?.some(u =>
          ['documentos', 'contratos', 'profissional', 'identidade_registro', 'rotina_trabalho'].includes(u)
        ))
  );

  // Estilo explícito vem da entrevista (ou do refinamento): nesse caso não se aplica o padrão.
  const estiloExplicito =
    prefereSemAcento || prefereCompletoComAcento || prefereCurtoExplicito || preferenciaSemAcento;
  const naturalidadePadrao =
    isMotorV4() &&
    contexto?.scoreMaximo !== undefined &&
    !prioridadeNota &&
    !estiloExplicito;
  const limiteNaturalidade = Math.max(
    SUGESTAO_CONFIG_V4.pisoAbsoluto,
    (contexto?.scoreMaximo ?? 0) - SUGESTAO_CONFIG_V4.janelaNaturalidade,
  );

  function contarObrigatoriosAtendidos(nome: string): number {
    if (obrigatorios.length === 0) return 0;
    let count = 0;
    for (const sob of obrigatorios) {
      if (candidatoContemSobrenome(nome, sob)) count++;
    }
    return count;
  }

  // DEV-304: preferências ESTRUTURAIS da entrevista (quantos/quais sobrenomes, manter o primeiro nome).
  // Quem atende todas vem primeiro, ordenado pela melhor nota; as demais vêm por menor distorção.
  const primeiroOriginal = normalizarToken(contexto?.primeiroNomeOriginal ?? '');
  const manterPrimeiro = Boolean(opcoes?.manterPrimeiroNome) && primeiroOriginal !== '';
  const temPrefEstrutural =
    isMotorV4() && (obrigatorios.length > 0 || excluidos.length > 0 || manterPrimeiro);
  function atendePrefEstrutural(a: AnaliseNomeSocial): boolean {
    if (temExcluido(a.nomeCompleto)) return false;
    if (obrigatorios.length > 0 && contarObrigatoriosAtendidos(a.nomeCompleto) < obrigatorios.length) return false;
    if (manterPrimeiro && normalizarToken(a.nomeCompleto.trim().split(/\s+/)[0] ?? '') !== primeiroOriginal) return false;
    return true;
  }

  function temExcluido(nome: string): boolean {
    if (excluidos.length === 0) return false;
    return excluidos.some(sob => candidatoContemSobrenome(nome, sob));
  }

  return function compararCandidatosV3(a: AnaliseNomeSocial, b: AnaliseNomeSocial): number {
    const vidaA = a.semSequenciaVida ? 1 : 0;
    const vidaB = b.semSequenciaVida ? 1 : 0;
    if (vidaA !== vidaB) return vidaB - vidaA;

    // Se houver sobrenomes excluídos que ficaram no fallback, vão para o fim
    if (excluidos.length > 0) {
      const excA = temExcluido(a.nomeCompleto) ? 1 : 0;
      const excB = temExcluido(b.nomeCompleto) ? 1 : 0;
      if (excA !== excB) return excA - excB;
    }

    // Se houver sobrenomes obrigatórios fixados pelo usuário, priorizar quem os contém
    if (obrigatorios.length > 0) {
      const obrA = contarObrigatoriosAtendidos(a.nomeCompleto);
      const obrB = contarObrigatoriosAtendidos(b.nomeCompleto);
      if (obrA !== obrB) return obrB - obrA;
    }

    // DEV-304: preferências estruturais primeiro. Quem atende vem antes; entre quem atende vale a
    // melhor nota (depois das outras preferências explícitas); entre quem não atende, a menor distorção.
    let atendeAmbas = false;
    if (temPrefEstrutural && !prioridadeNota) {
      const atA = atendePrefEstrutural(a);
      const atB = atendePrefEstrutural(b);
      if (atA !== atB) return atA ? -1 : 1;
      if (atA) atendeAmbas = true;
      else {
        const distA = distorcaoDoNome(a);
        const distB = distorcaoDoNome(b);
        if (distA !== distB) return distA - distB;
      }
    }

    // DEV-304: naturalidade padrão. Só vale quando a entrevista NÃO definiu o estilo (a entrevista manda):
    // entre as sugestões com nota perto da melhor, vence a que menos distorce o nome.
    if (naturalidadePadrao && !temPrefEstrutural) {
      const foraA = a.score >= limiteNaturalidade ? 0 : 1;
      const foraB = b.score >= limiteNaturalidade ? 0 : 1;
      if (foraA !== foraB) return foraA - foraB;
      if (foraA === 0) {
        const distA = distorcaoDoNome(a);
        const distB = distorcaoDoNome(b);
        if (distA !== distB) return distA - distB;
      }
    }

    const nivelA = a.nivelGerado ?? 999;
    const nivelB = b.nivelGerado ?? 999;
    const etapaA = a.etapa ?? etapaDoNivel(nivelA);
    const etapaB = b.etapa ?? etapaDoNivel(nivelB);

    const n5A = a.score >= 85 ? 1 : 0;
    const n5B = b.score >= 85 ? 1 : 0;

    // Preferências explícitas da entrevista (estilo, sem acento, refinamento) e grafia natural.
    // DEV-304: a entrevista manda, então valem ANTES da faixa de nota (N5). Todas as sugestões aqui
    // já passaram em R1/R2, e a de maior nota continua visível (R3a).
    if (!prioridadeNota) {
      // A grafia natural vem antes da artificial.
      if (Boolean(a.grafiaArtificial) !== Boolean(b.grafiaArtificial)) return a.grafiaArtificial ? 1 : -1;
      if (preferenciaSemAcento) {
        const acentoA = a.temAcentoAdicionado ? 1 : 0;
        const acentoB = b.temAcentoAdicionado ? 1 : 0;
        if (acentoA !== acentoB) return acentoA - acentoB;
      }
      if (prefereSemAcento) {
        const semAcentoForteA = !a.temAcentoAdicionado && (a.quantidadeSobrenomes ?? 0) >= 1 ? 1 : 0;
        const semAcentoForteB = !b.temAcentoAdicionado && (b.quantidadeSobrenomes ?? 0) >= 1 ? 1 : 0;
        if (semAcentoForteA !== semAcentoForteB) return semAcentoForteB - semAcentoForteA;
      } else if (prefereCompletoComAcento) {
        const sobsA = a.quantidadeSobrenomes ?? contarSobrenomesSignificativos(a.nomeCompleto);
        const sobsB = b.quantidadeSobrenomes ?? contarSobrenomesSignificativos(b.nomeCompleto);
        if (etapaA <= 2 && etapaB <= 2 && sobsA !== sobsB) {
          return sobsB - sobsA;
        }
      } else if (prefereCurtoExplicito) {
        const curtoA = (a.quantidadeSobrenomes ?? contarSobrenomesSignificativos(a.nomeCompleto)) <= 1 ? 1 : 0;
        const curtoB = (b.quantidadeSobrenomes ?? contarSobrenomesSignificativos(b.nomeCompleto)) <= 1 ? 1 : 0;
        if (curtoA !== curtoB) return curtoB - curtoA;
        const wordsA = a.nomeCompleto.trim().split(/\s+/).length;
        const wordsB = b.nomeCompleto.trim().split(/\s+/).length;
        if (wordsA !== wordsB) return wordsA - wordsB;
      }

      // DEV-302: perfil da entrevista (afinidade numérica) desempata só dentro da mesma faixa
      // de 5 pontos de nota (faixas alinhadas em 70, 85, 90...), então nunca derruba a nota
      // do Nome de Ouro em 5 pontos ou mais por afinidade.
      if (afinidades && faixaDeNota(a.score) === faixaDeNota(b.score)) {
        const afinA = aderenciaQuantizada(a);
        const afinB = aderenciaQuantizada(b);
        if (afinA !== afinB) return afinB - afinA;
      }
    }

    if (atendeAmbas && a.score !== b.score) return b.score - a.score;

    if (prioridadeNota) {
      // DEV-303: N5 primeiro, depois a nota; a etapa (menor mudança) só desempata.
      if (n5A !== n5B) return n5B - n5A;
      if (a.score !== b.score) return b.score - a.score;
      if (Boolean(a.grafiaArtificial) !== Boolean(b.grafiaArtificial)) return a.grafiaArtificial ? 1 : -1;
      if (etapaA !== etapaB) return etapaA - etapaB;
    } else if (n5A && n5B) {
      // Se ambos atingiram N5: a etapa menor vence (Etapa 1 vence Etapa 2, etc.)
      if (etapaA !== etapaB) return etapaA - etapaB;
      if (a.score !== b.score) return b.score - a.score;
    } else if (n5A !== n5B) {
      // Quem atingiu N5 vence quem não atingiu
      return n5B - n5A;
    } else {
      // Nenhum atingiu N5: etapa menor tem prioridade
      if (etapaA !== etapaB) return etapaA - etapaB;
      if (a.score !== b.score) return b.score - a.score;
    }

    // Compatibilidade
    const compRank: Record<string, number> = { favoravel: 3, neutro: 2, desfavoravel: 1 };
    const rA = compRank[a.compatibilidade] ?? 1;
    const rB = compRank[b.compatibilidade] ?? 1;
    if (rA !== rB) return rB - rA;

    // Desempate contextual por "Onde vai usar" / "Topa encurtar"
    const wordsA = a.nomeCompleto.trim().split(/\s+/).length;
    const wordsB = b.nomeCompleto.trim().split(/\s+/).length;
    if (prefereCurto && wordsA !== wordsB) {
      return wordsA - wordsB; // Mais enxuto vence para redes/artístico/apelido
    }
    if (prefereFormal && wordsA !== wordsB) {
      return wordsB - wordsA; // Nome mais estruturado vence para contratos/documentos
    }

    // Naturalidade ortográfica do português
    const ortA = pontuarOrtografiaPortugues(a.nomeCompleto);
    const ortB = pontuarOrtografiaPortugues(b.nomeCompleto);
    if (ortA !== ortB) return ortB - ortA;

    return nivelA - nivelB;
  };
}

/**
 * Gera sugestões do sistema priorizando a nova ordem em 3 etapas e corte N5 (>= 85).
 */
function gerarSugestoesAutoSocial(
  nomeNascimento: string,
  dataNascimento: string,
  maxSugestoes = 5,
  opcoes?: OpcoesRankingNomeSocial
): AnaliseNomeSocial[] {
  const todosCandidatos = gerarCandidatosComNivel(nomeNascimento);
  const liberaEtapa3Apelido = Boolean(
    !opcoes?.restricaoDocumentosLegais &&
      (opcoes?.aceitaEncurtarOuApelido ||
        opcoes?.estiloPreferido === 'curto_direto' ||
        opcoes?.motivoRefinamento === 'preferir_nome_curto')
  );

  const maxNivel = opcoes?.maxNivelGeracao;

  const nomesExcluidosSet = new Set(
    (opcoes?.nomesExcluidos ?? []).map(n => n.trim().toLowerCase()).filter(Boolean)
  );
  const sobrenomesExcluidosNorm = (opcoes?.sobrenomesExcluidos ?? [])
    .map(normalizarToken)
    .filter(Boolean);

  const acentosNascimento = contarAcentos(nomeNascimento);

  function enriquecerCandidato({ nome, nivel }: { nome: string; nivel: number }): AnaliseNomeSocial {
    const analise = analisarNomeSocial(nome, dataNascimento, 'ia');
    const etapa = etapaDoNivel(nivel);
    const temAcentoAdicionado = contarAcentos(nome) > acentosNascimento;
    const quantidadeSobrenomes = contarSobrenomesSignificativos(nome);
    return {
      ...analise,
      nivelGerado: nivel,
      etapa,
      etapaGeracao: etapa,
      temAcentoAdicionado,
      quantidadeSobrenomes,
      explicacao: gerarExplicacaoSugestao(nome, nomeNascimento, etapa),
    };
  }

  function aplicarFiltrosPool(lista: AnaliseNomeSocial[]): AnaliseNomeSocial[] {
    let filtrada = nomesExcluidosSet.size > 0
      ? lista.filter(c => !nomesExcluidosSet.has(c.nomeCompleto.trim().toLowerCase()))
      : [...lista];

    if (sobrenomesExcluidosNorm.length > 0) {
      const semSobrenomeExcluido = filtrada.filter(
        c => !sobrenomesExcluidosNorm.some(sob => candidatoContemSobrenome(c.nomeCompleto, sob))
      );
      if (semSobrenomeExcluido.length >= 3) {
        filtrada = semSobrenomeExcluido;
      }
    }

    if (opcoes?.restricaoDocumentosLegais) {
      const legais = filtrada.filter(c => (c.etapa ?? etapaDoNivel(c.nivelGerado ?? 999)) <= 2);
      if (legais.length >= 1) filtrada = legais;
    }

    if (maxNivel != null && Number.isFinite(maxNivel)) {
      const capped = filtrada.filter(c => (c.nivelGerado ?? 999) <= maxNivel);
      if (capped.length >= 1) filtrada = capped;
    }

    return filtrada;
  }

  const candidatosEtapas1e2 = todosCandidatos.filter(c => c.nivel <= 85);
  const candidatosApelido = liberaEtapa3Apelido
    ? todosCandidatos.filter(c => c.nivel >= 110)
    : [];

  const candidatosIniciais = [...candidatosEtapas1e2, ...candidatosApelido];
  const poolBase = candidatosIniciais.length >= 3 ? candidatosIniciais : todosCandidatos;

  const analisados = aplicarFiltrosPool(poolBase.map(enriquecerCandidato));
  const comparador = criarComparadorCandidatosV3(opcoes);
  analisados.sort(comparador);

  const limpos = analisados.filter(a => a.semSequenciaVida);
  if (limpos.length >= 3) {
    return limpos.slice(0, maxSugestoes);
  }

  if (poolBase !== todosCandidatos) {
    const analisadosComEtapa3 = aplicarFiltrosPool(todosCandidatos.map(enriquecerCandidato));
    analisadosComEtapa3.sort(comparador);
    const limposComEtapa3 = analisadosComEtapa3.filter(a => a.semSequenciaVida);
    if (limposComEtapa3.length >= 3) {
      return limposComEtapa3.slice(0, maxSugestoes);
    }
    return analisadosComEtapa3.slice(0, Math.max(maxSugestoes, 3));
  }

  return analisados.slice(0, Math.max(maxSugestoes, 3));
}

/**
 * Mantém a sugestão de maior nota dentro da fatia visível (R3a · DEV-301).
 * `ordenados` já está na ordem de prioridade do comparador.
 */
function garantirMaiorNotaNaFatia(
  ordenados: AnaliseNomeSocial[],
  max: number,
): AnaliseNomeSocial[] {
  const fatia = ordenados.slice(0, Math.max(max, 1));
  const maior = ordenarPorNotaDescEstavel(ordenados)[0];
  if (maior && fatia.length > 0 && !fatia.includes(maior)) {
    fatia[fatia.length - 1] = maior;
  }
  return fatia;
}

/**
 * Motor v4 (DEV-301): só devolve sugestões que passam em R1 (zero bloqueio nos
 * 4 triângulos) e R2 (nota >= max(70, nascimento + 1)). Preferências do
 * questionário relaxam em cascata, sempre dentro do conjunto válido:
 * teto de nível → sem acento → primeiro nome intacto → sobrenomes excluídos → etapa 3 → grafia
 * artificial (último recurso, sempre atrás das naturais).
 * Nunca devolve candidato inválido, mesmo que a lista fique curta ou vazia.
 */
/** DEV-317: sem a exigência de 70, a sugestão ainda precisa subir pelo menos isto sobre o nascimento. */
export const GANHO_MINIMO_SEM_PISO = 5;

/**
 * Motor v4 + ordem DEV-317. Regras, nesta prioridade:
 *  1. nunca sugerir nome com bloqueio (4 triângulos);
 *  2. preferir nota >= max(70, nascimento + 1);
 *  3. seguir a entrevista (quem atende vem antes);
 *  4. da mudança mais sutil à mais severa (nível do gerador).
 * Passadas: normais com 70 → normais sem 70 (ganho >= 5) → duplicação com 70 → duplicação sem 70.
 * Só gera a passada seguinte se as anteriores não somam `maxSugestoes`.
 */
function gerarSugestoesAutoSocialV4ComReserva(
  nomeNascimento: string,
  dataNascimento: string,
  maxSugestoes: number,
  scoreNasc: number,
  opcoes?: OpcoesRankingNomeSocial,
): AnaliseNomeSocial[] {
  const acentosNascimento = contarAcentos(nomeNascimento);
  const primeiroNomeOriginal = nomeNascimento.trim().split(/\s+/)[0] ?? '';
  const nomesExcluidosSet = new Set(
    (opcoes?.nomesExcluidos ?? []).map((n) => n.trim().toLowerCase()).filter(Boolean),
  );
  const sobrenomesExcluidosNorm = (opcoes?.sobrenomesExcluidos ?? []).map(normalizarToken).filter(Boolean);
  const maxNivel = opcoes?.maxNivelGeracao;
  const pisoForte = scoreMinimoSugestao(scoreNasc);
  const minimoSemPiso = Math.max(scoreNasc + 1, scoreNasc + GANHO_MINIMO_SEM_PISO);
  const geradorBase: OpcoesGeradorCandidatos = {
    sobrenomesExtras: opcoes?.sobrenomesObrigatorios ?? [],
    sobrenomeAntesDoApelido: opcoes?.estiloPreferido === 'sobrenome_forte',
  };

  const sobrenomesObrigatoriosNasc = (opcoes?.sobrenomesObrigatorios ?? []).filter((sob) =>
    candidatoContemSobrenome(nomeNascimento, sob),
  );
  const palavrasNasc = nomeNascimento.trim().split(/\s+/).length;

  function atendePerfil(a: AnaliseNomeSocial): boolean {
    const palavras = a.nomeCompleto.trim().split(/\s+/).length;
    // V6 e V8 começam pelo sobrenome: confere todas as palavras, não só as depois do primeiro nome.
    const tokens = a.nomeCompleto.trim().split(/\s+/).map(normalizarToken);
    const contem = (sob: string) => tokens.includes(normalizarToken(sob));
    if (sobrenomesExcluidosNorm.some((sob) => tokens.includes(sob))) return false;
    if (sobrenomesObrigatoriosNasc.some((sob) => !contem(sob))) return false;
    // Estilo da entrevista
    if (opcoes?.estiloPreferido === 'curto_direto' && palavras >= palavrasNasc) return false;
    if (opcoes?.estiloPreferido === 'ajuste_sutil' && palavras !== palavrasNasc) return false;
    if (opcoes?.estiloPreferido === 'sobrenome_forte' && (a.temAcentoAdicionado || palavras < 2)) return false;
    if (opcoes?.acentoNaAssinatura === 'prefere_sem' && a.temAcentoAdicionado) return false;
    // Manter o primeiro nome: tirar o acento de nascimento (Cláudia → Claudia) ainda conta como manter.
    // Acento novo (Pedro → Pêdro) não conta.
    if (opcoes?.manterPrimeiroNome) {
      const primeiro = (a.nomeCompleto.trim().split(/\s+/)[0] ?? '').toLowerCase();
      const aceitos = [primeiroNomeOriginal.toLowerCase(), semAcentos(primeiroNomeOriginal).toLowerCase()];
      if (!aceitos.includes(primeiro)) return false;
    }
    if (maxNivel != null && Number.isFinite(maxNivel) && (a.nivelGerado ?? 999) > maxNivel) return false;
    return true;
  }

  function avaliar(lista: { nome: string; nivel: number }[]): AnaliseNomeSocial[] {
    const out: AnaliseNomeSocial[] = [];
    for (const { nome, nivel } of lista) {
      if (nomesExcluidosSet.has(nome.toLowerCase())) continue;
      // Uso em contratos/documentos: só nome com primeiro nome e sobrenome, sem apelido nem letra dobrada.
      if (opcoes?.restricaoDocumentosLegais && nivel > 55) continue;
      const grafia = classificarGrafia(nome, nomeNascimento);
      if (grafia === 'proibida') continue;
      const analise = analisarNomeSocial(nome, dataNascimento, 'ia');
      if (analise.temBloqueio) continue;
      if (analise.score < minimoSemPiso && analise.score < pisoForte) continue;
      const etapa = etapaDoNivel(nivel);
      const a: AnaliseNomeSocial = {
        ...analise,
        nivelGerado: nivel,
        etapa,
        etapaGeracao: etapa,
        temAcentoAdicionado: contarAcentos(nome) > acentosNascimento,
        grafiaArtificial: grafia === 'artificial',
        quantidadeSobrenomes: contarSobrenomesSignificativos(nome),
        explicacao: gerarExplicacaoSugestao(nome, nomeNascimento, etapa),
        pisoRelaxado: analise.score < pisoForte,
      };
      a.atendePerfil = atendePerfil(a);
      out.push(a);
    }
    return out;
  }

  const ordem = (a: AnaliseNomeSocial, b: AnaliseNomeSocial) =>
    Number(b.atendePerfil) - Number(a.atendePerfil) ||
    Number(a.grafiaArtificial) - Number(b.grafiaArtificial) ||
    (a.nivelGerado ?? 999) - (b.nivelGerado ?? 999) ||
    b.score - a.score ||
    a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR');

  const escolhidos: AnaliseNomeSocial[] = [];
  const vistos = new Set<string>();
  function juntar(lista: AnaliseNomeSocial[]) {
    for (const a of [...lista].sort(ordem)) {
      const k = a.nomeCompleto.trim().toLowerCase();
      if (vistos.has(k)) continue;
      vistos.add(k);
      escolhidos.push(a);
    }
  }

  // Entrevista: com 3 ou mais opções que atendem, as que não atendem ficam de fora.
  const efetivos = () => {
    const atendem = escolhidos.filter((a) => a.atendePerfil);
    return atendem.length >= SUGESTAO_CONFIG_V4.minimoVisiveis ? atendem : escolhidos;
  };
  const normais = avaliar(gerarCandidatosComNivel(nomeNascimento, geradorBase));
  juntar(normais.filter((a) => !a.pisoRelaxado));
  if (efetivos().length < maxSugestoes) juntar(normais.filter((a) => a.pisoRelaxado));
  if (efetivos().length < maxSugestoes) {
    const severos = avaliar(
      gerarCandidatosComNivel(nomeNascimento, { ...geradorBase, incluirSevero: true }).filter(
        (c) => c.nivel >= NIVEL_SEVERO_MIN,
      ),
    );
    juntar(severos.filter((a) => !a.pisoRelaxado));
    if (efetivos().length < maxSugestoes) juntar(severos.filter((a) => a.pisoRelaxado));
  }
  // A lista sai na ordem e com no máximo maxSugestoes itens, mas a maior nota de todas e a maior que
  // atende à entrevista sempre entram (são os selos Maior nota e Principal).
  const todos = efetivos();
  const lista = todos.slice(0, maxSugestoes);
  for (const destaque of [
    ordenarPorNotaDescEstavel(todos)[0],
    ordenarPorNotaDescEstavel(todos.filter((a) => a.atendePerfil))[0],
  ]) {
    if (destaque && !lista.includes(destaque)) lista.push(destaque);
  }
  return lista;
}

/** DEV-317: selos "Principal" (maior nota que atende à entrevista) e "Maior nota" (a maior de todas). */
function marcarSelos(validas: AnaliseNomeSocial[], scoreNasc: number, opcoes?: OpcoesRankingNomeSocial): void {
  const maior = ordenarPorNotaDescEstavel(validas)[0];
  const atendemTodas = validas.filter((a) => a.atendePerfil !== false && a.score > scoreNasc);
  // Grafia artificial (til no meio, ex.: "Pãula") só vira Principal se não houver opção natural.
  const naturais = atendemTodas.filter((a) => !a.grafiaArtificial);
  const atendem = ordenarPorNotaDescEstavel(naturais.length > 0 ? naturais : atendemTodas);
  let harmonizado: AnaliseNomeSocial | undefined;
  if (isMotorV4() && opcoes?.prioridadeConflito === 'nota') {
    harmonizado = maior;
  } else if (atendem.length > 0) {
    // Afinidades do perfil desempatam entre notas próximas (até 4 pontos abaixo da maior que atende).
    const teto = atendem[0]!.score;
    const proximas = atendem.filter((a) => teto - a.score < 5);
    harmonizado = [...proximas].sort(
      (a, b) => (b.aderenciaPerfil ?? 0) - (a.aderenciaPerfil ?? 0) || b.score - a.score,
    )[0];
  }
  for (const a of validas) {
    a.maiorNota = a === maior;
    a.principal = a === harmonizado;
  }
}

/** DEV-317: Principal em 1º, Maior nota logo depois (se for outra), e o resto na ordem de prioridade. */
function ordenarComSelos(
  validas: AnaliseNomeSocial[],
  scoreNasc: number,
  opcoes?: OpcoesRankingNomeSocial,
): AnaliseNomeSocial[] {
  marcarSelos(validas, scoreNasc, opcoes);
  const principal = validas.find((a) => a.principal);
  const maior = validas.find((a) => a.maiorNota);
  const topo = [principal, maior].filter((a, i, arr): a is AnaliseNomeSocial => Boolean(a) && arr.indexOf(a) === i);
  return [...topo, ...validas.filter((a) => !topo.includes(a))];
}

/**
 * Constrói o Top 3 Diverso (§8.6):
 * 1. Mudança mínima
 * 2. Nome encurtado
 * 3. Alternativa
 */
function construirTop3Diverso(
  candidatosDisponiveis: AnaliseNomeSocial[],
  melhorNome: AnaliseNomeSocial | null,
  nomeNascimento: string
): AnaliseNomeSocial[] {
  const pool = candidatosDisponiveis.filter(c => c !== melhorNome && c.nomeCompleto !== melhorNome?.nomeCompleto);
  const origPartes = nomeNascimento.trim().split(/\s+/);

  const selecionados: AnaliseNomeSocial[] = [];
  const nomesUsados = new Set<string>();
  if (melhorNome) nomesUsados.add(melhorNome.nomeCompleto.toLowerCase());

  // 1. Mudança mínima: variação com mesmo número de palavras do original (ex: só 1 acento ou ajuste leve)
  const mudancaMinima = pool.find(c => {
    const p = c.nomeCompleto.split(/\s+/);
    return !nomesUsados.has(c.nomeCompleto.toLowerCase()) && p.length === origPartes.length;
  }) ?? pool.find(c => !nomesUsados.has(c.nomeCompleto.toLowerCase()));

  if (mudancaMinima) {
    mudancaMinima.tipoOpcao = 'mudanca_minima';
    selecionados.push(mudancaMinima);
    nomesUsados.add(mudancaMinima.nomeCompleto.toLowerCase());
  }

  // 2. Encurtado: variação com menos palavras (ex: primeiro nome + 1 sobrenome ou só primeiro nome)
  const encurtado = pool.find(c => {
    const p = c.nomeCompleto.split(/\s+/);
    return !nomesUsados.has(c.nomeCompleto.toLowerCase()) && p.length < origPartes.length;
  }) ?? pool.find(c => !nomesUsados.has(c.nomeCompleto.toLowerCase()));

  if (encurtado) {
    encurtado.tipoOpcao = 'encurtado';
    selecionados.push(encurtado);
    nomesUsados.add(encurtado.nomeCompleto.toLowerCase());
  }

  // 3. Alternativa: outra opção diferente
  const alternativa = pool.find(c => !nomesUsados.has(c.nomeCompleto.toLowerCase()));
  if (alternativa) {
    alternativa.tipoOpcao = 'alternativa';
    selecionados.push(alternativa);
    nomesUsados.add(alternativa.nomeCompleto.toLowerCase());
  }

  return selecionados.slice(0, 3);
}

// ── Orquestração principal ────────────────────────────────────────────────────

/**
 * Analisa múltiplos nomes candidatos e retorna ranking completo.
 *
 * Seleção do Nome de Ouro (melhorNome):
 * - Prioriza sugestões do usuário se score >= 85 e harmônicas
 * - Segue a nova ordem em 3 etapas com corte N5 (>= 85) e sem sequência na Vida
 * - Desempate por compatibilidade, preferência de uso/encurtamento e normas ortográficas do português
 */
export function analisarNomesSocial(
  nomesCandidatos: string[],
  nomeNascimento: string,
  dataNascimento: string,
  opcoes?: OpcoesRankingNomeSocial | string
): ResultadoNomeSocial {
  const resolvedOpcoes: OpcoesRankingNomeSocial | undefined =
    typeof opcoes === 'object' && opcoes !== null ? opcoes : undefined;

  const destino = calcularDestino(dataNascimento);
  const acentosNascimento = contarAcentos(nomeNascimento);

  const somenteChat = Boolean(resolvedOpcoes?.somenteCandidatosInformados);
  const assinaturaAtual = resolvedOpcoes?.assinaturaAtual?.trim();

  const listaCandidatos = somenteChat
    ? nomesCandidatos.map((n) => n.trim()).filter((n) => n.length >= 2)
    : [...nomesCandidatos];

  if (!somenteChat) {
    const variacaoPropria = resolvedOpcoes?.variacaoPropria?.trim();
    if (
      variacaoPropria &&
      variacaoPropria.length >= 2 &&
      !listaCandidatos.some((c) => c.trim().toLowerCase() === variacaoPropria.toLowerCase())
    ) {
      listaCandidatos.unshift(variacaoPropria);
    }

    // Se o usuário informou "Como você assina hoje?" e é diferente do nome de nascimento,
    // incluímos na lista avaliada como linha de base se ainda não estiver nos candidatos.
    if (
      assinaturaAtual &&
      assinaturaAtual.length >= 2 &&
      assinaturaAtual.toLowerCase() !== nomeNascimento.trim().toLowerCase() &&
      !listaCandidatos.some((c) => c.trim().toLowerCase() === assinaturaAtual.toLowerCase())
    ) {
      listaCandidatos.unshift(assinaturaAtual);
    }
  }

  // Candidatos do usuário
  let analisesUsuario: AnaliseNomeSocial[] = listaCandidatos
    .map(n => n.trim()).filter(n => n.length >= 2)
    .map(n => {
      const a = analisarNomeSocial(n, dataNascimento, 'usuario');
      const isAssinaturaAtual =
        Boolean(assinaturaAtual) && n.toLowerCase() === assinaturaAtual!.toLowerCase();
      return {
        ...a,
        nivelGerado: 0,
        etapa: 1,
        etapaGeracao: 1,
        temAcentoAdicionado: contarAcentos(n) > acentosNascimento,
        quantidadeSobrenomes: contarSobrenomesSignificativos(n),
        explicacao: isAssinaturaAtual
          ? 'Sua assinatura atual (linha de base para comparação).'
          : 'Nome sugerido por você.',
      };
    });

  if (!resolvedOpcoes?.somenteCandidatosInformados) {
    analisesUsuario.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
      return (compRank[b.compatibilidade] ?? 1) - (compRank[a.compatibilidade] ?? 1);
    });
  }

  const scoreNasc = scoreNascimentoNomeSocial(nomeNascimento, dataNascimento);
  const ganhoMinimoPontos = getGanhoMinimoPontos();
  const motorV4 = isMotorV4();
  const scoreMinimo = scoreMinimoSugestao(scoreNasc, ganhoMinimoPontos);

  /** R1 + R2: separa o que pode ser oferecido do que fica só como comparação. */
  function separarOfertaveis(lista: AnaliseNomeSocial[]) {
    const ofertaveis: AnaliseNomeSocial[] = [];
    const comparacao: AnaliseNomeSocial[] = [];
    for (const a of lista) {
      const motivo = motivoNaoOfertavel(a, scoreNasc, ganhoMinimoPontos);
      if (motivo === null) {
        a.ofertavel = true;
        ofertaveis.push(a);
      } else {
        a.ofertavel = false;
        a.motivoNaoOfertavel = motivo;
        comparacao.push(a);
      }
    }
    return { ofertaveis, comparacao };
  }

  /** R3a: marca a sugestão de maior nota entre as oferecidas. */
  function marcarMaiorNota(ofertadas: AnaliseNomeSocial[]) {
    const maior = ordenarPorNotaDescEstavel(ofertadas)[0];
    for (const a of ofertadas) a.maiorNota = a === maior;
  }

  if (resolvedOpcoes?.somenteCandidatosInformados) {
    const { ofertaveis, comparacao } = separarOfertaveis(analisesUsuario);
    const elegiveis = dedupeCandidatosEstavel(ofertaveis);
    marcarMaiorNota(elegiveis);
    return {
      nomeNascimento,
      dataNascimento,
      destino,
      nomesCandidatos: elegiveis,
      melhorNome: elegiveis[0] ?? null,
      top3: elegiveis.slice(0, 3),
      avisoSobrenomeExigido: null,
      scoreNascimento: scoreNasc,
      semOpcoesElegiveis: elegiveis.length === 0,
      ganhoMinimoPontos,
      scoreMinimoSugestao: scoreMinimo,
      comparacao,
      motorV4,
    };
  }

  // Sugestões do sistema
  const usuariosSet = new Set(analisesUsuario.map(a => a.nomeCompleto.toLowerCase()));
  let sugestoesIA = (
    motorV4
      ? gerarSugestoesAutoSocialV4ComReserva(nomeNascimento, dataNascimento, 10, scoreNasc, resolvedOpcoes)
      : gerarSugestoesAutoSocial(nomeNascimento, dataNascimento, 10, resolvedOpcoes)
  ).filter(s => !usuariosSet.has(s.nomeCompleto.toLowerCase()));

  const usuarios = separarOfertaveis(analisesUsuario);
  analisesUsuario = usuarios.ofertaveis;
  sugestoesIA = separarOfertaveis(sugestoesIA).ofertaveis;

  if (motorV4 && temAfinidades(resolvedOpcoes?.afinidades)) {
    for (const a of [...analisesUsuario, ...sugestoesIA]) {
      const numeros = { expressao: a.expressao, motivacao: a.motivacao, impressao: a.impressao };
      a.aderenciaPerfil = pontuarAderenciaPerfil(numeros, resolvedOpcoes!.afinidades);
      a.explicacaoPerfil = explicarAderenciaPerfil(numeros, resolvedOpcoes!.afinidades);
    }
  }

  const scoreMaximoValidas = [...analisesUsuario, ...sugestoesIA].reduce((m, a) => Math.max(m, a.score), 0);
  const comparador = criarComparadorCandidatosV3(resolvedOpcoes, {
    scoreMaximo: scoreMaximoValidas,
    primeiroNomeOriginal: nomeNascimento.trim().split(/\s+/)[0] ?? '',
  });
  let melhorNome: AnaliseNomeSocial | null;

  for (const a of analisesUsuario) a.atendePerfil = true;
  // DEV-317: no motor v4 a lista segue a ordem de prioridade (sem bloqueio > 70 > entrevista > mais sutil).
  const ordemV4 = motorV4
    ? ordenarComSelos(dedupeCandidatosEstavel([...[...analisesUsuario].sort(comparador), ...sugestoesIA]), scoreNasc, resolvedOpcoes)
    : [];
  if (motorV4) {
    melhorNome = ordemV4[0] ?? null;
  } else {
    type Candidato = AnaliseNomeSocial & { nivelEfetivo: number };
    const aptosN5: Candidato[] = [
      ...analisesUsuario.filter(a => a.score >= 85).map(a => ({ ...a, nivelEfetivo: 0 })),
      ...sugestoesIA.filter(a => a.score >= 85 && a.semSequenciaVida).map(a => ({ ...a, nivelEfetivo: a.nivelGerado ?? 999 })),
    ];
    aptosN5.sort(comparador);
    melhorNome =
      aptosN5[0] ??
      ordenarPorNotaDescEstavel(analisesUsuario)[0] ??
      ordenarPorNotaDescEstavel(sugestoesIA)[0] ??
      null;
  }

  if (melhorNome && !melhorNome.tipoOpcao) {
    const p = melhorNome.nomeCompleto.split(/\s+/);
    const origP = nomeNascimento.trim().split(/\s+/);
    melhorNome.tipoOpcao = p.length < origP.length ? 'encurtado' : 'mudanca_minima';
  }

  const todasOrdenadas = motorV4
    ? ordemV4
    : dedupeCandidatosEstavel(ordenarPorNotaDescEstavel([...analisesUsuario, ...sugestoesIA]));
  let top3 = motorV4
    ? ordemV4.filter((c) => c !== melhorNome).slice(0, Math.max(3, NOME_SOCIAL_SUGESTOES_INICIAIS))
    : construirTop3Diverso(todasOrdenadas, melhorNome, nomeNascimento);
  // DEV-305: a vitrine inicial tem 3 opções por rodada. Se faltar variedade, as demais vêm na ordem de
  // preferência da entrevista (atendem primeiro, depois menor distorção), nunca por nota.
  const capacidadeTop = Math.max(3, NOME_SOCIAL_SUGESTOES_INICIAIS);
  if (motorV4) {
    for (const a of ordemV4) {
      if (a.tipoOpcao) continue;
      const nPal = a.nomeCompleto.trim().split(/\s+/).length;
      const nNasc = nomeNascimento.trim().split(/\s+/).length;
      a.tipoOpcao = nPal < nNasc ? 'encurtado' : nPal === nNasc ? 'mudanca_minima' : 'alternativa';
    }
  }
  top3 = filtrarOfertaveis(top3, scoreNasc, ganhoMinimoPontos);
  if (!motorV4) marcarMaiorNota(todasOrdenadas);

  // Verifica transparência de bloqueio nativo quando um sobrenome obrigatório precisou de acento sutil
  let avisoSobrenomeExigido: AvisoSobrenomeExigido | null = null;
  const sobrenomesObrig = resolvedOpcoes?.sobrenomesObrigatorios ?? [];
  if (sobrenomesObrig.length > 0) {
    const primeiroNome = nomeNascimento.trim().split(/\s+/)[0] ?? '';
    for (const sobExigido of sobrenomesObrig) {
      const candComSob = todasOrdenadas.find(c => candidatoContemSobrenome(c.nomeCompleto, sobExigido));
      if (!candComSob) continue;
      const avaliacaoPura = analisarNomeSocial(`${primeiroNome} ${sobExigido}`.trim(), dataNascimento, 'ia');
      const precisouAcento = Boolean(
        candComSob.temAcentoAdicionado && (!avaliacaoPura.semSequenciaVida || avaliacaoPura.score < 85)
      );
      if (precisouAcento) {
        avisoSobrenomeExigido = {
          sobrenome: sobExigido,
          precisouAcento: true,
          notaAlcancada: candComSob.score,
        };
        break;
      }
    }
  }

  return {
    nomeNascimento,
    dataNascimento,
    destino,
    nomesCandidatos: todasOrdenadas,
    melhorNome:
      melhorNome && motivoNaoOfertavel(melhorNome, scoreNasc, ganhoMinimoPontos) === null
        ? melhorNome
        : null,
    top3,
    avisoSobrenomeExigido,
    scoreNascimento: scoreNasc,
    semOpcoesElegiveis: todasOrdenadas.length === 0,
    ganhoMinimoPontos,
    scoreMinimoSugestao: scoreMinimo,
    comparacao: usuarios.comparacao,
    motorV4,
  };
}
