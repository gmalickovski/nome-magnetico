/**
 * Ponte entre o chat v2 (DEV-235) e POST /api/decide-live.
 */

import type {
  CandidateSuggestion,
  ChatReadingSummary,
  DecideLiveResponse,
  NextQuestionSpec,
  RadarAxesData,
  ReadingSummaryItem,
  ResultPanelData,
} from './chat-types.js';
import {
  getQuestionSpec,
  isQuestionnaireStep,
  mapOndeAssinaToApi,
  mapSubfocoToEnum,
  type QuestionnaireStepId,
} from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import type { AreaFocoNomeMagnetico } from '../../../../shared/interactive-engine/copy.js';
import {
  applySobrenomesUsoSelection,
  mapAberturaToEstilo,
  mergeContextoLeitura,
} from '../../../../shared/interactive-engine/questionnaire-map.js';

export interface ChatCollectState {
  nomeUsoBase: string | null;
  relacaoNome: string | null;
  ondeAssinaRaw: string[];
  estiloPresenca: string[];
  subfocosOrdenados: string[];
  aberturaMudanca: string | null;
  nomeArtistico: string | null;
  contextoLeitura: string[];
  sobrenomesDecididos: boolean;
  sobrenomesObrigatorios: string[];
  sobrenomesExcluidos: string[];
  ondeAssina: string[];
  areaFoco: string | null;
  subfocoMomento: string | null;
  estiloPreferido: string | null;
  palpiteStatus: 'acertou' | 'parcial' | 'nao' | null;
  objetivoTexto: string;
}

export function isProfileCollectionComplete(nextStep: string): boolean {
  return nextStep === 'fim_coleta' || nextStep === 'conclusao';
}

export const INITIAL_COLLECT_STATE: ChatCollectState = {
  nomeUsoBase: null,
  relacaoNome: null,
  ondeAssinaRaw: [],
  estiloPresenca: [],
  subfocosOrdenados: [],
  aberturaMudanca: null,
  nomeArtistico: null,
  contextoLeitura: [],
  sobrenomesDecididos: false,
  sobrenomesObrigatorios: [],
  sobrenomesExcluidos: [],
  ondeAssina: [],
  areaFoco: null,
  subfocoMomento: null,
  estiloPreferido: null,
  palpiteStatus: null,
  objetivoTexto: '',
};

type ApiPanel = {
  nomeExibido: string;
  score: number;
  potencial: number;
  destino: number;
  expressao: number;
  motivacao: number;
  missao: number;
  impressao: number;
  bloqueiosCount: number;
  bloqueiosCodigos: string[];
  compatibilidade?: string;
  trianguloVidaLinhas?: number[][];
};

export type RawDecideLiveResponse = {
  next_step: string;
  remaining: number;
  reading?: string;
  palpiteTexto?: string;
  promptSugestao?: string;
  eyebrow?: string;
  panel?: ApiPanel;
  radarAxes?: Array<{ key: string; label: string; value: number }>;
  previewTop3?: Array<Record<string, unknown> & { nomeCompleto: string; panel?: ApiPanel }>;
  diagramNodes?: Array<{ label: string; eyebrow: string }>;
  subfocoMomento?: string;
  areaFoco?: string;
  providerUsed?: string;
  readingSummary?: ChatReadingSummary;
  sobrenomesDetectados?: string[];
  error?: string;
};

/** @deprecated use buildSobrenomesUsoOptions via questionário */
export function buildSobrenomePillOptions(sobrenomes: string[]): Array<{ id: string; label: string }> {
  return sobrenomes.map((s) => ({
    id: `sob_${s.toLowerCase().replace(/\s+/g, '_')}`,
    label: s,
  }));
}

export function mapApiPanel(api: ApiPanel): ResultPanelData {
  return {
    nome: api.nomeExibido,
    score: api.score,
    expressao: api.expressao,
    destino: api.destino,
    motivacao: api.motivacao,
    missao: api.missao,
    impressao: api.impressao,
    potencial: api.potencial,
    bloqueiosCount: api.bloqueiosCount,
    bloqueios: api.bloqueiosCodigos.map((codigo) => ({
      codigo,
      titulo: `Sequência ${codigo}`,
    })),
    trianguloVida: {
      topo: api.trianguloVidaLinhas?.[0]?.[0] ?? 0,
      base: api.trianguloVidaLinhas?.[0]?.slice(1) ?? [],
    },
    compatibilidade: api.compatibilidade,
  };
}

function mapRadarAxes(axes: RawDecideLiveResponse['radarAxes']): RadarAxesData | null {
  if (!axes || axes.length === 0) return null;
  const record = Object.fromEntries(axes.map((a) => [a.key, a.value])) as RadarAxesData;
  return {
    expressao: record.expressao ?? 0.35,
    motivacao: record.motivacao ?? 0.35,
    destino: record.destino ?? 0.35,
    harmonia_triangulo: record.harmonia_triangulo ?? 0.35,
    sequencias: record.sequencias ?? 0.35,
  };
}

function mapCandidate(
  raw: Record<string, unknown> & { nomeCompleto: string; panel?: ApiPanel }
): CandidateSuggestion {
  const score = Number(raw.score ?? 0);
  const bloqueios = Array.isArray(raw.bloqueios) ? raw.bloqueios : [];
  return {
    id: raw.nomeCompleto.trim().toLowerCase().replace(/\s+/g, '-'),
    nome: raw.nomeCompleto,
    score,
    expressao: Number(raw.expressao ?? 0),
    compatibilidade: String(raw.compatibilidade ?? 'neutro'),
    bloqueiosEliminados: 0,
    bloqueiosRestantes: bloqueios.length,
    arcanosPositivos: 0,
    dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
    panel: raw.panel
      ? mapApiPanel(raw.panel)
      : mapApiPanel({
          nomeExibido: raw.nomeCompleto,
          score,
          potencial: score,
          destino: Number(raw.destino ?? 0),
          expressao: Number(raw.expressao ?? 0),
          motivacao: Number(raw.motivacao ?? 0),
          missao: Number(raw.missao ?? 0),
          impressao: Number(raw.impressao ?? 0),
          bloqueiosCount: bloqueios.length,
          bloqueiosCodigos: bloqueios.map((b: { codigo?: string }) => b.codigo ?? ''),
        }),
  };
}

export function buildNextQuestion(
  api: RawDecideLiveResponse,
  nomeCompleto: string,
  collect: ChatCollectState,
  sobrenomesDetectados: string[] = []
): NextQuestionSpec | undefined {
  const step = api.next_step;
  if (step === 'fim_coleta') return undefined;

  const basePrompt = api.promptSugestao || 'Conte um pouco mais para continuarmos.';

  if (step === 'palpite') {
    const palpiteBody = api.reading || api.palpiteTexto || '';
    return {
      id: step,
      tipo: 'palpite',
      prompt: palpiteBody,
      eyebrow: api.eyebrow || 'Será que é isso?',
      palpiteTexto: '',
    };
  }

  if (isQuestionnaireStep(step)) {
    const spec = getQuestionSpec(step, {
      nomeCompleto,
      sobrenomes: sobrenomesDetectados,
      areaFoco: (collect.areaFoco as AreaFocoNomeMagnetico) ?? null,
    });
    const caption =
      spec.mode === 'multi'
        ? spec.maxSelect != null && spec.captionMultiLimit
          ? spec.captionMultiLimit(spec.maxSelect)
          : spec.captionMulti
        : undefined;

    return {
      id: step,
      tipo: 'questionnaire',
      prompt: basePrompt || spec.prompt,
      eyebrow: api.eyebrow,
      options: spec.staticOptions,
      mode: spec.mode,
      maxSelect: spec.maxSelect,
      minSelect: spec.minSelect,
      allowOther: spec.allowOther,
      otherMaxLength: spec.otherMaxLength,
      caption,
      needsArtisticName:
        step === 'onde_assina' &&
        collect.ondeAssinaRaw.some((id) => id === 'redes_sociais' || id === 'marca_negocio'),
    };
  }

  return {
    id: step,
    tipo: 'texto',
    prompt: basePrompt,
    eyebrow: api.eyebrow,
  };
}

export function mapDecideLiveResponse(
  raw: RawDecideLiveResponse,
  ctx?: { nomeCompleto: string; collect: ChatCollectState; sobrenomesDetectados?: string[] }
): DecideLiveResponse {
  const summary: ReadingSummaryItem[] =
    raw.diagramNodes?.map((node) => ({
      label: node.eyebrow,
      value: node.label,
    })) ?? [];

  return {
    next_step: raw.next_step,
    remaining: raw.remaining,
    reading: raw.next_step === 'palpite' ? raw.reading || raw.palpiteTexto || '' : '',
    radarAxes: mapRadarAxes(raw.radarAxes),
    summary,
    readingSummary: raw.readingSummary,
    panel: raw.panel ? mapApiPanel(raw.panel) : undefined,
    previewTop3: (raw.previewTop3 ?? []).map(mapCandidate),
    providerUsed: raw.providerUsed,
    next_question: ctx
      ? buildNextQuestion(raw, ctx.nomeCompleto, ctx.collect, ctx.sobrenomesDetectados ?? [])
      : undefined,
  };
}

export function buildDecideLiveBody(
  nome: string,
  dataNascimento: string,
  collect: ChatCollectState
): Record<string, unknown> {
  return {
    nome_completo: nome.trim(),
    data_nascimento: dataNascimento.trim(),
    objetivo_texto: collect.objetivoTexto,
    contexto_leitura: collect.contextoLeitura.length ? collect.contextoLeitura : undefined,
    area_foco_chip: collect.areaFoco ?? undefined,
    onde_assina: collect.ondeAssina.length > 0 ? collect.ondeAssina : undefined,
    onde_assina_raw: collect.ondeAssinaRaw.length ? collect.ondeAssinaRaw : undefined,
    sobrenomes_obrigatorios:
      collect.sobrenomesObrigatorios.length > 0 ? collect.sobrenomesObrigatorios : undefined,
    sobrenomes_excluidos:
      collect.sobrenomesExcluidos.length > 0 ? collect.sobrenomesExcluidos : undefined,
    estilo_preferido: collect.estiloPreferido ?? undefined,
    subfoco_momento: collect.subfocoMomento ?? undefined,
    palpite_status: collect.palpiteStatus ?? undefined,
    sobrenomes_decididos: collect.sobrenomesDecididos || undefined,
    nome_uso_base: collect.nomeUsoBase ?? undefined,
    relacao_nome: collect.relacaoNome ?? undefined,
    estilo_presenca: collect.estiloPresenca.length ? collect.estiloPresenca : undefined,
    subfocos_ordenados: collect.subfocosOrdenados.length ? collect.subfocosOrdenados : undefined,
    abertura_mudanca: collect.aberturaMudanca ?? undefined,
    nome_artistico: collect.nomeArtistico ?? undefined,
  };
}

export function applyQuestionnaireStep(
  prev: ChatCollectState,
  stepId: QuestionnaireStepId,
  payload: {
    optionIds?: string[];
    labels?: string[];
    otherText?: string;
  },
  sobrenomesDetectados: string[] = []
): ChatCollectState {
  const next = { ...prev };
  const labels = payload.labels ?? [];
  const ids = payload.optionIds ?? [];

  if (stepId === 'nome_uso') {
    const label = labels[0] ?? payload.otherText?.trim() ?? '';
    next.nomeUsoBase = label || next.nomeUsoBase;
    if (payload.otherText?.trim()) {
      next.contextoLeitura = mergeContextoLeitura(
        next.contextoLeitura,
        stepId,
        payload.otherText
      );
    }
    return next;
  }

  if (stepId === 'sobrenomes_uso') {
    const { obrigatorios, excluidos } = applySobrenomesUsoSelection(
      labels,
      sobrenomesDetectados
    );
    next.sobrenomesObrigatorios = obrigatorios;
    next.sobrenomesExcluidos = excluidos;
    next.sobrenomesDecididos = obrigatorios.length > 0;
    return next;
  }

  if (stepId === 'relacao_nome') {
    next.relacaoNome = ids[0] ?? null;
    return next;
  }

  if (stepId === 'onde_assina') {
    next.ondeAssinaRaw = ids;
    next.ondeAssina = mapOndeAssinaToApi(ids);
    return next;
  }

  if (stepId === 'estilo_presenca') {
    next.estiloPresenca = ids;
    return next;
  }

  if (stepId === 'area_foco') {
    next.areaFoco = ids[0] ?? null;
    return next;
  }

  if (stepId === 'subfoco') {
    next.subfocosOrdenados = ids;
    next.subfocoMomento = ids[0] ? mapSubfocoToEnum(ids[0]) : null;
    return next;
  }

  if (stepId === 'abertura_mudanca') {
    next.aberturaMudanca = ids[0] ?? null;
    next.estiloPreferido = mapAberturaToEstilo(next.aberturaMudanca, next.relacaoNome);
    return next;
  }

  return next;
}

export function applyAnswerToCollectState(
  prev: ChatCollectState,
  stepId: string,
  text: string,
  optionId?: string,
  sobrenomesDetectados: string[] = []
): ChatCollectState {
  if (isQuestionnaireStep(stepId)) {
    return applyQuestionnaireStep(
      prev,
      stepId,
      { optionIds: optionId ? [optionId] : [], labels: [text] },
      sobrenomesDetectados
    );
  }

  const next = { ...prev };

  if (stepId === 'palpite' || stepId === 'resposta_palpite') {
    const normalized = text.trim().toLowerCase();
    if (normalized.includes('mosca') || normalized === 'acertou') {
      next.palpiteStatus = 'acertou';
    } else if (normalized.includes('parte') || normalized === 'parcial') {
      next.palpiteStatus = 'parcial';
    } else if (normalized.length > 2) {
      next.palpiteStatus = 'nao';
      next.objetivoTexto = text.trim();
    }
    return next;
  }

  if (text.trim().length > 2) {
    next.objetivoTexto = text.trim();
  }

  return next;
}

export function mergeCollectFromApi(
  prev: ChatCollectState,
  raw: RawDecideLiveResponse
): ChatCollectState {
  return {
    ...prev,
    areaFoco: raw.areaFoco ?? prev.areaFoco,
    subfocoMomento: raw.subfocoMomento ?? prev.subfocoMomento,
  };
}

export function shouldShowRadar(collect: ChatCollectState): boolean {
  return (
    collect.ondeAssina.length > 0 ||
    Boolean(collect.areaFoco) ||
    Boolean(collect.palpiteStatus)
  );
}

export function shouldShowSummary(items: ReadingSummaryItem[]): boolean {
  return items.length > 0;
}
