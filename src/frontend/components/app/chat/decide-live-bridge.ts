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

export interface ChatCollectState {
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

const AREA_OPTIONS = [
  { id: 'prosperidade_financeira', label: 'Finanças e prosperidade' },
  { id: 'carreira_negocios', label: 'Carreira e negócios' },
  { id: 'relacionamentos_harmonia', label: 'Relacionamentos' },
  { id: 'autoestima_expressao', label: 'Autoestima e expressão' },
] as const;

const ONDE_OPTIONS = [
  { id: 'identidade_registro', label: 'Documentos e Gov.br' },
  { id: 'presenca_digital', label: 'Redes sociais' },
  { id: 'rotina_trabalho', label: 'Trabalho e contratos' },
  { id: 'marca_autoria', label: 'Marca pessoal e criação' },
] as const;

const ESTILO_OPTIONS = [
  { id: 'sobrenome_forte', label: 'Sobrenome forte, sem acento extra' },
  { id: 'ajuste_sutil', label: 'Ajuste sutil com acento' },
  { id: 'curto_direto', label: 'Nome curto e direto' },
  { id: 'qualquer', label: 'Tanto faz, o melhor score' },
] as const;

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

type RawDecideLiveResponse = {
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

export function buildSobrenomePillOptions(sobrenomes: string[]): Array<{ id: string; label: string }> {
  const unique = sobrenomes.map((s) => s.trim()).filter(Boolean);
  if (unique.length === 0) return [];

  const options = unique.map((s) => ({
    id: `sob_keep_${s.toLowerCase().replace(/\s+/g, '_')}`,
    label: `Manter ${s}`,
  }));

  if (unique.length > 1) {
    options.push({
      id: 'sob_keep_all',
      label: `Manter ${unique.join(' e ')}`,
    });
  }

  return options;
}

export function mapApiPanel(api: ApiPanel): ResultPanelData {
  return {
    nome: api.nomeExibido,
    score: api.score,
    expressao: api.expressao,
    destino: api.destino,
    motivacao: api.motivacao,
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

function mapRadarAxes(
  axes: RawDecideLiveResponse['radarAxes']
): RadarAxesData | null {
  if (!axes || axes.length === 0) return null;
  const record = Object.fromEntries(axes.map((a) => [a.key, a.value])) as RadarAxesData;
  return {
    momento: record.momento ?? 0.2,
    objetivo: record.objetivo ?? 0.2,
    uso: record.uso ?? 0.2,
    apego_sobrenome: record.apego_sobrenome ?? 0.5,
    urgencia: record.urgencia ?? 0.3,
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
    panel: raw.panel ? mapApiPanel(raw.panel) : mapApiPanel({
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

function buildNextQuestion(api: RawDecideLiveResponse): NextQuestionSpec | undefined {
  const step = api.next_step;
  if (step === 'fim_coleta') return undefined;

  const basePrompt = api.promptSugestao || 'Conte um pouco mais para continuarmos.';

  if (step === 'palpite') {
    return {
      id: step,
      tipo: 'palpite',
      prompt: basePrompt,
      eyebrow: api.eyebrow || 'Será que é isso?',
      palpiteTexto: api.reading || api.palpiteTexto || basePrompt,
    };
  }

  if (step === 'onde_vai_usar') {
    return {
      id: step,
      tipo: 'escolha',
      prompt: basePrompt,
      eyebrow: api.eyebrow,
      options: ONDE_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
    };
  }

  if (step === 'foco_momento') {
    return {
      id: step,
      tipo: 'escolha',
      prompt: basePrompt,
      eyebrow: api.eyebrow || 'Uma pergunta para entendermos melhor',
      options: AREA_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
    };
  }

  if (step === 'formato_preferido') {
    return {
      id: step,
      tipo: 'escolha',
      prompt: basePrompt,
      eyebrow: api.eyebrow || 'Só mais um detalhe',
      options: ESTILO_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
    };
  }

  if (step === 'sobrenomes') {
    const pillOptions = buildSobrenomePillOptions(api.sobrenomesDetectados ?? []);
    return {
      id: step,
      tipo: 'texto',
      prompt: basePrompt,
      eyebrow: api.eyebrow || 'Sobrenomes na assinatura',
      options: pillOptions.length > 0 ? pillOptions : undefined,
    };
  }

  return {
    id: step,
    tipo: 'texto',
    prompt: basePrompt,
    eyebrow: api.eyebrow,
  };
}

export function mapDecideLiveResponse(raw: RawDecideLiveResponse): DecideLiveResponse {
  const summary: ReadingSummaryItem[] =
    raw.diagramNodes?.map((node) => ({
      label: node.eyebrow,
      value: node.label,
    })) ?? [];

  return {
    next_step: raw.next_step,
    remaining: raw.remaining,
    reading:
      raw.next_step === 'palpite' || raw.areaFoco
        ? raw.reading || raw.palpiteTexto || ''
        : '',
    radarAxes: mapRadarAxes(raw.radarAxes),
    summary,
    readingSummary: raw.readingSummary,
    panel: raw.panel ? mapApiPanel(raw.panel) : undefined,
    previewTop3: (raw.previewTop3 ?? []).map(mapCandidate),
    providerUsed: raw.providerUsed,
    next_question: buildNextQuestion(raw),
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
    area_foco_chip: collect.areaFoco ?? undefined,
    onde_assina: collect.ondeAssina.length > 0 ? collect.ondeAssina : undefined,
    sobrenomes_obrigatorios:
      collect.sobrenomesObrigatorios.length > 0 ? collect.sobrenomesObrigatorios : undefined,
    sobrenomes_excluidos:
      collect.sobrenomesExcluidos.length > 0 ? collect.sobrenomesExcluidos : undefined,
    estilo_preferido: collect.estiloPreferido ?? undefined,
    subfoco_momento: collect.subfocoMomento ?? undefined,
    palpite_status: collect.palpiteStatus ?? undefined,
    sobrenomes_decididos: collect.sobrenomesDecididos || undefined,
  };
}

export function applyAnswerToCollectState(
  prev: ChatCollectState,
  stepId: string,
  text: string,
  optionId?: string,
  sobrenomesDetectados: string[] = []
): ChatCollectState {
  const next = { ...prev };

  if (stepId === 'sobrenomes') {
    next.sobrenomesDecididos = true;
    const lower = text.toLowerCase();
    for (const sob of sobrenomesDetectados) {
      const sobLower = sob.toLowerCase();
      if (
        lower.includes(`sem ${sobLower}`) ||
        lower.includes(`retirar ${sobLower}`) ||
        lower.includes(`tirar ${sobLower}`)
      ) {
        if (!next.sobrenomesExcluidos.includes(sob)) next.sobrenomesExcluidos.push(sob);
      } else if (lower.includes(sobLower)) {
        if (!next.sobrenomesObrigatorios.includes(sob)) next.sobrenomesObrigatorios.push(sob);
      }
    }
    if (text.trim().length > 2) {
      next.objetivoTexto = text.trim();
    }
    return next;
  }

  if (stepId === 'onde_vai_usar') {
    const id = optionId ?? text;
    const canal = ONDE_OPTIONS.find((o) => o.id === id || o.label === text)?.id;
    if (canal && !next.ondeAssina.includes(canal)) {
      next.ondeAssina = [...next.ondeAssina, canal];
    }
    return next;
  }

  if (stepId === 'foco_momento') {
    const id = optionId ?? text;
    const area = AREA_OPTIONS.find((o) => o.id === id || o.label === text)?.id;
    if (area) next.areaFoco = area;
    if (text.trim().length > 2) next.objetivoTexto = text.trim();
    return next;
  }

  if (stepId === 'formato_preferido') {
    const id = optionId ?? text;
    const estilo = ESTILO_OPTIONS.find((o) => o.id === id || o.label === text)?.id;
    if (estilo) next.estiloPreferido = estilo;
    return next;
  }

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
  return collect.ondeAssina.length > 0 || Boolean(collect.areaFoco) || Boolean(collect.palpiteStatus);
}

export function shouldShowSummary(items: ReadingSummaryItem[]): boolean {
  return items.length > 0;
}

export { buildNextQuestion };
