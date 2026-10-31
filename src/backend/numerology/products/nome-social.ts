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

import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularMissao, calcularImpressao } from '../numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../karmic';
import { avaliarCompatibilidade } from '../harmonization';
import { avaliarNome, calcularScoreTeto, calcularScoreV1ComOcorrenciasExtras } from '../score';
import { isScoreV3 } from '../score-version';
import type { LicaoCarmica, TendenciaOculta, DebitoCarmicoInfo } from '../karmic';
import type { Bloqueio } from '../triangle';

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
}

export interface ResultadoNomeSocial {
  nomeNascimento: string;
  dataNascimento: string;
  destino: number;
  nomesCandidatos: AnaliseNomeSocial[];
  melhorNome: AnaliseNomeSocial | null;
  top3: AnaliseNomeSocial[];
  avisoSobrenomeExigido?: AvisoSobrenomeExigido | null;
}

// ── Análise de um nome ────────────────────────────────────────────────────────

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
 * Gera candidatos com fases de prioridade explícitas reorganizadas nas 3 etapas.
 * Retorna array deduplicado, cada item com nome e nivel (fase).
 */
export function gerarCandidatosComNivel(nomeNascimento: string): { nome: string; nivel: number }[] {
  const partes = nomeNascimento.trim().split(/\s+/);
  const prim = partes[0]!;
  const sobs = partes.slice(1);
  const nomeFull = partes.join(' ');
  const origLow = nomeFull.toLowerCase();

  const todos: { nome: string; nivel: number }[] = [];
  function add(nome: string, nivel: number) {
    if (nome.toLowerCase() !== origLow) todos.push({ nome, nivel });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 1: Encurtar sem acento (fases 10, 20 e 25)
  // ═══════════════════════════════════════════════════════════════════════════

  // Fase 10: remove 1 sobrenome, nenhuma modificação — só se tiver 2+
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      add([prim, ...sobs.filter((_, j) => j !== i)].join(' '), 10);
    }
  }

  // Fase 20: primeiro nome + 1 sobrenome, sem modificação
  for (const sob of sobs) add(`${prim} ${sob}`, 20);

  // Fase 25: apenas primeiro nome, sem modificação (subiu da antiga fase 100)
  if (sobs.length > 0) add(prim, 25);

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 2: Acento sutil (fases 50, 60, 65, 70 e 80)
  // Forma curta (2a) vem ANTES do nome completo (2b e 2c)
  // ═══════════════════════════════════════════════════════════════════════════

  // 2a - Fase 50: (n-1) sobrenomes + 1 acento
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      const base = [prim, ...sobs.filter((_, j) => j !== i)].join(' ');
      for (const v of gerarVariacoesAcento(base)) add(v, 50);
    }
  }

  // 2a - Fase 60: primeiro nome + 1 sobrenome + 1 acento
  for (const sob of sobs) {
    for (const v of gerarVariacoesAcento(`${prim} ${sob}`)) add(v, 60);
  }

  // 2a - Fase 65: primeiro nome + acento (antiga fase 110)
  for (const v of gerarVariacoesAcento(prim)) add(v, 65);

  // 2b - Fase 70: nome completo + 1 acento em qualquer palavra (antiga fase 30)
  for (const v of gerarVariacoesAcento(nomeFull)) add(v, 70);

  // 2c - Fase 80: nome completo + 2 acentos em 2 palavras diferentes (antiga fase 40)
  for (let wi = 0; wi < partes.length; wi++) {
    const varW = gerarVariacoesAcentoPalavra(nomeFull, wi);
    for (let wj = wi + 1; wj < partes.length; wj++) {
      for (const v1 of varW) {
        for (const v2 of gerarVariacoesAcentoPalavra(v1, wj)) add(v2, 80);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ETAPA 3: Último recurso (fases 90, 95, 100, 105, 110 e 120)
  // ═══════════════════════════════════════════════════════════════════════════

  // Fase 90: primeiro nome + 1 sobrenome + 1 duplicação
  for (const sob of sobs) {
    for (const v of gerarVariacoesDuplicacao(`${prim} ${sob}`)) add(v, 90);
  }

  // Fase 95: (n-1) sobrenomes + 1 duplicação
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      const base = [prim, ...sobs.filter((_, j) => j !== i)].join(' ');
      for (const v of gerarVariacoesDuplicacao(base)) add(v, 95);
    }
  }

  // Fase 100: nome completo + 1 duplicação (antiga fase 70)
  for (const v of gerarVariacoesDuplicacao(nomeFull)) add(v, 100);

  // Fase 105: primeiro nome + duplicação (antiga fase 120)
  for (const v of gerarVariacoesDuplicacao(prim)) add(v, 105);

  // Fase 110: corte no meio ("Guilher", "Guilher Correa", etc. · nova variante)
  for (const v of gerarVariacoesCorteNoMeio(nomeNascimento)) add(v, 110);

  // Fase 120: diminutivo tradicional (cortar na 2ª vogal) + sobrenomes (antiga fase 130)
  for (const v of gerarVariacoesDiminutivo(nomeNascimento)) add(v, 120);

  // Deduplica mantendo o nível mais baixo para cada nome repetido
  const dedup = new Map<string, { nome: string; nivel: number }>();
  for (const c of todos) {
    const key = c.nome.toLowerCase();
    const ex = dedup.get(key);
    if (!ex || c.nivel < ex.nivel) dedup.set(key, c);
  }

  return Array.from(dedup.values());
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
}

/**
 * Função de ordenação do ranking v3 (DEV-186 + DEV-190 §6 + DEV-235).
 */
function criarComparadorCandidatosV3(opcoes?: OpcoesRankingNomeSocial) {
  const obrigatorios = (opcoes?.sobrenomesObrigatorios ?? []).map(normalizarToken).filter(Boolean);
  const excluidos = (opcoes?.sobrenomesExcluidos ?? []).map(normalizarToken).filter(Boolean);
  const estilo = opcoes?.estiloPreferido;
  const motivo = opcoes?.motivoRefinamento;

  const prefereSemAcento =
    estilo === 'sobrenome_forte' || motivo === 'preferir_sem_acento';
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

  function contarObrigatoriosAtendidos(nome: string): number {
    if (obrigatorios.length === 0) return 0;
    let count = 0;
    for (const sob of obrigatorios) {
      if (candidatoContemSobrenome(nome, sob)) count++;
    }
    return count;
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

    const nivelA = a.nivelGerado ?? 999;
    const nivelB = b.nivelGerado ?? 999;
    const etapaA = a.etapa ?? etapaDoNivel(nivelA);
    const etapaB = b.etapa ?? etapaDoNivel(nivelB);

    const n5A = a.score >= 85 ? 1 : 0;
    const n5B = b.score >= 85 ? 1 : 0;

    // Preferências explícitas de estilo ou motivo de refinamento entre candidatos N5 (ou de mesmo patamar)
    if (n5A === n5B) {
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
    }

    // Se ambos atingiram N5: a etapa menor vence (Etapa 1 vence Etapa 2, etc.)
    if (n5A && n5B) {
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
    opcoes?.aceitaEncurtarOuApelido ||
      opcoes?.estiloPreferido === 'curto_direto' ||
      opcoes?.motivoRefinamento === 'preferir_nome_curto'
  );

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

  const listaCandidatos = [...nomesCandidatos];
  const variacaoPropria = resolvedOpcoes?.variacaoPropria?.trim();
  if (
    variacaoPropria &&
    variacaoPropria.length >= 2 &&
    !listaCandidatos.some(c => c.trim().toLowerCase() === variacaoPropria.toLowerCase())
  ) {
    listaCandidatos.unshift(variacaoPropria);
  }

  // Se o usuário informou "Como você assina hoje?" e é diferente do nome de nascimento,
  // incluímos na lista avaliada como linha de base se ainda não estiver nos candidatos.
  const assinaturaAtual = resolvedOpcoes?.assinaturaAtual?.trim();
  if (
    assinaturaAtual &&
    assinaturaAtual.length >= 2 &&
    assinaturaAtual.toLowerCase() !== nomeNascimento.trim().toLowerCase() &&
    !listaCandidatos.some(c => c.trim().toLowerCase() === assinaturaAtual.toLowerCase())
  ) {
    listaCandidatos.unshift(assinaturaAtual);
  }

  // Candidatos do usuário
  const analisesUsuario: AnaliseNomeSocial[] = listaCandidatos
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

  analisesUsuario.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
    return (compRank[b.compatibilidade] ?? 1) - (compRank[a.compatibilidade] ?? 1);
  });

  // Sugestões do sistema
  const usuariosSet = new Set(analisesUsuario.map(a => a.nomeCompleto.toLowerCase()));
  const sugestoesIA = gerarSugestoesAutoSocial(nomeNascimento, dataNascimento, 10, resolvedOpcoes)
    .filter(s => !usuariosSet.has(s.nomeCompleto.toLowerCase()));

  // Pool de seleção do melhor nome (Nome de Ouro)
  type Candidato = AnaliseNomeSocial & { nivelEfetivo: number };
  const aptosN5: Candidato[] = [
    ...analisesUsuario.filter(a => a.score >= 85).map(a => ({ ...a, nivelEfetivo: 0 })),
    ...sugestoesIA.filter(a => a.score >= 85 && a.semSequenciaVida).map(a => ({ ...a, nivelEfetivo: a.nivelGerado ?? 999 })),
  ];

  const comparador = criarComparadorCandidatosV3(resolvedOpcoes);
  aptosN5.sort(comparador);

  // Melhor nome
  const melhorNome: AnaliseNomeSocial | null =
    aptosN5[0] ?? analisesUsuario[0] ?? sugestoesIA[0] ?? null;

  if (melhorNome && !melhorNome.tipoOpcao) {
    const p = melhorNome.nomeCompleto.split(/\s+/);
    const origP = nomeNascimento.trim().split(/\s+/);
    melhorNome.tipoOpcao = p.length < origP.length ? 'encurtado' : 'mudanca_minima';
  }

  const todasOrdenadas = [...analisesUsuario, ...sugestoesIA];
  const top3 = construirTop3Diverso(todasOrdenadas, melhorNome, nomeNascimento);

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
    melhorNome,
    top3,
    avisoSobrenomeExigido,
  };
}
