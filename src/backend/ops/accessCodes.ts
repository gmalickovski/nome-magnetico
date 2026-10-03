import { supabase } from '../db/supabase';
import { quoteFilter, searchToken } from './search';
import {
  assertRegistryReady,
  isUniqueViolation,
  OpsRegistryError,
  registryState,
  type RegistryState,
} from './registry';

const COLUMNS =
  'id, code, kind, product_types, trial_days, discount_type, discount_value, expires_at, note, is_active, deactivated_at, created_at';

export type AccessCodeKind = 'trial' | 'gift' | 'coupon';

export interface OpsAccessCodeRow {
  id: string;
  code: string;
  kind: AccessCodeKind;
  product_types: string[];
  trial_days: number | null;
  discount_type: 'percent' | 'fixed' | null;
  discount_value: number | null;
  expires_at: string | null;
  note: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  state: RegistryState;
  /** Resgates de trial/gift já gravados em `trial_redemptions`. Cupom não é contado aqui. */
  redemptions: number | null;
}

type AccessCodeDbRow = Omit<OpsAccessCodeRow, 'state' | 'redemptions'>;

function toRow(row: AccessCodeDbRow, redemptions: number | null): OpsAccessCodeRow {
  return {
    ...row,
    product_types: row.product_types ?? [],
    state: registryState({ is_active: row.is_active, ends_at: row.expires_at }),
    redemptions,
  };
}

async function redemptionCount(row: AccessCodeDbRow): Promise<number | null> {
  if (row.kind === 'coupon') return null;
  const { count, error } = await supabase
    .from('trial_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('trial_code', row.code);
  if (error) return null;
  return count ?? 0;
}

export interface ListAccessCodesParams {
  q?: string;
  kind?: AccessCodeKind;
  state?: RegistryState;
  page: number;
  perPage: number;
}

export interface ListAccessCodesResult {
  access_codes: OpsAccessCodeRow[];
  total: number;
  page: number;
  per_page: number;
}

export async function listAccessCodes(params: ListAccessCodesParams): Promise<ListAccessCodesResult> {
  const now = new Date().toISOString();
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let query = supabase
    .from('access_codes')
    .select(COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.kind) query = query.eq('kind', params.kind);

  if (params.state === 'inactive') {
    query = query.eq('is_active', false);
  } else if (params.state === 'expired') {
    query = query.eq('is_active', true).lte('expires_at', now);
  } else if (params.state === 'active') {
    query = query.eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`);
  }

  const token = params.q ? searchToken(params.q) : '';
  if (token) {
    const pattern = quoteFilter(`%${token}%`);
    query = query.or(`code.ilike.${pattern},note.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  assertRegistryReady(error);
  if (error) throw error;

  const rows = (data ?? []) as AccessCodeDbRow[];
  const counts = await Promise.all(rows.map(redemptionCount));

  return {
    access_codes: rows.map((row, index) => toRow(row, counts[index] ?? null)),
    total: count ?? 0,
    page: params.page,
    per_page: params.perPage,
  };
}

export interface CreateAccessCodeInput {
  code: string;
  kind: AccessCodeKind;
  productTypes: string[];
  trialDays: number | null;
  discountType: 'percent' | 'fixed' | null;
  discountValue: number | null;
  expiresAt: string | null;
  note: string | null;
  actorId: string;
}

export async function createAccessCode(input: CreateAccessCodeInput): Promise<OpsAccessCodeRow> {
  const { data, error } = await supabase
    .from('access_codes')
    .insert({
      code: input.code,
      kind: input.kind,
      product_types: input.productTypes,
      trial_days: input.trialDays,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      expires_at: input.expiresAt,
      note: input.note,
      created_by: input.actorId,
    })
    .select(COLUMNS)
    .single();

  assertRegistryReady(error);
  if (isUniqueViolation(error)) {
    throw new OpsRegistryError(409, 'Já existe um código com este valor.');
  }
  if (error) throw error;

  console.info('[ops/access-codes] create', { actorId: input.actorId, accessCodeId: data.id, kind: input.kind });
  const row = data as AccessCodeDbRow;
  return toRow(row, await redemptionCount(row));
}

export async function setAccessCodeActive(
  id: string,
  isActive: boolean,
  actorId: string,
): Promise<OpsAccessCodeRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('access_codes')
    .update({ is_active: isActive, deactivated_at: isActive ? null : now, updated_at: now })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();

  assertRegistryReady(error);
  if (error) throw error;
  if (!data) throw new OpsRegistryError(404, 'Código não encontrado');

  console.info('[ops/access-codes] set-active', { actorId, accessCodeId: id, isActive });
  const row = data as AccessCodeDbRow;
  return toRow(row, await redemptionCount(row));
}
