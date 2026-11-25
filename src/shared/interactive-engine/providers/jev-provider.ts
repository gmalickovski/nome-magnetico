/**
 * Provider System One oficial (@typesafe-ai/sdk · JEV) com Cadeia de 3 Níveis 100% Transparente:
 *
 * 1º Nível (Preferencial): TypeSafe JEV (`@typesafe-ai/sdk`, `TYPESAFE_API_KEY`)
 *    - Usa `client.systemOne({ state, questions })` com `noul`, `score`, `choice` (e `box` em `jev-preview`).
 * 2º Nível (Fallback Oficial Transparente): OpenAI Structured Outputs (`OPENAI_API_KEY`, `json_schema` strict)
 *    - Acionado automaticamente se `TYPESAFE_API_KEY` estiver vazia ou se a conta TypeSafe retornar
 *      erro de saldo/crédito ou timeout (`401 / 402 / 403 / 429 / 5xx`).
 * 3º Nível (Fallback Determinístico Local em 0 ms):
 *    - Garante funcionamento ininterrupto em testes, CI ou oscilação de rede.
 */

import { Image, TypeSafeClient } from '@typesafe-ai/sdk';
import { isJevMockOnlyMode } from '../adaptive/config';
import { inferAreaFocoFromText } from '../questionnaire-adaptive';
import {
  classifyJevFailure,
  createJevCallGuard,
  isJevRemoteDisabled,
  jevBudget,
  parseStructuredDecision,
  parseTypesafeAnswers,
  readStructuredTimeoutMs,
  type JevAttempt,
  type JevCallGuard,
  type JevTelemetry,
  type StructuredDecision,
} from './jev-safety';
import {
  buildNomeMagneticoJevQuestions,
  buildSignatureBoxQuestions,
} from '../presets/nome-magnetico';
import type {
  AreaFocoNomeMagnetico,
  EstiloAssinaturaPreferido,
  OndeAssinaCanal,
  SignatureBoxInspectionResult,
  SubfocoMomento,
} from '../primitives';

export interface JevDecisionInputState {
  nome_completo: string;
  numero_destino: number;
  nota_hoje: number;
  potencial: number;
  bloqueios_triangulos: string[];
  relato_consulente: string;
  area_foco_chip?: AreaFocoNomeMagnetico;
  onde_assina_chips?: OndeAssinaCanal[];
  estilo_preferido_chip?: EstiloAssinaturaPreferido;
  subfoco_momento_chip?: SubfocoMomento;
}

export interface JevDecisionResult {
  providerUsed: 'typesafe-jev' | 'groq-structured' | 'openai-structured' | 'deterministic';
  /** Preenchido quando o fluxo não tentou providers pagos (ex.: NM_JEV_MOCK_ONLY). */
  providerPath?: string[];
  escopoPronto: boolean;
  escopoConfidence: number;
  clarezaRelatoScore: number;
  areaFoco: AreaFocoNomeMagnetico;
  ondeAssina: OndeAssinaCanal;
  estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'>;
  subfocoMomento: SubfocoMomento;
  alertaComplianceLegal: boolean;
  /** DEV-303: tentativas remotas, motivo do fallback, tokens e latência (sem PII). */
  telemetry?: JevTelemetry;
}

/** DEV-303: contexto de custo e proteção de cada chamada. */
export interface JevUsageEvent {
  provider: JevAttempt['provider'];
  model: string;
  tokensInput: number;
  tokensOutput: number;
  attemptNumber: number;
}

export interface JevCallOptions {
  /** `u:<userId>` ou `ip:<hash>`. Sem chave, valem só os tetos globais. */
  budgetKey?: string;
  /** Guarda de chamada (LoopGuard do backend ou o espelho padrão). */
  guard?: JevCallGuard;
  /** Chamado a cada resposta remota válida, para registrar uso. */
  onUsage?: (event: JevUsageEvent) => void;
}

interface RemoteDecision {
  result: JevDecisionResult;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

const CLINICAL_KEYWORDS_REGEX =
  /\b(depress[aã]o|ansiedade(\s+cl[ií]nica)?|p[aâ]nico|c[aâ]ncer|diabetes|hipertens[aã]o|doen[cç]a|enfermidade|cura(\s+m[eé]dica)?|tratamento\s+m[eé]dico|psiqui[aá]tr|rem[eé]dio|medicamento|sintoma\s+f[ií]sico|dor(\s+cr[oô]nica|\s+f[ií]sica)?|suic[ií]d|terapia\s+m[eé]dica|diagn[oó]stico\s+m[eé]dico)\b/i;

function getEnvKey(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  const fromImportMeta =
    typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env
      ? (import.meta as unknown as { env: Record<string, string> }).env[name]
      : undefined;
  const val = (fromProcess || fromImportMeta || '').trim();
  return val.length > 0 ? val : undefined;
}

/**
 * Nível 1 (Preferencial): TypeSafe JEV (@typesafe-ai/sdk)
 */
async function evaluateWithTypeSafeJev(
  state: JevDecisionInputState,
  apiKey: string
): Promise<RemoteDecision> {
  const client = new TypeSafeClient({
    apiKey,
    defaultModel: 'jev-latest',
    timeout: 1500,
    retry: { maxRetries: 0 },
  });

  const questions = buildNomeMagneticoJevQuestions();

  const response = await client.systemOne({
    state: {
      nome_atual: state.nome_completo,
      numero_destino: state.numero_destino,
      nota_hoje: state.nota_hoje,
      potencial: state.potencial,
      bloqueios_triangulos: state.bloqueios_triangulos,
      relato_consulente: state.relato_consulente,
      area_foco_chip: state.area_foco_chip ?? null,
      onde_assina_chips: state.onde_assina_chips ?? [],
    },
    questions,
  });

  // DEV-303: saída fora do domínio (enum, faixa de noul/score) vira erro e cai no próximo nível.
  const answers = parseTypesafeAnswers(response?.answers);

  const det = evaluateDeterministically(state);
  const noulEscopo = answers.escopo_pronto.noul;
  const noulLegal = answers.alerta_compliance_legal.noul;
  const clarezaScore = answers.clareza_relato.score;

  return {
    model: 'jev-latest',
    tokensInput: 0,
    tokensOutput: 0,
    result: {
      providerUsed: 'typesafe-jev',
      // Companion Noul best practice (TypeSafe skill): >= 0.7 yes, <= 0.3 no
      escopoPronto: noulEscopo >= 0.7 || Boolean(state.area_foco_chip),
      escopoConfidence: noulEscopo,
      clarezaRelatoScore: typeof clarezaScore === 'number' ? clarezaScore : det.clarezaRelatoScore,
      areaFoco: state.area_foco_chip ?? answers.area_foco.choice,
      ondeAssina: state.onde_assina_chips?.[0] ?? answers.onde_assina.choice,
      estiloPresenca:
        state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
          ? state.estilo_preferido_chip
          : answers.estilo_presenca.choice,
      subfocoMomento: state.subfoco_momento_chip ?? answers.subfoco_momento.choice,
      alertaComplianceLegal: det.alertaComplianceLegal || noulLegal >= 0.5,
    },
  };
}

/**
 * Nível 2 (Fallback Oficial Transparente): OpenAI Structured Outputs (json_schema strict)
 * Avalia exatamente o mesmo state e as mesmas questions quando TYPESAFE_API_KEY não estiver definida
 * ou quando a conta TypeSafe estiver sem créditos (HTTP 401/402/403/429/5xx).
 */
// O modo strict não aceita minimum/maximum, e o OpenAI chegou a devolver `clareza_relato_score: 8`
// para uma escala de 0 a 2: por isso o score é inteiro com enum [0, 1, 2]. A nota `noul` (0 a 1)
// fica número livre porque o Groq recusa (HTTP 400) um enum que mistura inteiros e decimais;
// quem garante a faixa é a validação Zod de `jev-safety.ts`.
const SYSTEM_ONE_DECISIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'escopo_pronto_noul',
    'clareza_relato_score',
    'area_foco',
    'onde_assina',
    'estilo_presenca',
    'subfoco_momento',
    'alerta_compliance_legal_noul',
  ],
  properties: {
    escopo_pronto_noul: {
      type: 'number',
      description: 'Probabilidade de 0 a 1 de o relato já ter contexto suficiente.',
    },
    clareza_relato_score: {
      type: 'integer',
      enum: [0, 1, 2],
      description: 'Nível de detalhamento do relato de 0 (vazio) a 2 (detalhado).',
    },
    area_foco: {
      type: 'string',
      enum: [
        'prosperidade_financeira',
        'carreira_negocios',
        'relacionamentos_harmonia',
        'autoestima_expressao',
      ],
    },
    onde_assina: {
      type: 'string',
      enum: ['identidade_registro', 'presenca_digital', 'rotina_trabalho', 'marca_autoria'],
    },
    estilo_presenca: {
      type: 'string',
      enum: ['sobrenome_forte', 'ajuste_sutil', 'curto_direto'],
    },
    subfoco_momento: {
      type: 'string',
      enum: [
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
      ],
    },
    alerta_compliance_legal_noul: {
      type: 'number',
      description:
        'Probabilidade de 0 a 1 de o relato mencionar doença física/mental, diagnóstico médico ou pedir cura.',
    },
  },
} as const;

function buildStructuredDecisionMessages(state: JevDecisionInputState) {
  return [
    {
      role: 'system' as const,
      content:
        'Você é um motor de decisão System 1 (compatível com TypeSafe JEV). Avalie o state fornecido e responda estritamente no schema JSON com as decisões tipadas (choice, score e noul).',
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        state: {
          nome_atual: state.nome_completo,
          numero_destino: state.numero_destino,
          nota_hoje: state.nota_hoje,
          potencial: state.potencial,
          bloqueios_triangulos: state.bloqueios_triangulos,
          relato_consulente: state.relato_consulente,
          area_foco_chip: state.area_foco_chip ?? null,
          onde_assina_chips: state.onde_assina_chips ?? [],
        },
      }),
    },
  ];
}

function mapStructuredDecisionJson(
  state: JevDecisionInputState,
  parsed: StructuredDecision,
  providerUsed: 'groq-structured' | 'openai-structured'
): JevDecisionResult {
  const det = evaluateDeterministically(state);

  return {
    providerUsed,
    escopoPronto:
      parsed.escopo_pronto_noul >= 0.7 ||
      Boolean(state.area_foco_chip) ||
      state.relato_consulente.trim().length >= 12,
    escopoConfidence: parsed.escopo_pronto_noul || det.escopoConfidence,
    clarezaRelatoScore: parsed.clareza_relato_score,
    areaFoco: state.area_foco_chip ?? parsed.area_foco,
    ondeAssina: state.onde_assina_chips?.[0] ?? parsed.onde_assina,
    estiloPresenca:
      state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
        ? state.estilo_preferido_chip
        : parsed.estilo_presenca,
    subfocoMomento: state.subfoco_momento_chip ?? parsed.subfoco_momento,
    alertaComplianceLegal: det.alertaComplianceLegal || parsed.alerta_compliance_legal_noul >= 0.5,
  };
}

async function callOpenAiCompatibleStructuredDecision(
  state: JevDecisionInputState,
  apiKey: string,
  endpoint: string,
  model: string,
  providerUsed: 'groq-structured' | 'openai-structured'
): Promise<RemoteDecision> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), readStructuredTimeoutMs(providerUsed));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        // Modelos gpt-oss gastam parte do limite raciocinando: 200 ficava no limite (182 a 199 usados).
        max_tokens: 600,
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
        messages: buildStructuredDecisionMessages(state),
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'system_one_decisions',
            strict: true,
            schema: SYSTEM_ONE_DECISIONS_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`${providerUsed} HTTP ${res.status}`);
    }

    const data = await res.json();
    // DEV-303: JSON ilegível ou fora do domínio vira `invalid-output` (sem repassar o conteúdo).
    const parsed = parseStructuredDecision(JSON.parse(data.choices?.[0]?.message?.content || '{}'));
    return {
      model,
      tokensInput: Number(data.usage?.prompt_tokens) || 0,
      tokensOutput: Number(data.usage?.completion_tokens) || 0,
      result: mapStructuredDecisionJson(state, parsed, providerUsed),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function evaluateWithGroqStructuredOutputs(
  state: JevDecisionInputState,
  groqKey: string
): Promise<RemoteDecision> {
  const model = getEnvKey('GROQ_DECIDE_MODEL') || 'openai/gpt-oss-20b';
  return callOpenAiCompatibleStructuredDecision(
    state,
    groqKey,
    'https://api.groq.com/openai/v1/chat/completions',
    model,
    'groq-structured'
  );
}

async function evaluateWithOpenAIStructuredOutputs(
  state: JevDecisionInputState,
  openAiKey: string
): Promise<RemoteDecision> {
  const model = getEnvKey('OPENAI_DECIDE_MODEL') || 'gpt-4o-mini';
  return callOpenAiCompatibleStructuredDecision(
    state,
    openAiKey,
    'https://api.openai.com/v1/chat/completions',
    model,
    'openai-structured'
  );
}

function logInteractiveProvider(
  providerUsed: JevDecisionResult['providerUsed'],
  providerPath?: string[]
): void {
  if (typeof console !== 'undefined') {
    console.info('[interactive-engine] provider', providerUsed, providerPath ?? []);
  }
}

function inferSubfocoDeterministically(
  text: string,
  areaFoco: AreaFocoNomeMagnetico
): SubfocoMomento {
  if (areaFoco === 'prosperidade_financeira') {
    if (/(d[ií]vida|aperto|pend[eê]ncia|organizar|quitar)/.test(text)) return 'organizar_estabilidade';
    if (/(aumentar|ganhar mais|nova renda|novos ganhos|faturar)/.test(text)) return 'aumentar_renda';
    return 'reter_ganhos';
  }
  if (areaFoco === 'carreira_negocios') {
    if (/(cargo|promo[cç][aã]o|lideran[cç]a|reconhecimento|chefe)/.test(text)) return 'lideranca_promocao';
    if (/(transi[cç][aã]o|mudar de [aá]rea|novo ciclo|destravar projeto)/.test(text)) return 'novo_ciclo_profissional';
    return 'fechar_contratos';
  }
  if (areaFoco === 'relacionamentos_harmonia') {
    if (/(fam[ií]lia|casa|filh|pais|lar)/.test(text)) return 'paz_familiar';
    if (/(atrair|conhecer|novas conex[oõ]es|solteir|reciproc)/.test(text)) return 'novas_conexoes';
    return 'harmonia_afetiva';
  }
  if (/(ideia|papel|adiar|procrastin|execu|concluir)/.test(text)) return 'foco_execucao';
  if (/(orgulho|hist[oó]ria|identidade|pertencimento)/.test(text)) return 'autoconfianca_identidade';
  return 'voz_seguranca';
}

/**
 * Nível 3 (Fallback Determinístico Local em 0 ms): garante que o sistema nunca falhe nem em testes/offline.
 */
export function evaluateDeterministically(state: JevDecisionInputState): JevDecisionResult {
  const text = (state.relato_consulente || '').toLowerCase();
  const alertaComplianceLegal = CLINICAL_KEYWORDS_REGEX.test(text);

  const areaFoco: AreaFocoNomeMagnetico =
    state.area_foco_chip ?? inferAreaFocoFromText(text) ?? 'carreira_negocios';

  const ondeAssina: OndeAssinaCanal =
    state.onde_assina_chips?.[0] ??
    (/(instagram|linkedin|whatsapp|rede|digital)/.test(text)
      ? 'presenca_digital'
      : /(documento|gov|rg|cart[oó]rio)/.test(text)
        ? 'identidade_registro'
        : /(arte|autoral|cria[cç][aã]o|livro|marca pessoal)/.test(text)
          ? 'marca_autoria'
          : 'rotina_trabalho');

  const estiloPresenca: Exclude<EstiloAssinaturaPreferido, 'qualquer'> =
    state.estilo_preferido_chip && state.estilo_preferido_chip !== 'qualquer'
      ? state.estilo_preferido_chip
      : ondeAssina === 'presenca_digital' || ondeAssina === 'marca_autoria'
        ? 'curto_direto'
        : 'sobrenome_forte';

  const trimmedLen = text.trim().length;
  const hasEnoughInput = Boolean(state.area_foco_chip) || trimmedLen >= 8;
  const clarezaRelatoScore = trimmedLen >= 35 ? 2 : hasEnoughInput ? 1 : 0;

  return {
    providerUsed: 'deterministic',
    providerPath: ['deterministic-local'],
    escopoPronto: hasEnoughInput,
    escopoConfidence: hasEnoughInput ? 0.85 : 0.25,
    clarezaRelatoScore,
    areaFoco,
    ondeAssina,
    estiloPresenca,
    subfocoMomento: state.subfoco_momento_chip ?? inferSubfocoDeterministically(text, areaFoco),
    alertaComplianceLegal,
  };
}

/**
 * Ponto único de entrada da Camada 2:
 * 1º tenta TypeSafe JEV (se TYPESAFE_API_KEY existir)
 * 2º cai automaticamente para OpenAI Structured Outputs (se OPENAI_API_KEY existir e houver texto livre para analisar)
 * 3º cai para avaliação determinística em 0 ms
 */
export async function runJevDecision(
  state: JevDecisionInputState,
  options: JevCallOptions = {}
): Promise<JevDecisionResult> {
  const started = Date.now();
  const telemetry: JevTelemetry = { attempts: [], tokens: 0, latencyMs: 0 };

  const finishDeterministic = (
    reason: NonNullable<JevTelemetry['fallbackReason']>,
    path: string[]
  ): JevDecisionResult => {
    const fallback = evaluateDeterministically(state);
    telemetry.fallbackReason = reason;
    telemetry.latencyMs = Date.now() - started;
    fallback.providerPath = [...path, 'deterministic-local'];
    fallback.telemetry = telemetry;
    logInteractiveProvider(fallback.providerUsed, fallback.providerPath);
    return fallback;
  };

  if (isJevMockOnlyMode()) return finishDeterministic('mock-only', ['jev-mock-only']);
  // DEV-303: kill switch explícito, sem tentar nenhum provider externo.
  if (isJevRemoteDisabled()) return finishDeterministic('remote-disabled', ['jev-remote-disabled']);

  const typesafeKey = getEnvKey('TYPESAFE_API_KEY');
  const groqKey = getEnvKey('GROQ_API_KEY');
  const openAiKey = getEnvKey('OPENAI_API_KEY');
  const hasRelato = state.relato_consulente.trim().length >= 6;

  const chain: Array<{ provider: JevAttempt['provider']; run: () => Promise<RemoteDecision> }> = [];
  if (typesafeKey) {
    chain.push({ provider: 'typesafe-jev', run: () => evaluateWithTypeSafeJev(state, typesafeKey) });
  }
  if (groqKey && hasRelato) {
    chain.push({ provider: 'groq-structured', run: () => evaluateWithGroqStructuredOutputs(state, groqKey) });
  }
  if (openAiKey && hasRelato) {
    chain.push({ provider: 'openai-structured', run: () => evaluateWithOpenAIStructuredOutputs(state, openAiKey) });
  }

  if (chain.length === 0) {
    return finishDeterministic(
      typesafeKey || groqKey || openAiKey ? 'short-report' : 'no-keys',
      ['no-remote-provider']
    );
  }

  // DEV-303: teto de custo por visitante/usuário, por hora e de tokens. Acima dele, só o determinístico.
  const reservation = jevBudget.tryReserve(options.budgetKey);
  if (!reservation.ok) {
    telemetry.budgetDenial = reservation.reason;
    return finishDeterministic('budget-exceeded', [`budget-exceeded:${reservation.reason}`]);
  }

  const guard = options.guard ?? createJevCallGuard();
  const path: string[] = [];

  for (let i = 0; i < chain.length; i++) {
    const { provider, run } = chain[i]!;
    try {
      guard.canAttempt(i + 1);
    } catch {
      telemetry.attempts.push({ provider, outcome: 'guard-blocked', latencyMs: 0 });
      path.push(`${provider}:guard-blocked`);
      break;
    }

    const attemptStart = Date.now();
    try {
      const out = await run();
      const tokens = out.tokensInput + out.tokensOutput;
      try {
        guard.recordResponse(JSON.stringify(out.result), tokens);
      } catch {
        // Similaridade entre respostas não se aplica: cada provider responde uma vez.
      }
      jevBudget.recordTokens(tokens);
      telemetry.tokens += tokens;
      telemetry.attempts.push({
        provider,
        outcome: 'ok',
        latencyMs: Date.now() - attemptStart,
        tokens,
      });
      options.onUsage?.({
        provider,
        model: out.model,
        tokensInput: out.tokensInput,
        tokensOutput: out.tokensOutput,
        attemptNumber: i + 1,
      });
      path.push(provider);
      telemetry.latencyMs = Date.now() - started;
      out.result.providerPath = path;
      out.result.telemetry = telemetry;
      logInteractiveProvider(out.result.providerUsed, path);
      return out.result;
    } catch (error) {
      const outcome = classifyJevFailure(error);
      telemetry.attempts.push({ provider, outcome, latencyMs: Date.now() - attemptStart });
      path.push(`${provider}:${outcome}`);
    }
  }

  return finishDeterministic('all-failed', path);
}

/**
 * Uso oficial da primitiva `box` (`@typesafe-ai/sdk` v0.7.0 · `model: 'jev-preview'`)
 * com companion `noul` (`assinatura_visivel`) para localizar coordenadas normalizadas
 * (`top`, `bottom`, `left`, `right` em [0..1]) de uma assinatura em imagem PNG/JPEG.
 */
export async function locateSignatureBoxWithJev(
  imageBase64: string
): Promise<SignatureBoxInspectionResult> {
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/i, '').trim();
  const typesafeKey = getEnvKey('TYPESAFE_API_KEY');

  if (typesafeKey && cleanBase64.length > 16) {
    try {
      const client = new TypeSafeClient({
        apiKey: typesafeKey,
        defaultHeaders: { 'TypeSafe-Danger-Zone-Images': 'true' },
        timeout: 2500,
        retry: { maxRetries: 0 },
      });
      const asset = Image.fromBase64(cleanBase64);
      const questions = buildSignatureBoxQuestions();
      const response = await client.systemOne({
        state: asset,
        questions,
        model: 'jev-preview',
      });

      const visivelNoul = response.answers.assinatura_visivel.noul;
      return {
        providerUsed: 'typesafe-jev',
        hasVisibleSignature: visivelNoul >= 0.7,
        hasVisibleSignatureConfidence: visivelNoul,
        box: response.answers.regiao_assinatura.box,
        model: response.model,
      };
    } catch {
      // Fallback determinístico caso a conta TypeSafe esteja sem créditos ou offline
    }
  }

  const hasContent = cleanBase64.length > 16;
  return {
    providerUsed: 'deterministic',
    hasVisibleSignature: hasContent,
    hasVisibleSignatureConfidence: hasContent ? 0.85 : 0.1,
    box: {
      top: 0.18,
      bottom: 0.82,
      left: 0.12,
      right: 0.88,
    },
    model: 'deterministic-box-fallback',
  };
}
