/**
 * Mapa de Alinhamento Vibracional — Teia Cabalística Contextual (5 eixos).
 * Conecta a matemática verídica da Cabala às respostas do questionário do usuário (área de foco e uso).
 */

import { avaliarNome } from '../../backend/numerology/score';
import { calcularCincoNumeros } from '../../backend/numerology/numbers';
import { calcularTodosTriangulos } from '../../backend/numerology/triangle';
import { avaliarCompatibilidade, type TipoCompatibilidade } from '../../backend/numerology/harmonization';
import { SCORE_CONFIG_V3 } from '../../backend/numerology/score-config';
import type { ReflexoSequencia } from '../../backend/numerology/score';

export type MotorRadarKey =
  | 'expressao'
  | 'motivacao'
  | 'destino'
  | 'harmonia_triangulo'
  | 'sequencias';

export const MOTOR_RADAR_AXIS_ORDER: MotorRadarKey[] = [
  'expressao',
  'motivacao',
  'destino',
  'harmonia_triangulo',
  'sequencias',
];

export const MOTOR_RADAR_LABELS: Record<MotorRadarKey, string> = {
  expressao: 'Foco do Momento',
  motivacao: 'Equilíbrio da Alma',
  destino: 'Sintonia de Destino',
  harmonia_triangulo: 'Magnetismo Social',
  sequencias: 'Fluidez',
};

export interface QuestionnaireContextInput {
  areaFoco?: string | null;
  ondeAssinaRaw?: string[];
  subfocosOrdenados?: string[];
}

export interface MotorRadarAxis {
  key: MotorRadarKey;
  label: string;
  /** 0–100 para leitura humana / testes */
  valuePercent: number;
  /** 0–1 para SVG */
  value: number;
  description?: string;
}

export interface ContextualRadarAxis extends MotorRadarAxis {
  description: string;
}

// ── Matriz de afinidade cabalística por área de foco ──────────────────────────

const AFINIDADE_FOCO: Record<string, Record<number, number>> = {
  carreira_negocios: {
    1: 96, // Liderança e iniciativa
    2: 66, // Cooperação discreta
    3: 84, // Comunicação e vendas
    4: 92, // Método, estrutura e estabilidade
    5: 86, // Agilidade e expansão
    6: 88, // Gestão harmoniosa (alta afinidade profissional)
    7: 74, // Especialista e introspecção
    8: 100, // Autoridade máxima executiva
    9: 72, // Visão humanitária
    11: 95, // Inspiração e liderança visionária
    22: 100, // Construtor de impérios
  },
  prosperidade_financeira: {
    1: 85,
    2: 60,
    3: 88, // Multiplicação e crescimento
    4: 92, // Construção patrimonial
    5: 82,
    6: 84,
    7: 70,
    8: 100, // Fluxo e abundância material
    9: 66,
    11: 86,
    22: 100, // Escala e grande realização
  },
  relacionamentos_harmonia: {
    1: 68,
    2: 100, // Parceria e acolhimento
    3: 88, // Carisma e alegria
    4: 72,
    5: 78,
    6: 100, // Família e harmonia afetiva
    7: 64, // Isolamento
    8: 70,
    9: 95, // Compreensão e altruísmo
    11: 96, // Sintonia profunda
    22: 86,
  },
  autoestima_expressao: {
    1: 100, // Autonomia e autoconfiança
    2: 68,
    3: 100, // Expressão e comunicação
    4: 74,
    5: 96, // Magnetismo e liberdade
    6: 84,
    7: 76,
    8: 90,
    9: 88,
    11: 96,
    22: 92,
  },
};

export const ROTULOS_FOCO: Record<string, string> = {
  carreira_negocios: 'Foco: Carreira',
  prosperidade_financeira: 'Foco: Prosperidade',
  relacionamentos_harmonia: 'Foco: Relações',
  autoestima_expressao: 'Foco: Autoestima',
};

/** Normaliza número para 1–9, 11 ou 22 */
function normalizarNumeroCabalistico(n: number | null | undefined): number {
  if (!n || !Number.isFinite(n) || n <= 0) return 1;
  if (n === 11 || n === 22) return n;
  let v = Math.abs(Math.trunc(n));
  while (v > 9) {
    v = String(v)
      .split('')
      .reduce((sum, d) => sum + Number(d), 0);
    if (v === 11 || v === 22) return v;
  }
  return v;
}

/** Reflexos nos triângulos secundários → 0–100 */
export function harmoniaTrianguloFromReflexos(reflexos: ReflexoSequencia[]): number {
  if (reflexos.length === 0) return 100;
  const cfg = SCORE_CONFIG_V3.sequenciasVida;
  let bruto = 0;
  for (const r of reflexos) {
    const extras = Math.min(
      cfg.maxExtraPorCodigo,
      Math.max(0, r.linhasComSequencia - 1) * cfg.porLinhaExtraMesmoCodigo
    );
    bruto += cfg.porCodigoDistinto + extras;
  }
  const teto = cfg.tetoCategoria;
  const aplicados = Math.min(bruto, teto);
  return Math.round(100 - (aplicados / teto) * 100);
}

/** Converte número cabalístico principal (1–9 / 11 / 22) em 0–100 (mantido para compatibilidade histórica). */
export function cabalisticNumberToPercent(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n === 11 || n === 22) return 100;
  let v = Math.abs(Math.trunc(n));
  while (v > 9) {
    v = String(v)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0);
    if (v === 11 || v === 22) return 100;
  }
  return Math.round((v / 9) * 100);
}

/**
 * Calcula os 5 eixos contextuais do Mapa de Alinhamento Vibracional.
 * Integra a numerologia cabalística e as escolhas do questionário em uma escala contínua de 0 a 100%.
 */
export function computeContextualRadarAxes(
  nomeCompleto: string,
  dataNascimento: string,
  context?: QuestionnaireContextInput | null
): ContextualRadarAxis[] {
  const nome = nomeCompleto.trim();
  const data = dataNascimento.trim();

  const avaliacao = avaliarNome(nome, data);
  const cinco = calcularCincoNumeros(nome, data);
  const todos = calcularTodosTriangulos(nome, data);

  const numExpressao = normalizarNumeroCabalistico(cinco.expressao);
  const numDestino = normalizarNumeroCabalistico(cinco.destino);
  const numMotivacao = normalizarNumeroCabalistico(cinco.motivacao);
  const numImpressao = normalizarNumeroCabalistico(cinco.impressao);
  const numMissao = normalizarNumeroCabalistico(cinco.missao);

  // 1. Extração de bloqueios por tema no Triângulo da Vida
  const bloqueiosVida = todos.vida.sequenciasNegativas ?? [];
  const temBloqueioMaterial = bloqueiosVida.some((b) => b.includes('444') || b.includes('888') || b.includes('555'));
  const temBloqueioRelacoes = bloqueiosVida.some((b) => b.includes('222') || b.includes('666') || b.includes('777'));
  const temBloqueioExpressao = bloqueiosVida.some((b) => b.includes('111') || b.includes('333') || b.includes('999'));

  // ── Eixo 1: Foco do Momento & Expressão (Topo) ───────────────────────────
  const areaFoco = context?.areaFoco ?? null;
  const focoLabel = areaFoco && ROTULOS_FOCO[areaFoco] ? ROTULOS_FOCO[areaFoco] : 'Foco do Momento';

  let baseFoco = 84;
  if (areaFoco && AFINIDADE_FOCO[areaFoco]) {
    baseFoco = AFINIDADE_FOCO[areaFoco][numExpressao] ?? 80;
  } else {
    const compatGeral = avaliarCompatibilidade(numExpressao, numDestino);
    baseFoco = compatGeral === 'favoravel' ? 94 : compatGeral === 'neutro' ? 80 : 64;
  }

  // Penalidade de bloqueios que atingem a área declarada
  let penalidadeFoco = 0;
  if (areaFoco === 'carreira_negocios' || areaFoco === 'prosperidade_financeira') {
    if (temBloqueioMaterial) penalidadeFoco += 32;
    penalidadeFoco += Math.min(24, bloqueiosVida.length * 8);
  } else if (areaFoco === 'relacionamentos_harmonia') {
    if (temBloqueioRelacoes) penalidadeFoco += 32;
    penalidadeFoco += Math.min(24, bloqueiosVida.length * 8);
  } else if (areaFoco === 'autoestima_expressao') {
    if (temBloqueioExpressao) penalidadeFoco += 32;
    penalidadeFoco += Math.min(24, bloqueiosVida.length * 8);
  } else {
    penalidadeFoco += Math.min(40, bloqueiosVida.length * 10);
  }

  const focoPct = Math.max(18, Math.min(100, Math.round(baseFoco - penalidadeFoco)));
  const focoDesc = `Expressão ${numExpressao} ${penalidadeFoco > 0 ? `com resistência de ${bloqueiosVida.length} bloqueio(s)` : 'em sintonia direta'}`;

  // ── Eixo 2: Fluidez (Zero Bloqueios) (Topo-Esquerda) ─────────────────────
  // O Triângulo da Vida é o canal principal. Se houver sequências na Vida, a fluidez cai.
  let fluidezPct = 100;
  if (bloqueiosVida.length > 0) {
    const seqPontos = avaliacao.descontos
      .filter((d) => d.categoria === 'sequencias_vida' && d.codigo !== 'TETO')
      .reduce((s, d) => s + d.pontos, 0);
    // Cada ponto de bloqueio na Vida reduz drasticamente o fluxo
    fluidezPct = Math.max(20, Math.min(85, Math.round(100 - (seqPontos * 3.6 + bloqueiosVida.length * 8))));
  }
  const fluidezDesc = bloqueiosVida.length === 0 ? 'Canais do Triângulo da Vida desobstruídos (100%)' : `${bloqueiosVida.length} bloqueio(s) ativos gerando atrito no fluxo`;

  // ── Eixo 3: Sintonia de Destino (Baixo-Direita) ───────────────────────────
  // Compatibilidade cabalística formal entre Expressão e Destino
  const compatDestino = avaliarCompatibilidade(numExpressao, numDestino);
  let destinoPct = 78;
  if (compatDestino === 'favoravel') {
    destinoPct = 95;
    if (numMissao === numDestino || numMissao === numExpressao || numMissao === 11 || numMissao === 22) {
      destinoPct = 99;
    }
  } else if (compatDestino === 'neutro') {
    destinoPct = 76;
  } else {
    // Tensão vibracional
    destinoPct = 46;
  }
  const destinoDesc = `Expressão ${numExpressao} × Destino ${numDestino} (${compatDestino === 'favoravel' ? 'Harmônica' : compatDestino === 'neutro' ? 'Neutra' : 'Tensão Vibracional'})`;

  // ── Eixo 4: Magnetismo Social (Baixo-Esquerda) ────────────────────────────
  // Triângulo Social livre de reflexos + vibração da Impressão no canal onde assina
  const reflexosSociais = (todos.social.sequenciasNegativas ?? []).length;
  const baseSocial = Math.max(30, 100 - reflexosSociais * 20);
  const canalUso = context?.ondeAssinaRaw?.[0] ?? 'geral';
  let afinidadeCanal = 82;
  if (canalUso.includes('contrato') || canalUso.includes('documento')) {
    afinidadeCanal = [1, 4, 8, 22].includes(numImpressao) ? 96 : 74;
  } else if (canalUso.includes('rede') || canalUso.includes('social')) {
    afinidadeCanal = [3, 5, 1, 9].includes(numImpressao) ? 96 : 78;
  } else if (canalUso.includes('marca') || canalUso.includes('negocio')) {
    afinidadeCanal = [1, 8, 3, 22].includes(numImpressao) ? 98 : 74;
  } else {
    afinidadeCanal = [1, 3, 8].includes(numImpressao) ? 92 : 80;
  }
  const socialPct = Math.max(25, Math.min(100, Math.round(baseSocial * 0.55 + afinidadeCanal * 0.45)));
  const socialDesc = `Impressão ${numImpressao} no canal social com ${reflexosSociais === 0 ? 'zero reflexos' : `${reflexosSociais} reflexo(s)`}`;

  // ── Eixo 5: Equilíbrio da Alma (Topo-Direita) ─────────────────────────────
  // Motivação interior (vogais) + Triângulo Pessoal livre de reflexos
  const reflexosPessoais = (todos.pessoal.sequenciasNegativas ?? []).length;
  const basePessoal = Math.max(30, 100 - reflexosPessoais * 20);
  const compatAlma = avaliarCompatibilidade(numMotivacao, numExpressao);
  const ressonanciaAlma = compatAlma === 'favoravel' ? 96 : compatAlma === 'neutro' ? 80 : 54;
  const almaPct = Math.max(25, Math.min(100, Math.round(basePessoal * 0.5 + ressonanciaAlma * 0.5)));
  const almaDesc = `Motivação ${numMotivacao} ${compatAlma === 'favoravel' ? 'em ressonância plena com a Expressão' : 'em busca de integração'}`;

  return [
    {
      key: 'expressao',
      label: focoLabel,
      valuePercent: focoPct,
      value: Math.max(0.08, Math.min(1, focoPct / 100)),
      description: focoDesc,
    },
    {
      key: 'motivacao',
      label: 'Equilíbrio da Alma',
      valuePercent: almaPct,
      value: Math.max(0.08, Math.min(1, almaPct / 100)),
      description: almaDesc,
    },
    {
      key: 'destino',
      label: 'Sintonia de Destino',
      valuePercent: destinoPct,
      value: Math.max(0.08, Math.min(1, destinoPct / 100)),
      description: destinoDesc,
    },
    {
      key: 'harmonia_triangulo',
      label: 'Magnetismo Social',
      valuePercent: socialPct,
      value: Math.max(0.08, Math.min(1, socialPct / 100)),
      description: socialDesc,
    },
    {
      key: 'sequencias',
      label: 'Fluidez',
      valuePercent: fluidezPct,
      value: Math.max(0.08, Math.min(1, fluidezPct / 100)),
      description: fluidezDesc,
    },
  ];
}

/**
 * Função mantida para compatibilidade direta. Invoca computeContextualRadarAxes.
 */
export function computeMotorRadarAxes(
  nomeCompleto: string,
  dataNascimento: string,
  context?: QuestionnaireContextInput | null
): MotorRadarAxis[] {
  return computeContextualRadarAxes(nomeCompleto, dataNascimento, context);
}

export function motorRadarToRecord(axes: MotorRadarAxis[]): Record<MotorRadarKey, number> {
  return Object.fromEntries(axes.map((a) => [a.key, a.value])) as Record<MotorRadarKey, number>;
}

export function getRadarAxisLabels(areaFoco?: string | null): Record<MotorRadarKey, string> {
  const topLabel = areaFoco && ROTULOS_FOCO[areaFoco] ? ROTULOS_FOCO[areaFoco] : 'Foco do Momento';
  return {
    expressao: topLabel,
    motivacao: 'Equilíbrio da Alma',
    destino: 'Sintonia de Destino',
    harmonia_triangulo: 'Magnetismo Social',
    sequencias: 'Fluidez',
  };
}
