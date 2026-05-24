/**
 * Lógica específica do produto Nome Social.
 *
 * Fluxo de geração de "Nossas Sugestões":
 * Fase 1  (nivel 10): estrutural — remove 1 sobrenome, sem modificação
 * Fase 2  (nivel 20): estrutural — mantém primeiro nome + 1 sobrenome
 * Fase 3  (nivel 30): nome completo + 1 acento
 * Fase 4  (nivel 40): nome completo + 2 acentos (palavras diferentes)
 * Fase 5  (nivel 50): (n-1) sobrenomes + 1 acento
 * Fase 6  (nivel 60): primeiro nome + 1 sobrenome + 1 acento
 * Fase 7  (nivel 70): nome completo + 1 duplicação
 * Fase 8  (nivel 80): (n-1) sobrenomes + 1 duplicação
 * Fase 9  (nivel 90): primeiro nome + 1 sobrenome + 1 duplicação
 * Fase 10 (nivel 100): apenas primeiro nome
 * Fase 11 (nivel 110): primeiro nome + acento
 * Fase 12 (nivel 120): primeiro nome + duplicação
 * Fase 13 (nivel 130): diminutivo (apelido) + sobrenomes
 *
 * Seleção do Nome de Ouro:
 * Entre candidatos com score ≥ 80, prioriza (1) sugestões do usuário,
 * (2) menor descaracterização (nivel baixo), (3) maior score.
 */

import { calcularTodosTriangulos, detectarBloqueios, todasSequenciasNegativas } from '../triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularMissao, calcularImpressao } from '../numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '../karmic';
import { avaliarCompatibilidade } from '../harmonization';
import { calcularScore, calcularScoreTeto } from '../score';
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

// ── Interfaces ────────────────────────────────────────────────────────────────

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
  /** Nivel de prioridade da fase de geração (apenas sugestões do sistema). */
  nivelGerado?: number;
}

export interface ResultadoNomeSocial {
  nomeNascimento: string;
  dataNascimento: string;
  destino: number;
  nomesCandidatos: AnaliseNomeSocial[];
  melhorNome: AnaliseNomeSocial | null;
  top3: AnaliseNomeSocial[];
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
  const totalOcorrencias = bloqueios.reduce((sum, b) => sum + b.totalOcorrencias, 0);
  const ocorrenciasExtras = Math.max(0, totalOcorrencias - bloqueios.length);
  const score = calcularScore({
    bloqueios: bloqueios.length, licoesCarmicas: licoes.length,
    tendenciasOcultas: tendencias.length, debitosCarmicos: debitos.length,
    debitosCarmicoFixos: debitosFixosCount, ocorrenciasExtras, compatibilidade,
  });
  const scoreTeto = calcularScoreTeto(debitosFixosCount);

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
  };
}

// ── Geração de sugestões do sistema ──────────────────────────────────────────

/**
 * Gera candidatos com fases de prioridade explícitas.
 * Retorna array deduplicado, cada item com nome e nivel (fase).
 */
function gerarCandidatosComNivel(nomeNascimento: string): { nome: string; nivel: number }[] {
  const partes = nomeNascimento.trim().split(/\s+/);
  const prim = partes[0]!;
  const sobs = partes.slice(1);
  const nomeFull = partes.join(' ');
  const origLow = nomeFull.toLowerCase();

  const todos: { nome: string; nivel: number }[] = [];
  function add(nome: string, nivel: number) {
    if (nome.toLowerCase() !== origLow) todos.push({ nome, nivel });
  }

  // Fase 1 (10): remove 1 sobrenome, nenhuma modificação — só se tiver 2+
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      add([prim, ...sobs.filter((_, j) => j !== i)].join(' '), 10);
    }
  }

  // Fase 2 (20): primeiro nome + 1 sobrenome, sem modificação
  for (const sob of sobs) add(`${prim} ${sob}`, 20);

  // Fase 3 (30): nome completo + 1 acento em qualquer palavra
  for (const v of gerarVariacoesAcento(nomeFull)) add(v, 30);

  // Fase 4 (40): nome completo + 2 acentos em 2 palavras diferentes
  for (let wi = 0; wi < partes.length; wi++) {
    const varW = gerarVariacoesAcentoPalavra(nomeFull, wi);
    for (let wj = wi + 1; wj < partes.length; wj++) {
      for (const v1 of varW) {
        for (const v2 of gerarVariacoesAcentoPalavra(v1, wj)) add(v2, 40);
      }
    }
  }

  // Fase 5 (50): (n-1) sobrenomes + 1 acento
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      const base = [prim, ...sobs.filter((_, j) => j !== i)].join(' ');
      for (const v of gerarVariacoesAcento(base)) add(v, 50);
    }
  }

  // Fase 6 (60): primeiro nome + 1 sobrenome + 1 acento
  for (const sob of sobs) {
    for (const v of gerarVariacoesAcento(`${prim} ${sob}`)) add(v, 60);
  }

  // Fase 7 (70): nome completo + 1 duplicação
  for (const v of gerarVariacoesDuplicacao(nomeFull)) add(v, 70);

  // Fase 8 (80): (n-1) sobrenomes + 1 duplicação
  if (sobs.length >= 2) {
    for (let i = 0; i < sobs.length; i++) {
      const base = [prim, ...sobs.filter((_, j) => j !== i)].join(' ');
      for (const v of gerarVariacoesDuplicacao(base)) add(v, 80);
    }
  }

  // Fase 9 (90): primeiro nome + 1 sobrenome + 1 duplicação
  for (const sob of sobs) {
    for (const v of gerarVariacoesDuplicacao(`${prim} ${sob}`)) add(v, 90);
  }

  // Fase 10 (100): apenas primeiro nome, sem modificação
  if (sobs.length > 0) add(prim, 100);

  // Fase 11 (110): primeiro nome + acento
  for (const v of gerarVariacoesAcento(prim)) add(v, 110);

  // Fase 12 (120): primeiro nome + duplicação
  for (const v of gerarVariacoesDuplicacao(prim)) add(v, 120);

  // Fase 13 (130): diminutivo + sobrenomes (último recurso)
  for (const v of gerarVariacoesDiminutivo(nomeNascimento)) add(v, 130);

  // Deduplica mantendo o nivel mais baixo para cada nome repetido
  const dedup = new Map<string, { nome: string; nivel: number }>();
  for (const c of todos) {
    const key = c.nome.toLowerCase();
    const ex = dedup.get(key);
    if (!ex || c.nivel < ex.nivel) dedup.set(key, c);
  }

  return Array.from(dedup.values());
}

/**
 * Gera sugestões do sistema como variações do nome de nascimento,
 * priorizando as menos intrusivas com score ≥ 80.
 * Ordenação final: nivel ASC (menos intrusivo primeiro), score DESC.
 */
function gerarSugestoesAutoSocial(
  nomeNascimento: string,
  dataNascimento: string,
  maxSugestoes = 5
): AnaliseNomeSocial[] {
  const candidatos = gerarCandidatosComNivel(nomeNascimento);

  const analisados: AnaliseNomeSocial[] = candidatos.map(({ nome, nivel }) => ({
    ...analisarNomeSocial(nome, dataNascimento, 'ia'),
    nivelGerado: nivel,
  }));

  // Ordenação: nivel ASC (menos descaracterizado), harmonia DESC, score DESC
  const sortFn = (a: AnaliseNomeSocial, b: AnaliseNomeSocial) => {
    const levelDiff = (a.nivelGerado ?? 999) - (b.nivelGerado ?? 999);
    if (levelDiff !== 0) return levelDiff;

    if (a.score >= 80 && b.score >= 80) {
      const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
      const rA = compRank[a.compatibilidade] ?? 1;
      const rB = compRank[b.compatibilidade] ?? 1;
      if (rA !== rB) return rB - rA;
    }

    if (a.score !== b.score) return b.score - a.score;

    const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
    const rA = compRank[a.compatibilidade] ?? 1;
    const rB = compRank[b.compatibilidade] ?? 1;
    return rB - rA;
  };

  analisados.sort(sortFn);

  // Preferência: top-N com score >= 80
  const excelentes = analisados.filter(a => a.score >= 80);
  if (excelentes.length >= 3) return excelentes.slice(0, maxSugestoes);

  // Fallback: melhores disponíveis (mínimo 3)
  return analisados.slice(0, Math.max(maxSugestoes, 3));
}

// ── Orquestração principal ────────────────────────────────────────────────────

/**
 * Analisa múltiplos nomes candidatos e retorna ranking completo.
 *
 * Seleção do Nome de Ouro (melhorNome):
 * Entre candidatos com score ≥ 80, prioriza:
 *   1. Menor descaracterização e preferência do usuário (sugestões do usuário nível 0, IA nível gerado)
 *   2. Maior harmonia vibracional (favoravel > neutro > desfavoravel)
 *   3. Score mais alto (desempate)
 * Se nenhum candidato atingir score ≥ 80, usa o melhor disponível.
 */
export function analisarNomesSocial(
  nomesCandidatos: string[],
  nomeNascimento: string,
  dataNascimento: string,
  _generoPreferido?: string
): ResultadoNomeSocial {
  const destino = calcularDestino(dataNascimento);

  // Candidatos do usuário
  const analisesUsuario: AnaliseNomeSocial[] = nomesCandidatos
    .map(n => n.trim()).filter(n => n.length >= 2)
    .map(n => analisarNomeSocial(n, dataNascimento, 'usuario'));
  
  // Ordena os candidatos do usuário usando o critério de harmonia para score >= 80
  const sortUsuarioFn = (a: AnaliseNomeSocial, b: AnaliseNomeSocial) => {
    if (a.score >= 80 && b.score >= 80) {
      const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
      const rA = compRank[a.compatibilidade] ?? 1;
      const rB = compRank[b.compatibilidade] ?? 1;
      if (rA !== rB) return rB - rA;
    }
    if (a.score !== b.score) return b.score - a.score;
    const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
    const rA = compRank[a.compatibilidade] ?? 1;
    const rB = compRank[b.compatibilidade] ?? 1;
    return rB - rA;
  };
  analisesUsuario.sort(sortUsuarioFn);

  // Sugestões do sistema
  const usuariosSet = new Set(analisesUsuario.map(a => a.nomeCompleto.toLowerCase()));
  const sugestoesIA = gerarSugestoesAutoSocial(nomeNascimento, dataNascimento, 5)
    .filter(s => !usuariosSet.has(s.nomeCompleto.toLowerCase()));

  // Selecionar Nome de Ouro: balanceia score >= 80, menor nivel, harmonia e preferência do usuário
  type Candidato = AnaliseNomeSocial & { nivelEfetivo: number };
  const aptos80: Candidato[] = [
    ...analisesUsuario.filter(a => a.score >= 80).map(a => ({ ...a, nivelEfetivo: 0 })),
    ...sugestoesIA.filter(a => a.score >= 80).map(a => ({ ...a, nivelEfetivo: a.nivelGerado ?? 999 })),
  ];

  aptos80.sort((a, b) => {
    // 1. Menor descaracterização (sugestões do usuário = 0, IA = nível gerado)
    if (a.nivelEfetivo !== b.nivelEfetivo) {
      return a.nivelEfetivo - b.nivelEfetivo;
    }

    // 2. Na mesma prioridade, prioriza maior harmonia numerológica (tabela Imagem 2)
    const compRank = { favoravel: 3, neutro: 2, desfavoravel: 1 };
    const rA = compRank[a.compatibilidade] ?? 1;
    const rB = compRank[b.compatibilidade] ?? 1;
    if (rA !== rB) {
      return rB - rA; // Mais favorável primeiro
    }

    // 3. Desempate por score
    return b.score - a.score;
  });

  const melhorNome: AnaliseNomeSocial | null =
    aptos80[0] ?? analisesUsuario[0] ?? sugestoesIA[0] ?? null;

  const todasOrdenadas = [...analisesUsuario, ...sugestoesIA];

  return {
    nomeNascimento,
    dataNascimento,
    destino,
    nomesCandidatos: todasOrdenadas,
    melhorNome,
    top3: todasOrdenadas.filter(a => a !== melhorNome).slice(0, 3),
  };
}
