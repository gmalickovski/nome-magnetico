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
  inferAreaFocoFromText,
  sanitizeOutroText,
} from '../../../../shared/interactive-engine/questionnaire-adaptive.js';
import type {
  AreaFocoNomeMagnetico,
  EstiloAssinaturaPreferido,
} from '../../../../shared/interactive-engine/copy.js';
import {
  applySobrenomesUsoSelection,
  selecionouSoPrimeiroNome,
  mapAberturaToEstilo,
  mergeContextoLeitura,
  profileToPerfilChat,
  profileToRankingOpcoes,
  type RankingOpcoesPatch,
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
  /** DEV-303 */
  preferenciasAssinatura: string[];
  prioridadeConflito: string | null;
  areaFocoOutro: string | null;
  /** DEV-320 (o servidor diz se o fluxo com motivo está ligado). */
  fluxoMotivoAtivo?: boolean;
  motivoHarmonizacao?: string | null;
  areaArtistica?: string | null;
  areaArtisticaOutro?: string | null;
  detalheArtistico?: string[];
  generoPersona?: string | null;
  imagemArtistica?: string[];
  tipoNomeArtistico?: string | null;
  outrosUsos?: string[];
  /** DEV-326 · caminho do bebê */
  bebeSituacao?: string | null;
  bebeDataTipo?: string | null;
  bebeSexo?: string | null;
  bebeData?: string | null;
  bebeSobrenomes?: string[];
  bebeNomesPais?: string[];
  bebeNomeRegistrado?: string | null;
  bebeEstilos?: string[];
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
  preferenciasAssinatura: [],
  prioridadeConflito: null,
  areaFocoOutro: null,
  fluxoMotivoAtivo: false,
  motivoHarmonizacao: null,
  areaArtistica: null,
  areaArtisticaOutro: null,
  detalheArtistico: [],
  generoPersona: null,
  imagemArtistica: [],
  tipoNomeArtistico: null,
  outrosUsos: [],
  bebeSituacao: null,
  bebeDataTipo: null,
  bebeSexo: null,
  bebeData: null,
  bebeSobrenomes: [],
  bebeNomesPais: [],
  bebeNomeRegistrado: null,
  bebeEstilos: [],
};

type ApiPanel = {
  arquetipo?: import('../../../../shared/archetype-summary').ArchetypeSummary;
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
  vidaBloqueiosCodigos?: string[];
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
  semOpcoesElegiveis?: boolean;
  scoreNascimento?: number;
  scoreMinimoSugestao?: number;
  diagramNodes?: Array<{ label: string; eyebrow: string }>;
  subfocoMomento?: string;
  areaFoco?: string;
  providerUsed?: string;
  readingSummary?: ChatReadingSummary;
  sobrenomesDetectados?: string[];
  /** DEV-320 */
  fluxoMotivoAtivo?: boolean;
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
    arquetipo: api.arquetipo,
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
    vidaBloqueiosCodigos: api.vidaBloqueiosCodigos,
    trianguloVida: {
      topo: api.trianguloVidaLinhas?.[0]?.[0] ?? 0,
      base: api.trianguloVidaLinhas?.[0]?.slice(1) ?? [],
    },
    compatibilidade: api.compatibilidade,
  };
}

function mapRadarAxes(axes: RawDecideLiveResponse['radarAxes']): RadarAxesData | null {
  if (!axes || axes.length === 0) return null;
  const record = Object.fromEntries(axes.map((a) => [a.key, a.value])) as unknown as RadarAxesData;
  return {
    expressao: record.expressao ?? 0.35,
    motivacao: record.motivacao ?? 0.35,
    destino: record.destino ?? 0.35,
    harmonia_triangulo: record.harmonia_triangulo ?? 0.35,
    sequencias: record.sequencias ?? 0.35,
  };
}

export function mapCandidate(
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
    maiorNota: raw.maiorNota === true,
    principal: raw.principal === true,
    secao: raw.secao === 'proximo' || raw.secao === 'novo' ? raw.secao : undefined,
    grupoBebe:
      raw.grupoBebe === 'seu' || raw.grupoBebe === 'menina' || raw.grupoBebe === 'menino' || raw.grupoBebe === 'neutro'
        ? raw.grupoBebe
        : undefined,
    diasBons: typeof raw.diasBons === 'number' ? raw.diasBons : undefined,
    diasTotal: typeof raw.diasTotal === 'number' ? raw.diasTotal : undefined,
    destaque: typeof raw.explicacaoPerfil === 'string' ? raw.explicacaoPerfil : undefined,
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
          vidaBloqueiosCodigos: bloqueios
            .filter((b: { codigo?: string; triangulos?: string[] }) =>
              Array.isArray(b.triangulos) ? b.triangulos.includes('vida') : false,
            )
            .map((b: { codigo?: string }) => b.codigo ?? '')
            .filter(Boolean),
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
      areaArtistica: collect.areaArtistica ?? null,
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
    semOpcoesElegiveis: raw.semOpcoesElegiveis ?? false,
    scoreNascimento: raw.scoreNascimento,
    scoreMinimoSugestao: raw.scoreMinimoSugestao,
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
    preferencias_assinatura: collect.preferenciasAssinatura?.length
      ? collect.preferenciasAssinatura
      : undefined,
    prioridade_conflito: collect.prioridadeConflito ?? undefined,
    area_foco_outro: collect.areaFocoOutro ?? undefined,
    // DEV-320
    motivo_harmonizacao: collect.motivoHarmonizacao ?? undefined,
    area_artistica: collect.areaArtistica ?? undefined,
    area_artistica_outro: collect.areaArtisticaOutro ?? undefined,
    detalhe_artistico: collect.detalheArtistico?.length ? collect.detalheArtistico : undefined,
    genero_persona: collect.generoPersona ?? undefined,
    imagem_artistica: collect.imagemArtistica?.length ? collect.imagemArtistica : undefined,
    tipo_nome_artistico: collect.tipoNomeArtistico ?? undefined,
    outros_usos: collect.outrosUsos?.length ? collect.outrosUsos : undefined,
    // DEV-326: só o que o roteador precisa. Nomes e sobrenomes do bebê não vão para o /api/decide-live.
    bebe_situacao: collect.bebeSituacao ?? undefined,
    bebe_data_tipo: collect.bebeDataTipo ?? undefined,
    bebe_sexo: collect.bebeSexo ?? undefined,
    bebe_dados_ok: collect.bebeData ? true : undefined,
    bebe_estilos: collect.bebeEstilos?.length ? collect.bebeEstilos : undefined,
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
    next.sobrenomesDecididos =
      obrigatorios.length > 0 || selecionouSoPrimeiroNome(labels, sobrenomesDetectados);
    return next;
  }

  if (stepId === 'relacao_nome') {
    next.relacaoNome = ids[0] ?? null;
    // DEV-303: "Não me representa" já indica abertura para mudar; a pergunta de abertura é pulada.
    if (next.relacaoNome === 'nao_representa' && !next.aberturaMudanca) {
      next.estiloPreferido = mapAberturaToEstilo(null, next.relacaoNome, next.nomeArtistico);
    }
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
    // DEV-303: "Outro foco" (texto livre, até 60 caracteres) vira a área mais próxima por palavras-chave.
    if (ids[0] === 'nome_outro' || ids[0] === 'area_outro') {
      const texto = sanitizeOutroText(payload.otherText ?? labels[0] ?? '');
      next.areaFocoOutro = texto || null;
      next.areaFoco = inferAreaFocoFromText(texto) ?? 'carreira_negocios';
      next.contextoLeitura = mergeContextoLeitura(next.contextoLeitura, stepId, texto);
      return next;
    }
    next.areaFocoOutro = null;
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
    next.estiloPreferido = mapAberturaToEstilo(next.aberturaMudanca, next.relacaoNome, next.nomeArtistico);
    return next;
  }

  if (stepId === 'preferencias_assinatura') {
    // "Tanto faz" sozinho vale como resposta; junto de outra escolha, vale a escolha.
    const escolhidas = ids.filter((id) => id !== 'tanto_faz');
    next.preferenciasAssinatura = escolhidas.length > 0 ? escolhidas : ['tanto_faz'];
    return next;
  }

  if (stepId === 'prioridade_conflito') {
    next.prioridadeConflito = ids[0] ?? null;
    return next;
  }

  // ── DEV-320 ──
  if (stepId === 'motivo_harmonizacao') {
    next.motivoHarmonizacao = ids[0] ?? null;
    if (next.motivoHarmonizacao === 'bebe') {
      // O caminho do bebê usa os dados do bebê, não o nome do usuário.
      next.bebeSituacao = null;
      next.bebeDataTipo = null;
      next.bebeSexo = null;
      next.bebeData = null;
      next.bebeEstilos = [];
    }
    if (next.motivoHarmonizacao === 'artistico') {
      // O ramo artístico não pergunta onde assina nem a abertura: forma curta e uso criativo.
      next.ondeAssinaRaw = ['arte_criativo'];
      next.ondeAssina = mapOndeAssinaToApi(next.ondeAssinaRaw);
      next.estiloPreferido = 'curto_direto';
    }
    return next;
  }

  if (stepId === 'area_artistica') {
    if (ids[0] === 'area_artistica_outro') {
      const texto = sanitizeOutroText(payload.otherText ?? labels[0] ?? '');
      next.areaArtistica = 'outra';
      next.areaArtisticaOutro = texto || null;
      next.contextoLeitura = mergeContextoLeitura(next.contextoLeitura, stepId, texto);
    } else {
      next.areaArtistica = ids[0] ?? null;
      next.areaArtisticaOutro = null;
    }
    next.detalheArtistico = [];
    return next;
  }

  if (stepId === 'detalhe_artistico') {
    next.detalheArtistico = ids;
    return next;
  }

  if (stepId === 'genero_persona') {
    next.generoPersona = ids[0] ?? null;
    return next;
  }

  if (stepId === 'imagem_artistica') {
    next.imagemArtistica = ids;
    return next;
  }

  if (stepId === 'tipo_nome_artistico') {
    next.tipoNomeArtistico = ids[0] ?? null;
    return next;
  }

  // ── DEV-326 ──
  if (stepId === 'bebe_situacao') {
    next.bebeSituacao = ids[0] ?? null;
    // Mudou a situação: a data e os dados dependem dela.
    next.bebeDataTipo = null;
    next.bebeData = null;
    return next;
  }

  if (stepId === 'bebe_data_tipo') {
    next.bebeDataTipo = ids[0] ?? null;
    return next;
  }

  if (stepId === 'bebe_sexo') {
    next.bebeSexo = ids[0] ?? null;
    return next;
  }

  if (stepId === 'bebe_estilo') {
    // "Tanto faz" sozinho vale como resposta; junto de outra escolha, vale a escolha.
    const escolhidos = ids.filter((id) => id !== 'tanto_faz');
    next.bebeEstilos = escolhidos.length > 0 ? escolhidos : ['tanto_faz'];
    return next;
  }

  if (stepId === 'outros_usos') {
    // "Nenhum outro" sozinho vale como resposta; junto de outra escolha, vale a escolha.
    const escolhidos = ids.filter((id) => id !== 'nenhum_outro');
    next.outrosUsos = escolhidos.length > 0 ? escolhidos : ['nenhum_outro'];
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
    fluxoMotivoAtivo: raw.fluxoMotivoAtivo ?? prev.fluxoMotivoAtivo ?? false,
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

export function collectStateToRankingPatch(collect: ChatCollectState): RankingOpcoesPatch {
  return profileToRankingOpcoes({
    nomeUsoBase: collect.nomeUsoBase,
    sobrenomesObrigatorios: collect.sobrenomesObrigatorios,
    sobrenomesExcluidos: collect.sobrenomesExcluidos,
    relacaoNome: collect.relacaoNome,
    ondeAssinaRaw: collect.ondeAssinaRaw,
    estiloPresenca: collect.estiloPresenca,
    areaFoco: collect.areaFoco,
    subfocosOrdenados: collect.subfocosOrdenados,
    aberturaMudanca: collect.aberturaMudanca,
    nomeArtistico: collect.nomeArtistico,
    contextoLeituraOutros: collect.contextoLeitura,
    preferenciasAssinatura: collect.preferenciasAssinatura ?? [],
    prioridadeConflito: collect.prioridadeConflito ?? null,
    areaFocoOutro: collect.areaFocoOutro ?? null,
    ...collectToPerfilArtistico(collect),
  });
}

/** DEV-320: campos do motivo e do ramo artístico no formato do perfil do questionário. */
function collectToPerfilArtistico(collect: ChatCollectState) {
  return {
    motivoHarmonizacao: collect.motivoHarmonizacao ?? null,
    areaArtistica: collect.areaArtistica ?? null,
    areaArtisticaOutro: collect.areaArtisticaOutro ?? null,
    detalheArtistico: collect.detalheArtistico ?? [],
    generoPersona: collect.generoPersona ?? null,
    imagemArtistica: collect.imagemArtistica ?? [],
    tipoNomeArtistico: collect.tipoNomeArtistico ?? null,
    outrosUsos: collect.outrosUsos ?? [],
  };
}

/** DEV-320: perfil do chat que vai junto da análise salva. */
export function collectStateToPerfilChat(collect: ChatCollectState) {
  return profileToPerfilChat({
    nomeUsoBase: collect.nomeUsoBase,
    sobrenomesObrigatorios: collect.sobrenomesObrigatorios,
    sobrenomesExcluidos: collect.sobrenomesExcluidos,
    relacaoNome: collect.relacaoNome,
    ondeAssinaRaw: collect.ondeAssinaRaw,
    estiloPresenca: collect.estiloPresenca,
    areaFoco: collect.areaFoco,
    subfocosOrdenados: collect.subfocosOrdenados,
    aberturaMudanca: collect.aberturaMudanca,
    nomeArtistico: collect.nomeArtistico,
    contextoLeituraOutros: collect.contextoLeitura,
    ...collectToPerfilArtistico(collect),
  });
}

export type RegenerateSuggestionsApiPayload = {
  melhorNome?: Record<string, unknown> & { nomeCompleto: string; panel?: ApiPanel };
  top3?: Array<Record<string, unknown> & { nomeCompleto: string; panel?: ApiPanel }>;
  nossasSugestoes?: Array<Record<string, unknown> & { nomeCompleto: string; panel?: ApiPanel }>;
  poolEsgotado?: boolean;
  semOpcoesElegiveis?: boolean;
  scoreNascimento?: number;
  scoreMinimoSugestao?: number;
};

/** Flatten API regenerate response into up to 3 unique candidates (chat cards). */
export function mapRegenerateApiToCandidates(
  data: RegenerateSuggestionsApiPayload,
  limit = 3
): CandidateSuggestion[] {
  const vistos = new Set<string>();
  const out: CandidateSuggestion[] = [];
  const rawList = [
    ...(data.melhorNome ? [data.melhorNome] : []),
    ...(Array.isArray(data.top3) ? data.top3 : []),
    ...(Array.isArray(data.nossasSugestoes) ? data.nossasSugestoes : []),
  ];
  const unicos: typeof rawList = [];
  for (const raw of rawList) {
    if (!raw?.nomeCompleto) continue;
    const key = raw.nomeCompleto.trim().toLowerCase();
    if (vistos.has(key)) continue;
    vistos.add(key);
    unicos.push(raw);
  }
  // DEV-301 (R3a): a sugestão de maior nota nunca fica de fora do corte visível.
  const visiveis = unicos.slice(0, limit);
  // DEV-317: os 2 selos (Principal e Maior nota) sempre entram no corte visível.
  for (const destaque of [unicos.find((raw) => raw.principal === true), unicos.find((raw) => raw.maiorNota === true)]) {
    if (!destaque || visiveis.includes(destaque) || visiveis.length === 0) continue;
    const idx = [...visiveis].reverse().findIndex((raw) => raw.maiorNota !== true && raw.principal !== true);
    if (idx >= 0) visiveis[visiveis.length - 1 - idx] = destaque;
  }
  for (const raw of visiveis) out.push(mapCandidate(raw));
  return out;
}

export function buildRegenerateRequestBody(input: {
  analysisId?: string;
  nomeNascimento: string;
  dataNascimento: string;
  collect: ChatCollectState;
  nomesExcluidos: string[];
}): Record<string, unknown> {
  const ranking = collectStateToRankingPatch(input.collect);
  const estilo =
    (input.collect.estiloPreferido as EstiloAssinaturaPreferido | null) ??
    ranking.estiloPreferido ??
    'qualquer';

  const body: Record<string, unknown> = {
    nomesExcluidos: input.nomesExcluidos,
    sobrenomesObrigatorios: input.collect.sobrenomesObrigatorios,
    sobrenomesExcluidos: input.collect.sobrenomesExcluidos,
    estiloPreferido: estilo,
    rankingChat: {
      aceitaEncurtarOuApelido: ranking.aceitaEncurtarOuApelido,
      ondeVaiUsar: ranking.ondeVaiUsar,
      assinaturaAtual: ranking.assinaturaAtual,
      restricaoDocumentosLegais: ranking.restricaoDocumentosLegais,
      maxNivelGeracao: ranking.maxNivelGeracao,
      afinidades: ranking.afinidades,
      manterPrimeiroNome: ranking.manterPrimeiroNome,
      acentoNaAssinatura: ranking.acentoNaAssinatura,
      prioridadeConflito: ranking.prioridadeConflito,
      perfilChat: collectStateToPerfilChat(input.collect),
    },
  };

  if (input.analysisId) {
    body.analysisId = input.analysisId;
  } else {
    body.nomeNascimento = input.nomeNascimento.trim();
    body.dataNascimento = input.dataNascimento.trim();
  }

  return body;
}

/** True when API says pool is exhausted or every returned name was already shown. */
export function isRegeneratePoolExhausted(
  data: RegenerateSuggestionsApiPayload,
  nomesJaMostrados: string[]
): boolean {
  if (data.poolEsgotado) return true;
  const shown = new Set(nomesJaMostrados.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const novos = mapRegenerateApiToCandidates(data, 50);
  if (novos.length === 0) return true;
  return novos.every((c) => shown.has(c.nome.trim().toLowerCase()));
}

/** DEV-326: resposta do formulário do bebê (data, sobrenomes, nomes dos pais ou nome registrado). */
export function applyBebeDados(
  prev: ChatCollectState,
  dados: { data: string; sobrenomes: string[]; nomesPais: string[]; nomeRegistrado: string | null },
): ChatCollectState {
  return {
    ...prev,
    bebeData: dados.data,
    bebeSobrenomes: dados.sobrenomes,
    bebeNomesPais: dados.nomesPais,
    bebeNomeRegistrado: dados.nomeRegistrado,
  };
}
