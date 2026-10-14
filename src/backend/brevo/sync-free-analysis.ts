/**
 * Sync server-side do contato da análise grátis com a Brevo.
 *
 * Upsert idempotente por e-mail (POST /v3/contacts, updateEnabled).
 * Não envia e-mail de campanha: só cria ou atualiza o contato na lista.
 *
 * Consentimento (LGPD): o formulário da análise grátis e save-lead / analise_leads
 * não têm campo de marketing. A sync só acontece quando o body de POST /api/analyze
 * traz marketing_consent === true. Qualquer outro valor é no-op.
 *
 * Sem BREVO_API_KEY ou BREVO_FREE_LIST_ID, a função retorna sem chamar a API.
 * Erros e timeout não propagam: a resposta da análise não pode depender da Brevo.
 *
 * Chaves lidas em runtime via readServerEnv (o Vite não pode gravar o segredo no bundle).
 */

import { readServerEnv } from '../env/runtime';

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';
const BREVO_TIMEOUT_MS = 4_000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface FreeAnalysisBrevoInput {
  email: string;
  nome: string;
  /** Data da análise. YYYY-MM-DD ou Date (formatada em America/Sao_Paulo). */
  analiseData: string | Date;
  score: number | null;
  analiseId: string;
  marketingConsent: unknown;
}

export interface FreeAnalysisBrevoAttributes {
  NOME: string;
  ANALISE_DATA: string;
  ANALISE_ID: string;
  SCORE?: number;
}

export interface FreeAnalysisBrevoPayload {
  email: string;
  updateEnabled: true;
  attributes: FreeAnalysisBrevoAttributes;
  listIds: number[];
}

/** Consentimento explícito. Só o booleano true autoriza a sync. */
export function hasFreeAnalysisMarketingConsent(consent: unknown): boolean {
  return consent === true;
}

/** YYYY-MM-DD. Strings já nesse formato passam direto; Date usa America/Sao_Paulo. */
export function formatAnaliseData(value: string | Date, timeZone = 'America/Sao_Paulo'): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = DATE_ONLY.exec(trimmed);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return '';
    return formatDateInZone(parsed, timeZone);
  }

  if (Number.isNaN(value.getTime())) return '';
  return formatDateInZone(value, timeZone);
}

function formatDateInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Monta o body do upsert. Função pura: não lê env nem chama a rede.
 * Devolve null se e-mail, data, id ou listId forem inválidos.
 * SCORE entra só quando é um número finito (0 é válido).
 */
export function buildFreeAnalysisBrevoPayload(
  input: Omit<FreeAnalysisBrevoInput, 'marketingConsent'>,
  listId: number,
): FreeAnalysisBrevoPayload | null {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL.test(email)) return null;
  if (!Number.isInteger(listId) || listId <= 0) return null;

  const analiseData = formatAnaliseData(input.analiseData);
  if (!DATE_ONLY.test(analiseData)) return null;

  const analiseId = input.analiseId.trim();
  if (!analiseId) return null;

  const attributes: FreeAnalysisBrevoAttributes = {
    NOME: input.nome.trim(),
    ANALISE_DATA: analiseData,
    ANALISE_ID: analiseId,
  };

  if (typeof input.score === 'number' && Number.isFinite(input.score)) {
    attributes.SCORE = input.score;
  }

  return {
    email,
    updateEnabled: true,
    attributes,
    listIds: [listId],
  };
}

function readBrevoListId(): number | null {
  const raw = readServerEnv('BREVO_FREE_LIST_ID');
  if (!raw) return null;
  const listId = Number(raw);
  if (!Number.isInteger(listId) || listId <= 0) return null;
  return listId;
}

/**
 * Upsert do contato na lista da análise grátis. No-op sem consentimento ou sem env.
 * Nunca lança: falha de rede, HTTP ou timeout só gera warn.
 */
export async function syncFreeAnalysisToBrevo(input: FreeAnalysisBrevoInput): Promise<void> {
  try {
    if (!hasFreeAnalysisMarketingConsent(input.marketingConsent)) return;

    const apiKey = readServerEnv('BREVO_API_KEY');
    const listId = readBrevoListId();
    if (!apiKey || listId == null) return;

    const payload = buildFreeAnalysisBrevoPayload(input, listId);
    if (!payload) return;

    const response = await fetch(BREVO_CONTACTS_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[brevo] sync da análise grátis falhou: HTTP ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[brevo] sync da análise grátis ignorada:', message);
  }
}
