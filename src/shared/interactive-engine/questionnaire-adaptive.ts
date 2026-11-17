/**
 * Questionário adaptativo DEV-235 (8 perguntas + palpite).
 * Definições fixas da árvore JEV — sem peso na fórmula do score (DEV-260).
 */

import type { AreaFocoNomeMagnetico, SubfocoMomento } from './copy';

const PARTICULAS_SOBRENOME = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);

function extrairSobrenomesLocal(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return [];
  const resultado: string[] = [];
  for (let i = 1; i < partes.length; i++) {
    const token = partes[i]!;
    const norm = token
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (!norm || PARTICULAS_SOBRENOME.has(norm)) continue;
    const formatado = token.charAt(0).toUpperCase() + token.slice(1);
    if (!resultado.some((r) => r.toLowerCase() === norm)) resultado.push(formatado);
  }
  return resultado;
}

export type QuestionnaireStepId =
  | 'nome_uso'
  | 'sobrenomes_uso'
  | 'relacao_nome'
  | 'onde_assina'
  | 'estilo_presenca'
  | 'area_foco'
  | 'subfoco'
  | 'abertura_mudanca'
  | 'preferencias_assinatura'
  | 'prioridade_conflito';

export const QUESTIONNAIRE_STEP_ORDER: QuestionnaireStepId[] = [
  'nome_uso',
  'sobrenomes_uso',
  'relacao_nome',
  'onde_assina',
  'estilo_presenca',
  'area_foco',
  'subfoco',
  'abertura_mudanca',
  // DEV-303: máximo de 10 passos; os dois últimos são pulados quando já inferidos.
  'preferencias_assinatura',
  'prioridade_conflito',
];

/** Passos novos da DEV-303, fora do roteiro do mock adaptativo da DEV-274. */
export const DEV303_NEW_STEPS: readonly QuestionnaireStepId[] = [
  'preferencias_assinatura',
  'prioridade_conflito',
];

export type SelectionMode = 'single' | 'multi';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionSpec {
  id: QuestionnaireStepId;
  prompt: string;
  mode: SelectionMode;
  maxSelect?: number;
  minSelect?: number;
  allowOther?: boolean;
  otherMaxLength?: number;
  captionSingle?: string;
  captionMulti?: string;
  captionMultiLimit?: (max: number) => string;
  staticOptions?: QuestionOption[];
}

const RELACAO_NOME_OPTIONS: QuestionOption[] = [
  { id: 'gosto_muito', label: 'Gosto muito' },
  { id: 'falta_algo', label: 'Gosto, mas sinto que falta algo' },
  { id: 'nao_representa', label: 'Não me representa' },
  { id: 'nunca_pensei', label: 'Nunca pensei nisso' },
];

const ONDE_ASSINA_OPTIONS: QuestionOption[] = [
  { id: 'contratos_documentos', label: 'Contratos e documentos' },
  { id: 'redes_sociais', label: 'Redes sociais' },
  { id: 'email_cartao', label: 'E-mail e cartão' },
  { id: 'marca_negocio', label: 'Minha marca ou negócio' },
  { id: 'arte_criativo', label: 'Arte ou trabalho criativo' },
];

const ESTILO_PRESENCA_OPTIONS: QuestionOption[] = [
  { id: 'firme_confiavel', label: 'Firme e confiável' },
  { id: 'leve_acolhimento', label: 'Leveza e acolhimento' },
  { id: 'criatividade', label: 'Criatividade marcante' },
  { id: 'elegancia_discreta', label: 'Elegância discreta' },
];

const AREA_FOCO_OPTIONS: QuestionOption[] = [
  { id: 'prosperidade_financeira', label: 'Dinheiro e prosperidade' },
  { id: 'carreira_negocios', label: 'Carreira e negócios' },
  { id: 'relacionamentos_harmonia', label: 'Relacionamentos' },
  { id: 'autoestima_expressao', label: 'Autoestima e expressão' },
  // DEV-303: texto livre (até 60 caracteres). O id termina em `_outro`, que abre o campo de texto.
  { id: 'area_outro', label: 'Outro foco' },
];

const ABERTURA_OPTIONS: QuestionOption[] = [
  { id: 'quase_nada', label: 'Quase nada, só um detalhe' },
  { id: 'acento_ou_letra', label: 'Um acento ou letra a mais' },
  { id: 'tirar_trocar_sobrenome', label: 'Tirar ou trocar um sobrenome' },
  { id: 'o_que_fizer_sentido', label: 'O que fizer sentido' },
];

const PREFERENCIAS_ASSINATURA_OPTIONS: QuestionOption[] = [
  { id: 'manter_primeiro_nome', label: 'Manter meu primeiro nome' },
  { id: 'sem_acento', label: 'Prefiro sem acento' },
  { id: 'tanto_faz', label: 'Tanto faz' },
];

const PRIORIDADE_CONFLITO_OPTIONS: QuestionOption[] = [
  { id: 'nota_mais_alta', label: 'A nota mais alta' },
  { id: 'mudar_o_minimo', label: 'Mudar o mínimo' },
];

const SUBFOCO_BY_AREA: Record<AreaFocoNomeMagnetico, QuestionOption[]> = {
  prosperidade_financeira: [
    { id: 'reter_ganhos', label: 'Ganho, mas não sobra' },
    { id: 'aumentar_renda', label: 'Quero ganhar mais' },
    { id: 'organizar_estabilidade', label: 'Quero organizar' },
    { id: 'fechar_contratos', label: 'Medo de arriscar' },
  ],
  carreira_negocios: [
    { id: 'lideranca_promocao', label: 'Buscando reconhecimento' },
    { id: 'novo_ciclo_profissional', label: 'Mudando de área' },
    { id: 'fechar_contratos', label: 'Abrindo meu negócio' },
    { id: 'foco_execucao', label: 'Quero crescer onde estou' },
  ],
  relacionamentos_harmonia: [
    { id: 'harmonia_afetiva', label: 'Amor' },
    { id: 'paz_familiar', label: 'Família' },
    { id: 'novas_conexoes', label: 'Amizades' },
    { id: 'voz_seguranca', label: 'Trabalho em equipe' },
  ],
  autoestima_expressao: [
    { id: 'autoconfianca_identidade', label: 'Mais confiança' },
    { id: 'voz_seguranca', label: 'Ter mais visibilidade' },
    { id: 'foco_execucao', label: 'Me reconhecer no espelho' },
    { id: 'novo_ciclo_profissional', label: 'Falar sem medo' },
  ],
};

export function extrairPrenomes(nomeCompleto: string): string[] {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return [];
  const sobSet = new Set(extrairSobrenomesLocal(nomeCompleto).map((s) => s.toLowerCase()));
  const prenomes: string[] = [];
  for (const p of partes) {
    if (sobSet.has(p.toLowerCase())) break;
    prenomes.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  if (prenomes.length === 0) prenomes.push(partes[0]!);
  return prenomes;
}

export function buildNomeUsoOptions(nomeCompleto: string): QuestionOption[] {
  const prenomes = extrairPrenomes(nomeCompleto);
  const opts: QuestionOption[] = [];
  const seen = new Set<string>();

  const push = (label: string, id: string) => {
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    opts.push({ id, label });
  };

  for (const p of prenomes) {
    push(p, `nome_${p.toLowerCase()}`);
  }
  if (prenomes.length >= 2) {
    push(prenomes.join(' '), 'nome_combo_prenomes');
  }
  const sobrenomes = extrairSobrenomesLocal(nomeCompleto);
  if (prenomes[0] && sobrenomes[0]) {
    push(`${prenomes[0]} ${sobrenomes[0]}`, 'nome_primeiro_sob');
  }
  if (prenomes[0] && sobrenomes.length >= 2) {
    push(`${prenomes[0]} ${sobrenomes.join(' ')}`, 'nome_primeiro_todos_sob');
  }
  push('Outro jeito', 'nome_outro');
  return opts;
}

/** DEV-304: opção para quem assina só com o primeiro nome (nenhum sobrenome). */
export const SOBRENOMES_SO_PRIMEIRO_NOME_LABEL = 'Só o primeiro nome';

export function buildSobrenomesUsoOptions(sobrenomes: string[]): QuestionOption[] {
  const opts: QuestionOption[] = sobrenomes.map((s) => ({
    id: `sob_${s.toLowerCase().replace(/\s+/g, '_')}`,
    label: s,
  }));
  opts.push({ id: 'sob_nenhum', label: SOBRENOMES_SO_PRIMEIRO_NOME_LABEL });
  return opts;
}

export function getQuestionSpec(
  stepId: QuestionnaireStepId,
  ctx: { nomeCompleto: string; sobrenomes: string[]; areaFoco: AreaFocoNomeMagnetico | null }
): QuestionSpec {
  switch (stepId) {
    case 'nome_uso':
      return {
        id: stepId,
        prompt: 'Como as pessoas te chamam no dia a dia?',
        mode: 'single',
        allowOther: true,
        otherMaxLength: 60,
        staticOptions: buildNomeUsoOptions(ctx.nomeCompleto),
      };
    case 'sobrenomes_uso':
      return {
        id: stepId,
        prompt: 'Quais sobrenomes você usa quando assina?',
        mode: 'multi',
        minSelect: 1,
        captionMulti: 'Pode escolher mais de uma',
        staticOptions: buildSobrenomesUsoOptions(ctx.sobrenomes),
      };
    case 'relacao_nome':
      return {
        id: stepId,
        prompt: 'Como você se sente com o seu nome hoje?',
        mode: 'single',
        staticOptions: RELACAO_NOME_OPTIONS,
      };
    case 'onde_assina':
      return {
        id: stepId,
        prompt: 'Onde você mais usa a sua assinatura?',
        mode: 'multi',
        maxSelect: 3,
        captionMultiLimit: (n) => `Escolha até ${n}`,
        staticOptions: ONDE_ASSINA_OPTIONS,
      };
    case 'estilo_presenca':
      return {
        id: stepId,
        prompt: 'Como você quer que te percebam?',
        mode: 'multi',
        maxSelect: 2,
        captionMultiLimit: (n) => `Escolha até ${n}`,
        staticOptions: ESTILO_PRESENCA_OPTIONS,
      };
    case 'area_foco':
      return {
        id: stepId,
        prompt: 'O que mais pede a sua atenção agora?',
        mode: 'single',
        allowOther: true,
        otherMaxLength: 60,
        staticOptions: AREA_FOCO_OPTIONS,
      };
    case 'subfoco': {
      const area = ctx.areaFoco ?? 'prosperidade_financeira';
      return {
        id: stepId,
        prompt: 'O que mais combina com esse foco agora?',
        mode: 'multi',
        maxSelect: 2,
        captionMultiLimit: (n) => `Escolha até ${n}`,
        staticOptions: SUBFOCO_BY_AREA[area],
      };
    }
    case 'abertura_mudanca':
      return {
        id: stepId,
        prompt: 'Quanto você topa mudar na assinatura?',
        mode: 'single',
        staticOptions: ABERTURA_OPTIONS,
      };
    case 'preferencias_assinatura':
      return {
        id: stepId,
        prompt: 'Tem algo que você quer manter ou evitar na assinatura?',
        mode: 'multi',
        minSelect: 1,
        maxSelect: 2,
        captionMultiLimit: (n) => `Escolha até ${n}`,
        staticOptions: PREFERENCIAS_ASSINATURA_OPTIONS,
      };
    case 'prioridade_conflito':
      return {
        id: stepId,
        prompt: 'Se for preciso escolher, o que pesa mais para você?',
        mode: 'single',
        staticOptions: PRIORIDADE_CONFLITO_OPTIONS,
      };
    default:
      return {
        id: 'nome_uso',
        prompt: '',
        mode: 'single',
      };
  }
}

export function resolveNomeUsoLabel(
  optionId: string | undefined,
  otherText: string | undefined,
  options: QuestionOption[]
): string {
  if (optionId === 'nome_outro' && otherText?.trim()) {
    return otherText.trim().slice(0, 60);
  }
  const found = options.find((o) => o.id === optionId);
  return found?.label ?? otherText?.trim() ?? '';
}

export type BlockTransitionId = 'after_nome_block' | 'before_area_foco' | 'before_suggestions';

function firstName(nomeCurto: string): string {
  return nomeCurto.trim().split(/\s+/)[0] || 'você';
}

/** Transições de bloco (máx. 3), uma vez cada por sessão de chat. */
export function resolveBlockTransition(
  completedStepId: string,
  nextStepId: string,
  nomeCurto: string,
  alreadyShown: ReadonlySet<BlockTransitionId>
): { id: BlockTransitionId; text: string } | null {
  if (
    !alreadyShown.has('after_nome_block') &&
    completedStepId === 'relacao_nome' &&
    nextStepId === 'onde_assina'
  ) {
    const nome = firstName(nomeCurto);
    return {
      id: 'after_nome_block',
      text: `Perfeito, ${nome}. Agora quero entender onde a sua assinatura aparece.`,
    };
  }

  if (!alreadyShown.has('before_area_foco') && nextStepId === 'area_foco') {
    return {
      id: 'before_area_foco',
      text: 'Com isso já sei como você se apresenta. Agora vamos ao que mais pede a sua atenção.',
    };
  }

  if (
    !alreadyShown.has('before_suggestions') &&
    (nextStepId === 'fim_coleta' || nextStepId === 'conclusao')
  ) {
    return {
      id: 'before_suggestions',
      text: 'Pronto. Cruzei suas respostas com o seu mapa e separei as assinaturas que mais combinam com você.',
    };
  }

  return null;
}

const TRANSITION_MARKERS: Record<BlockTransitionId, string> = {
  after_nome_block: 'Agora quero entender onde a sua assinatura aparece.',
  before_area_foco: 'Agora vamos ao que mais pede a sua atenção.',
  before_suggestions: 'separei as assinaturas que mais combinam com você.',
};

/** Reconstrói transições já exibidas ao restaurar sessão persistida. */
export function detectShownBlockTransitions(
  messages: ReadonlyArray<{ content?: string }>
): Set<BlockTransitionId> {
  const shown = new Set<BlockTransitionId>();
  for (const m of messages) {
    const c = m.content ?? '';
    for (const [id, marker] of Object.entries(TRANSITION_MARKERS) as Array<
      [BlockTransitionId, string]
    >) {
      if (c.includes(marker)) shown.add(id);
    }
  }
  return shown;
}

export function mapOndeAssinaToApi(ids: string[]): string[] {
  const map: Record<string, string> = {
    contratos_documentos: 'identidade_registro',
    redes_sociais: 'presenca_digital',
    email_cartao: 'rotina_trabalho',
    marca_negocio: 'marca_autoria',
    arte_criativo: 'presenca_digital',
  };
  const out: string[] = [];
  for (const id of ids) {
    const api = map[id] ?? id;
    if (!out.includes(api)) out.push(api);
  }
  return out;
}

export function orderedOndeAssinaWeights(ids: string[]): number[] {
  const weights = [0.5, 0.3, 0.2];
  return ids.map((_, i) => weights[i] ?? 0.1);
}

export function subfocoWeights(): [number, number] {
  return [0.65, 0.35];
}

export function mapSubfocoToEnum(id: string): SubfocoMomento {
  const allowed: SubfocoMomento[] = [
    'reter_ganhos',
    'aumentar_renda',
    'organizar_estabilidade',
    'fechar_contratos',
    'lideranca_promocao',
    'novo_ciclo_profissional',
    'harmonia_afetiva',
    'paz_familiar',
    'novas_conexoes',
    'voz_seguranca',
    'foco_execucao',
    'autoconfianca_identidade',
  ];
  return (allowed.includes(id as SubfocoMomento) ? id : 'foco_execucao') as SubfocoMomento;
}

export function needsNomeArtisticoField(ondeIds: string[]): boolean {
  return ondeIds.some((id) => id === 'redes_sociais' || id === 'marca_negocio');
}

export function isQuestionnaireStep(stepId: string): stepId is QuestionnaireStepId {
  return (QUESTIONNAIRE_STEP_ORDER as string[]).includes(stepId);
}

// ── DEV-303 · texto livre, inferência e pulo de perguntas ────────────────────

/** Texto livre do chat: sem controle, sem marcação e no máximo `max` caracteres. */
export function sanitizeOutroText(text: string, max = 60): string {
  return text
    .replace(/[\u0000-\u001f\u007f<>`{}\[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Área de foco por palavras-chave (mesma regra do determinístico do JEV). `null` sem pista. */
export function inferAreaFocoFromText(text: string): AreaFocoNomeMagnetico | null {
  const t = text.toLowerCase();
  if (/(dinheiro|financ|renda|d[ií]vida|pagar|conta|prosper|lucro|reserva|ganho)/.test(t)) {
    return 'prosperidade_financeira';
  }
  if (/(amor|casamento|relacionamento|fam[ií]lia|parceir|afeto|casa|filh)/.test(t)) {
    return 'relacionamentos_harmonia';
  }
  if (/(confian[cç]a|autoestima|timidez|inseguran[cç]a|falar|express|clareza|prop[oó]sito)/.test(t)) {
    return 'autoestima_expressao';
  }
  if (/(trabalh|carreira|neg[oó]cio|client|contrato|venda|empresa|cargo|promo[cç][aã]o)/.test(t)) {
    return 'carreira_negocios';
  }
  return null;
}

export interface QuestionnaireSkipContext {
  relacaoNome?: string | null;
  aberturaMudanca?: string | null;
  ondeAssinaRaw?: readonly string[] | null;
}

/**
 * Perguntas que o roteiro pula porque a resposta já está implícita:
 * - "Não me representa" já indica abertura para mudar (abertura_mudanca);
 * - "Quase nada" ou uso em contratos e documentos já indicam mudar o mínimo (prioridade_conflito).
 */
export function isQuestionnaireStepSkipped(
  stepId: QuestionnaireStepId,
  ctx: QuestionnaireSkipContext,
): boolean {
  if (stepId === 'abertura_mudanca') return ctx.relacaoNome === 'nao_representa';
  if (stepId === 'prioridade_conflito') {
    return (
      ctx.aberturaMudanca === 'quase_nada' ||
      Boolean(ctx.ondeAssinaRaw?.includes('contratos_documentos'))
    );
  }
  return false;
}
