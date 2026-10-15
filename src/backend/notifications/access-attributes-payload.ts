/**
 * Contrato dos atributos de acesso enviados ao Brevo via n8n
 * (`marketing.payment_confirmed` e `marketing.access_refunded`).
 *
 * Função pura: não lê ambiente, não chama rede e não grava nada.
 * `opt_in` é informativo. O n8n não deve incluir o contato na lista 16 sem ele.
 *
 * Datas civis em America/Sao_Paulo, via Intl (sem offset fixo).
 */

export type AccessAttributeOrigin = 'compra' | 'reembolso';

export type AccessAttributeStatus = 'ativo' | 'reembolsado';

export type AccessPurchaseKind = 'new' | 'renewal';

/** Linha de `subscriptions` já carregada. A cadeia usa `renewedFrom`. */
export interface AccessAttributesSubscription {
  id: string;
  productType: string;
  startsAt: Date | string;
  endsAt: Date | string;
  refundedAt?: Date | string | null;
  purchaseKind?: string | null;
  renewedFrom?: string | null;
}

export interface BuildAccessAttributesInput {
  email: string;
  /** Nome completo do perfil (`profiles.nome`). A primeira palavra é `nome`. */
  nomeCompleto: string;
  userId: string;
  origem: AccessAttributeOrigin;
  productType: string;
  /** `purchase_kind` da assinatura que disparou o evento. */
  purchaseKind: string | null | undefined;
  /** `amount_paid` em centavos. `null` quando a assinatura não tem valor. */
  amountPaidCents: number | null | undefined;
  /** Âncora da cadeia atual. Fallback de datas quando a linha não está na lista. */
  subscriptionId: string;
  subscriptionStartsAt: Date | string;
  subscriptionEndsAt: Date | string;
  now: Date;
  /** Todas as subscriptions do usuário (qualquer product_type). */
  subscriptions: AccessAttributesSubscription[];
  optIn: boolean;
}

export interface AccessAttributesPayload {
  email: string;
  nome: string;
  sobrenome: string;
  user_id: string;
  origem: AccessAttributeOrigin;
  product_type: string;
  purchase_kind: AccessPurchaseKind;
  valor: number | null;
  attributes: {
    ACESSO_INICIO: string;
    ACESSO_FIM: string;
    PRODUTO: string;
    RENOVACOES: number;
    STATUS_ACESSO: AccessAttributeStatus;
  };
  opt_in: boolean;
}

const SAO_PAULO_TZ = 'America/Sao_Paulo';

function instant(value: Date | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/** YYYY-MM-DD no calendário de São Paulo. Data inválida vira 1970-01-01. */
export function formatSaoPauloDate(value: Date | string): string {
  const time = instant(value);
  if (time == null) return '1970-01-01';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(time));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const year = read('year');
  const month = read('month');
  const day = read('day');
  if (!year || !month || !day) return '1970-01-01';
  return `${year}-${month}-${day}`;
}

function splitNome(nomeCompleto: string): { nome: string; sobrenome: string } {
  const parts = (nomeCompleto ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nome: '', sobrenome: '' };
  const [nome, ...resto] = parts;
  return { nome: nome ?? '', sobrenome: resto.join(' ') };
}

function isRefunded(row: AccessAttributesSubscription): boolean {
  return row.refundedAt != null && row.refundedAt !== '';
}

function asPurchaseKind(value: string | null | undefined): AccessPurchaseKind {
  return value?.trim() === 'renewal' ? 'renewal' : 'new';
}

function valorEmReais(cents: number | null | undefined): number | null {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
}

/**
 * Da âncora até a raiz, seguindo `renewedFrom`, só no mesmo product_type.
 * A raiz (sem pai, ou pai ausente) fica no início.
 */
function currentChain(
  subscriptions: AccessAttributesSubscription[],
  anchorId: string,
  productType: string,
): AccessAttributesSubscription[] {
  const byId = new Map(subscriptions.map((row) => [row.id, row]));
  const fromRoot: AccessAttributesSubscription[] = [];
  const seen = new Set<string>();
  let cursor = byId.get(anchorId);
  while (cursor && !seen.has(cursor.id)) {
    if ((cursor.productType ?? '').trim() !== productType) break;
    seen.add(cursor.id);
    fromRoot.push(cursor);
    const parentId = cursor.renewedFrom?.trim();
    cursor = parentId ? byId.get(parentId) : undefined;
  }
  return fromRoot.reverse();
}

function maxEndsAt(rows: AccessAttributesSubscription[]): Date | string | null {
  let best: Date | string | null = null;
  let bestTime = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    const time = instant(row.endsAt);
    if (time == null || time < bestTime) continue;
    best = row.endsAt;
    bestTime = time;
  }
  return best;
}

export function buildAccessAttributesPayload(input: BuildAccessAttributesInput): AccessAttributesPayload {
  const { nome, sobrenome } = splitNome(input.nomeCompleto ?? '');
  const productType = (input.productType ?? '').trim();
  const subscriptions = input.subscriptions ?? [];
  const anchor = subscriptions.find((row) => row.id === input.subscriptionId) ?? null;
  const chain = currentChain(subscriptions, input.subscriptionId, productType);
  const firstOpen = chain.find((row) => !isRefunded(row));
  const inicioSource = firstOpen?.startsAt ?? anchor?.startsAt ?? input.subscriptionStartsAt;

  const openForProduct = subscriptions.filter(
    (row) => (row.productType ?? '').trim() === productType && !isRefunded(row),
  );
  const fimSource = maxEndsAt(openForProduct) ?? anchor?.endsAt ?? input.subscriptionEndsAt;

  const nowMs = input.now.getTime();
  const hasActiveAccess = openForProduct.some((row) => {
    const ends = instant(row.endsAt);
    return ends != null && ends > nowMs;
  });
  const status: AccessAttributeStatus =
    input.origem === 'reembolso' ? (hasActiveAccess ? 'ativo' : 'reembolsado') : 'ativo';

  const renovacoes = subscriptions.filter(
    (row) => asPurchaseKind(row.purchaseKind) === 'renewal' && !isRefunded(row),
  ).length;

  return {
    email: (input.email ?? '').trim().toLowerCase(),
    nome,
    sobrenome,
    user_id: (input.userId ?? '').trim(),
    origem: input.origem === 'reembolso' ? 'reembolso' : 'compra',
    product_type: productType,
    purchase_kind: asPurchaseKind(input.purchaseKind),
    valor: valorEmReais(input.amountPaidCents),
    attributes: {
      ACESSO_INICIO: formatSaoPauloDate(inicioSource),
      ACESSO_FIM: formatSaoPauloDate(fimSource),
      PRODUTO: productType,
      RENOVACOES: renovacoes,
      STATUS_ACESSO: status,
    },
    opt_in: input.optIn === true,
  };
}
