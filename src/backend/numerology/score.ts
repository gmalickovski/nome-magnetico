/**
 * Score Unificado — v1 (legado) e v3 (motor NM v3 · DEV-185).
 */

import { calcularTodosTriangulos, type Triangulo, type Bloqueio, type TodosTriangulos } from './triangle';

import { calcularExpressao, calcularDestino, calcularMotivacao } from './numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos, type DebitoCarmicoInfo, type DebitoFonte } from './karmic';
import { createRequire } from 'node:module';
import { avaliarCompatibilidade, type TipoCompatibilidade } from './harmonization';
import { SCORE_CONFIG_V3, SCORE_VERSION_V3 } from './score-config';
import { isScoreV3 } from './score-version';

const require = createRequire(import.meta.url);

function listarCandidatosPotencial(nomeNascimento: string): string[] {
  const { listarNomesCandidatosGerador } = require('./products/nome-social') as typeof import('./products/nome-social');
  return listarNomesCandidatosGerador(nomeNascimento);
}

// ── v1 (comportamento histórico) ─────────────────────────────────────────────

export interface ScoreParams {
  bloqueios: number;
  licoesCarmicas: number;
  tendenciasOcultas: number;
  debitosCarmicos: number;
  debitosCarmicoFixos?: number;
  ocorrenciasExtras?: number;
  compatibilidade: 'favoravel' | 'neutro' | 'desfavoravel';
  compatibilidadeSecundaria?: 'favoravel' | 'neutro' | 'desfavoravel';
}

const COMPAT_PENALTY_V1: Record<string, number> = {
  favoravel: 0,
  neutro: -5,
  desfavoravel: -15,
};

export function calcularScoreV1(p: ScoreParams): number {
  let score = 100;

  score -= p.bloqueios * 15;
  score -= (p.ocorrenciasExtras ?? 0) * 3;
  score -= p.debitosCarmicos * 12;
  score -= p.tendenciasOcultas * 2;
  score -= p.licoesCarmicas * 1;
  score += COMPAT_PENALTY_V1[p.compatibilidade] ?? -15;

  if (p.compatibilidadeSecundaria !== undefined) {
    score += Math.round((COMPAT_PENALTY_V1[p.compatibilidadeSecundaria] ?? -15) / 2);
  }

  return Math.max(0, Math.min(100, score));
}

/** Alias do score v1 — comportamento idêntico ao histórico. */
export const calcularScore = calcularScoreV1;

/** Padrão das APIs / PDF / teste-bloqueio (main): sem `ocorrenciasExtras`. */
export function calcularScoreV1SemOcorrenciasExtras(params: {
  bloqueios: Bloqueio[];
  licoesCarmicas: number;
  tendenciasOcultas: number;
  debitosCarmicos: DebitoCarmicoInfo[];
  compatibilidade: TipoCompatibilidade;
}): number {
  return calcularScoreV1({
    bloqueios: params.bloqueios.length,
    licoesCarmicas: params.licoesCarmicas,
    tendenciasOcultas: params.tendenciasOcultas,
    debitosCarmicos: params.debitosCarmicos.length,
    debitosCarmicoFixos: params.debitosCarmicos.filter(d => d.fixo).length,
    compatibilidade: params.compatibilidade,
  });
}

/** Padrão nome-social (main): com `ocorrenciasExtras` por repetição de bloqueio. */
export function calcularScoreV1ComOcorrenciasExtras(params: {
  bloqueios: Bloqueio[];
  licoesCarmicas: number;
  tendenciasOcultas: number;
  debitosCarmicos: DebitoCarmicoInfo[];
  compatibilidade: TipoCompatibilidade;
}): number {
  const totalOcorrencias = params.bloqueios.reduce((sum, b) => sum + b.totalOcorrencias, 0);
  const ocorrenciasExtras = Math.max(0, totalOcorrencias - params.bloqueios.length);
  return calcularScoreV1({
    bloqueios: params.bloqueios.length,
    ocorrenciasExtras,
    licoesCarmicas: params.licoesCarmicas,
    tendenciasOcultas: params.tendenciasOcultas,
    debitosCarmicos: params.debitosCarmicos.length,
    debitosCarmicoFixos: params.debitosCarmicos.filter(d => d.fixo).length,
    compatibilidade: params.compatibilidade,
  });
}

export function calcularScoreTeto(debitosFixos: number): number {
  return Math.max(0, 100 - debitosFixos * 12);
}

// ── v3 ───────────────────────────────────────────────────────────────────────

export interface DescontoRegra {
  categoria: string;
  codigo: string;
  pontos: number;
  tetoCategoria: number;
  fonte?: string;
  detalhe?: string;
}

export interface MarcaDaDataItem {
  numero: number;
  fontes: DebitoFonte[];
  titulo: string;
}

export interface ReflexoSequencia {
  codigo: string;
  triangulo: 'pessoal' | 'social' | 'destino';
  linhasComSequencia: number;
}

export interface AvaliacaoScoreNome {
  score_version: typeof SCORE_VERSION_V3;
  score_v3: number;
  nivel: { codigo: string; rotulo: string };
  descontos: DescontoRegra[];
  marcaDaData: MarcaDaDataItem[];
  /** Igual a score_v3 quando potencial não foi calculado. */
  potencial: number;
  reflexos: ReflexoSequencia[];
}

function aplicarTetoCategoria(pontos: number, teto: number): { aplicados: number; tetoAtingido: boolean } {
  if (teto <= 0 && pontos > 0) return { aplicados: 0, tetoAtingido: true };
  return { aplicados: Math.min(pontos, teto), tetoAtingido: pontos > teto };
}

function nivelFromScore(score: number): { codigo: string; rotulo: string } {
  for (const n of SCORE_CONFIG_V3.niveis) {
    if (score >= n.min && score <= n.max) {
      return { codigo: n.codigo, rotulo: n.rotulo };
    }
  }
  return { codigo: 'N1', rotulo: 'Em Tensão' };
}

function descontosSequenciasVida(vida: Triangulo): { pontos: number; linhas: DescontoRegra[] } {
  const cfg = SCORE_CONFIG_V3.sequenciasVida;
  const linhas: DescontoRegra[] = [];
  let bruto = 0;
  const contagem = vida.contagemSequencias ?? {};

  for (const [codigo, qtdLinhas] of Object.entries(contagem)) {
    const extras = Math.min(
      cfg.maxExtraPorCodigo,
      Math.max(0, qtdLinhas - 1) * cfg.porLinhaExtraMesmoCodigo,
    );
    const pontos = cfg.porCodigoDistinto + extras;
    bruto += pontos;
    linhas.push({
      categoria: 'sequencias_vida',
      codigo,
      pontos,
      tetoCategoria: cfg.tetoCategoria,
      fonte: 'triangulo_vida',
      detalhe: qtdLinhas > 1 ? `${qtdLinhas} linhas` : '1 linha',
    });
  }

  const { aplicados, tetoAtingido } = aplicarTetoCategoria(bruto, cfg.tetoCategoria);
  if (tetoAtingido && linhas.length > 0) {
    linhas.push({
      categoria: 'sequencias_vida',
      codigo: 'TETO',
      pontos: bruto - aplicados,
      tetoCategoria: cfg.tetoCategoria,
      fonte: 'teto_categoria',
    });
  }

  return { pontos: aplicados, linhas };
}

function descontoCompatibilidade(tipo: TipoCompatibilidade): { pontos: number; linha: DescontoRegra | null } {
  const cfg = SCORE_CONFIG_V3.compatibilidade;
  const pontos = cfg[tipo];
  return {
    pontos,
    linha: pontos > 0
      ? {
          categoria: 'compatibilidade',
          codigo: tipo,
          pontos,
          tetoCategoria: cfg.tetoCategoria,
          fonte: 'expressao_x_destino',
        }
      : null,
  };
}

function descontosDebitos(debitos: DebitoCarmicoInfo[]): {
  pontos: number;
  linhas: DescontoRegra[];
  marcaDaData: MarcaDaDataItem[];
} {
  const cfg = SCORE_CONFIG_V3.debitos;
  const linhas: DescontoRegra[] = [];
  const marcaDaData: MarcaDaDataItem[] = [];
  let bruto = 0;

  for (const d of debitos) {
    if (d.fontesData.length > 0) {
      marcaDaData.push({
        numero: d.numero,
        fontes: d.fontesData,
        titulo: d.titulo,
      });
    }
    if (d.fontesNome.length === 0) continue;

    let pontosDebito = d.fontesNome.length * cfg.porFonteNome;
    if (d.acentuada) pontosDebito += cfg.acentuada;
    bruto += pontosDebito;

    linhas.push({
      categoria: 'debitos',
      codigo: String(d.numero),
      pontos: pontosDebito,
      tetoCategoria: cfg.tetoCategoria,
      fonte: d.fontesNome.join('+'),
      detalhe: d.acentuada ? 'acentuada' : undefined,
    });
  }

  const { aplicados, tetoAtingido } = aplicarTetoCategoria(bruto, cfg.tetoCategoria);
  if (tetoAtingido && bruto > aplicados) {
    linhas.push({
      categoria: 'debitos',
      codigo: 'TETO',
      pontos: bruto - aplicados,
      tetoCategoria: cfg.tetoCategoria,
      fonte: 'teto_categoria',
    });
  }

  return { pontos: aplicados, linhas, marcaDaData };
}

function descontosContagem(
  categoria: 'tendencias_ocultas' | 'licoes_carmicas',
  quantidade: number,
): { pontos: number; linha: DescontoRegra | null } {
  const cfg =
    categoria === 'tendencias_ocultas'
      ? SCORE_CONFIG_V3.tendenciasOcultas
      : SCORE_CONFIG_V3.licoesCarmicas;
  const bruto = quantidade * cfg.porItem;
  const { aplicados } = aplicarTetoCategoria(bruto, cfg.tetoCategoria);
  return {
    pontos: aplicados,
    linha:
      aplicados > 0
        ? {
            categoria,
            codigo: 'contagem',
            pontos: aplicados,
            tetoCategoria: cfg.tetoCategoria,
            fonte: String(quantidade),
          }
        : null,
  };
}

function coletarReflexos(todos: TodosTriangulos): ReflexoSequencia[] {
  const reflexos: ReflexoSequencia[] = [];
  for (const tipo of ['pessoal', 'social', 'destino'] as const) {
    const t = todos[tipo];
    const contagem = t.contagemSequencias ?? {};
    for (const [codigo, linhasComSequencia] of Object.entries(contagem)) {
      reflexos.push({ codigo, triangulo: tipo, linhasComSequencia: Number(linhasComSequencia) });

    }
  }
  return reflexos.sort((a, b) => a.codigo.localeCompare(b.codigo) || a.triangulo.localeCompare(b.triangulo));
}

function calcularScoreV3Interno(
  nomeCompleto: string,
  dataNascimento: string,
): Omit<AvaliacaoScoreNome, 'potencial'> & { potencial?: number } {
  const todos = calcularTodosTriangulos(nomeCompleto, dataNascimento);
  const expressao = calcularExpressao(nomeCompleto);
  const destino = calcularDestino(dataNascimento);
  const motivacao = calcularMotivacao(nomeCompleto);
  const compatibilidade = avaliarCompatibilidade(expressao, destino);

  const licoes = detectarLicoesCarmicas(nomeCompleto);
  const tendencias = detectarTendenciasOcultas(nomeCompleto);
  const debitos = calcularDebitosCarmicos(dataNascimento, destino, motivacao, expressao);

  const descontos: DescontoRegra[] = [];
  const seq = descontosSequenciasVida(todos.vida);
  descontos.push(...seq.linhas.filter(l => l.codigo !== 'TETO' || l.pontos > 0));

  const compat = descontoCompatibilidade(compatibilidade);
  if (compat.linha) descontos.push(compat.linha);

  const deb = descontosDebitos(debitos);
  descontos.push(...deb.linhas.filter(l => l.codigo !== 'TETO' || l.pontos > 0));

  const tend = descontosContagem('tendencias_ocultas', tendencias.length);
  if (tend.linha) descontos.push(tend.linha);

  const lic = descontosContagem('licoes_carmicas', licoes.length);
  if (lic.linha) descontos.push(lic.linha);

  const totalDesconto =
    seq.pontos + compat.pontos + deb.pontos + tend.pontos + lic.pontos;
  const score_v3 = Math.max(
    SCORE_CONFIG_V3.piso,
    Math.min(SCORE_CONFIG_V3.base, SCORE_CONFIG_V3.base - totalDesconto),
  );

  return {
    score_version: SCORE_VERSION_V3,
    score_v3,
    nivel: nivelFromScore(score_v3),
    descontos,
    marcaDaData: deb.marcaDaData,
    reflexos: coletarReflexos(todos),
  };
}

/** Melhor score v3 entre variantes do gerador (chamar no máximo 1× por análise). */
export function calcularPotencialV3(nomeNascimento: string, dataNascimento: string): number {
  const base = calcularScoreV3Interno(nomeNascimento.trim(), dataNascimento).score_v3;
  let potencial = base;
  for (const candidato of listarCandidatosPotencial(nomeNascimento)) {
    const alt = calcularScoreV3Interno(candidato, dataNascimento).score_v3;
    if (alt > potencial) potencial = alt;
  }
  return potencial;
}

/**
 * Avaliação v3 (sem potencial por padrão — use calcularPotencialV3 uma vez se precisar).
 */
export function avaliarNome(
  nomeCompleto: string,
  dataNascimento: string,
  opts?: { potencial?: number },
): AvaliacaoScoreNome {
  const core = calcularScoreV3Interno(nomeCompleto.trim(), dataNascimento);
  return {
    ...core,
    potencial: opts?.potencial ?? core.score_v3,
  };
}

/**
 * Gravação: `score` = v1 legado (parâmetros do caller); colunas v3 só com flag v3.
 */
export function persistenciaScoreFields(input: {
  scoreLegado: number;
  nomeParaV3: string;
  dataNascimento: string;
  /** Nome de nascimento para potencial (padrão: nomeParaV3). */
  nomeNascimentoPotencial?: string;
}) {
  const { scoreLegado, nomeParaV3, dataNascimento, nomeNascimentoPotencial } = input;
  if (!isScoreV3()) {
    return { score: scoreLegado };
  }
  const avaliacao = avaliarNome(nomeParaV3, dataNascimento);
  const potencial = calcularPotencialV3(
    nomeNascimentoPotencial ?? nomeParaV3,
    dataNascimento,
  );
  return {
    score: scoreLegado,
    ...camposScoreAnaliseV3({ ...avaliacao, potencial }),
  };
}

export function camposScoreAnaliseV3(avaliacao: AvaliacaoScoreNome): {
  score_version: string;
  score_v3: number;
  nivel: string;
  potencial: number;
  score_detalhe: DescontoRegra[];
} {
  return {
    score_version: avaliacao.score_version,
    score_v3: avaliacao.score_v3,
    nivel: `${avaliacao.nivel.codigo} ${avaliacao.nivel.rotulo}`,
    potencial: avaliacao.potencial,
    score_detalhe: avaliacao.descontos,
  };
}
