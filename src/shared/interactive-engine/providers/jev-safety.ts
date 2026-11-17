/**
 * DEV-303 — Proteções do caminho JEV/Groq/OpenAI do chat (decide-live).
 *
 * - Kill switch por env (`NM_JEV_REMOTE_DISABLED`) e teto de custo server-side
 *   (por visitante/usuário, global por hora e tokens por hora).
 * - Guarda de chamada com os mesmos limites do LoopGuard (3 tentativas, 50k tokens).
 * - Validação Zod da saída dos providers: valor fora do domínio cai no determinístico.
 * - Códigos de falha sanitizados para telemetria (sem mensagem, sem PII).
 *
 * Sem rede, sem banco, sem imports de `backend/`.
 */

import { z } from 'zod';

// ── Config por env ────────────────────────────────────────────────────────────

function readEnv(name: string): string | undefined {
  const proc = typeof process !== 'undefined' ? process.env : undefined;
  const value = proc?.[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readTruthy(name: string): boolean {
  const v = readEnv(name)?.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = readEnv(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Kill switch: com `NM_JEV_REMOTE_DISABLED=true` nenhum provider pago/externo é chamado. */
export function isJevRemoteDisabled(): boolean {
  return readTruthy('NM_JEV_REMOTE_DISABLED');
}

export interface JevBudgetLimits {
  /** Janela do limite por visitante ou usuário. */
  keyWindowMs: number;
  /** Chamadas remotas por visitante anônimo (IP com hash) na janela. */
  maxPerAnonymous: number;
  /** Chamadas remotas por usuário logado na janela. */
  maxPerUser: number;
  /** Teto global de chamadas remotas por hora. */
  maxPerHour: number;
  /** Teto global de tokens por hora (quando o provider informa uso). */
  maxTokensPerHour: number;
}

export function readJevBudgetLimits(): JevBudgetLimits {
  return {
    keyWindowMs: 10 * 60 * 1000,
    maxPerAnonymous: readInt('NM_JEV_MAX_CALLS_PER_ANON', 6, 0, 1000),
    maxPerUser: readInt('NM_JEV_MAX_CALLS_PER_USER', 20, 0, 1000),
    maxPerHour: readInt('NM_JEV_MAX_CALLS_PER_HOUR', 400, 0, 100_000),
    maxTokensPerHour: readInt('NM_JEV_MAX_TOKENS_PER_HOUR', 150_000, 0, 50_000_000),
  };
}

// ── Orçamento (em memória, por processo) ──────────────────────────────────────

export type JevBudgetDenial = 'per-key' | 'global' | 'tokens';

export type JevBudgetReservation = { ok: true } | { ok: false; reason: JevBudgetDenial };

const HOUR_MS = 60 * 60 * 1000;
const MAX_TRACKED_KEYS = 5000;

/**
 * Janela deslizante em memória. Vale por processo Node (a VPS roda um processo);
 * com mais de uma instância, o teto efetivo é multiplicado pelo número delas.
 * Chaves: `u:<userId>` (logado) ou `ip:<hash>` (visitante). Nunca guardar IP puro.
 */
export class JevBudget {
  private readonly byKey = new Map<string, number[]>();
  private globalCalls: number[] = [];
  private tokenUse: Array<{ at: number; tokens: number }> = [];

  constructor(
    private readonly readLimits: () => JevBudgetLimits = readJevBudgetLimits,
    private readonly now: () => number = Date.now,
  ) {}

  private prune(now: number, limits: JevBudgetLimits) {
    this.globalCalls = this.globalCalls.filter((t) => now - t < HOUR_MS);
    this.tokenUse = this.tokenUse.filter((u) => now - u.at < HOUR_MS);
    for (const [key, hits] of this.byKey) {
      const vivos = hits.filter((t) => now - t < limits.keyWindowMs);
      if (vivos.length === 0) this.byKey.delete(key);
      else this.byKey.set(key, vivos);
    }
  }

  /**
   * Reserva uma chamada remota. Falha fechada: acima do teto, usa o determinístico.
   * Sem `key` (chamadores internos sem visitante), só valem os tetos globais.
   */
  tryReserve(key?: string): JevBudgetReservation {
    const limits = this.readLimits();
    const now = this.now();
    if (this.byKey.size > MAX_TRACKED_KEYS || this.globalCalls.length > limits.maxPerHour) {
      this.prune(now, limits);
    } else {
      this.globalCalls = this.globalCalls.filter((t) => now - t < HOUR_MS);
    }

    const maxKey = key?.startsWith('u:') ? limits.maxPerUser : limits.maxPerAnonymous;
    const hits = key ? (this.byKey.get(key) ?? []).filter((t) => now - t < limits.keyWindowMs) : [];

    if (key && hits.length >= maxKey) return { ok: false, reason: 'per-key' };
    if (this.globalCalls.length >= limits.maxPerHour) return { ok: false, reason: 'global' };
    const tokens = this.tokenUse
      .filter((u) => now - u.at < HOUR_MS)
      .reduce((acc, u) => acc + u.tokens, 0);
    if (limits.maxTokensPerHour > 0 && tokens >= limits.maxTokensPerHour) {
      return { ok: false, reason: 'tokens' };
    }

    this.globalCalls.push(now);
    if (key) {
      hits.push(now);
      this.byKey.set(key, hits);
      if (this.byKey.size > MAX_TRACKED_KEYS) {
        const maisAntiga = this.byKey.keys().next().value;
        if (maisAntiga !== undefined && maisAntiga !== key) this.byKey.delete(maisAntiga);
      }
    }
    return { ok: true };
  }

  recordTokens(tokens: number) {
    if (!Number.isFinite(tokens) || tokens <= 0) return;
    this.tokenUse.push({ at: this.now(), tokens: Math.trunc(tokens) });
  }

  reset() {
    this.byKey.clear();
    this.globalCalls = [];
    this.tokenUse = [];
  }
}

export const jevBudget = new JevBudget();

// ── Guarda de chamada (espelha o LoopGuard) ───────────────────────────────────

export interface JevCallGuard {
  canAttempt(attemptNumber: number): boolean;
  recordResponse(response: string, tokens: number): boolean;
}

const GUARD_MAX_ATTEMPTS = 3;
const GUARD_MAX_TOKENS = 50_000;

/** Mesmos limites do `LoopGuard` (3 tentativas e 50k tokens por sessão), sem depender de `backend/`. */
export function createJevCallGuard(): JevCallGuard {
  let tokens = 0;
  return {
    canAttempt(attemptNumber: number) {
      if (attemptNumber > GUARD_MAX_ATTEMPTS) {
        throw new Error(`jev-guard: máximo de ${GUARD_MAX_ATTEMPTS} tentativas`);
      }
      if (tokens >= GUARD_MAX_TOKENS) {
        throw new Error(`jev-guard: limite de ${GUARD_MAX_TOKENS} tokens`);
      }
      return true;
    },
    recordResponse(_response: string, usedTokens: number) {
      tokens += Math.max(0, usedTokens);
      return true;
    },
  };
}

// ── Validação da saída dos providers ─────────────────────────────────────────

const AREA_FOCO = z.enum([
  'prosperidade_financeira',
  'carreira_negocios',
  'relacionamentos_harmonia',
  'autoestima_expressao',
]);
const ONDE_ASSINA = z.enum([
  'identidade_registro',
  'presenca_digital',
  'rotina_trabalho',
  'marca_autoria',
]);
const ESTILO_PRESENCA = z.enum(['sobrenome_forte', 'ajuste_sutil', 'curto_direto']);
const SUBFOCO = z.enum([
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
]);
const NOUL = z.number().min(0).max(1);
const CLAREZA = z.number().min(0).max(2);

/** Saída JSON dos providers estruturados (Groq/OpenAI). */
export const structuredDecisionSchema = z.object({
  escopo_pronto_noul: NOUL,
  clareza_relato_score: CLAREZA,
  area_foco: AREA_FOCO,
  onde_assina: ONDE_ASSINA,
  estilo_presenca: ESTILO_PRESENCA,
  subfoco_momento: SUBFOCO,
  alerta_compliance_legal_noul: NOUL,
});

export type StructuredDecision = z.infer<typeof structuredDecisionSchema>;

/** `answers` do `systemOne` do TypeSafe (JEV). */
export const typesafeAnswersSchema = z.object({
  escopo_pronto: z.object({ noul: NOUL }),
  alerta_compliance_legal: z.object({ noul: NOUL }),
  clareza_relato: z.object({ score: CLAREZA }),
  area_foco: z.object({ choice: AREA_FOCO }),
  onde_assina: z.object({ choice: ONDE_ASSINA }),
  estilo_presenca: z.object({ choice: ESTILO_PRESENCA }),
  subfoco_momento: z.object({ choice: SUBFOCO }),
});

export type TypesafeAnswers = z.infer<typeof typesafeAnswersSchema>;

export class JevOutputError extends Error {
  readonly code = 'invalid-output';
  constructor() {
    super('invalid-output');
  }
}

export function parseStructuredDecision(raw: unknown): StructuredDecision {
  const parsed = structuredDecisionSchema.safeParse(raw);
  if (!parsed.success) throw new JevOutputError();
  return parsed.data;
}

export function parseTypesafeAnswers(raw: unknown): TypesafeAnswers {
  const parsed = typesafeAnswersSchema.safeParse(raw);
  if (!parsed.success) throw new JevOutputError();
  return parsed.data;
}

// ── Telemetria sanitizada ─────────────────────────────────────────────────────

export type JevAttemptOutcome =
  | 'ok'
  | 'invalid-output'
  | 'timeout'
  | 'budget-exceeded'
  | 'guard-blocked'
  | 'http-401'
  | 'http-402'
  | 'http-403'
  | 'http-429'
  | 'http-5xx'
  | 'http-other'
  | 'error';

export interface JevAttempt {
  provider: 'typesafe-jev' | 'groq-structured' | 'openai-structured';
  outcome: JevAttemptOutcome;
  latencyMs: number;
  tokens?: number;
}

export interface JevTelemetry {
  /** Tentativas remotas, na ordem. Sem mensagens de erro nem conteúdo do usuário. */
  attempts: JevAttempt[];
  /** Por que o determinístico respondeu (quando respondeu). */
  fallbackReason?:
    | 'mock-only'
    | 'remote-disabled'
    | 'no-keys'
    | 'short-report'
    | 'budget-exceeded'
    | 'all-failed';
  budgetDenial?: JevBudgetDenial;
  tokens: number;
  latencyMs: number;
}

/** Converte qualquer erro em um código fixo. Nunca devolve a mensagem original. */
export function classifyJevFailure(error: unknown): JevAttemptOutcome {
  if (error instanceof JevOutputError) return 'invalid-output';
  const name = (error as { name?: string } | null)?.name ?? '';
  const message = error instanceof Error ? error.message : '';
  if (name === 'AbortError' || /timeout|timed out|abort/i.test(message)) return 'timeout';
  const status =
    Number((error as { status?: number } | null)?.status) ||
    Number(/HTTP (\d{3})/.exec(message)?.[1]) ||
    0;
  if (status === 401) return 'http-401';
  if (status === 402) return 'http-402';
  if (status === 403) return 'http-403';
  if (status === 429) return 'http-429';
  if (status >= 500 && status <= 599) return 'http-5xx';
  if (status > 0) return 'http-other';
  return 'error';
}
