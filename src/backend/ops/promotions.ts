import { supabase } from '../db/supabase';
import {
  assertRegistryReady,
  OpsRegistryError,
  registryState,
  type RegistryState,
} from './registry';

const COLUMNS =
  'id, name, product_types, discount_type, discount_value, starts_at, ends_at, is_active, deactivated_at, created_at';

export interface OpsPromotionRow {
  id: string;
  name: string;
  product_types: string[];
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  state: RegistryState;
}

type PromotionDbRow = Omit<OpsPromotionRow, 'state'>;

function toRow(row: PromotionDbRow): OpsPromotionRow {
  return { ...row, product_types: row.product_types ?? [], state: registryState(row) };
}

export interface ListPromotionsParams {
  state?: RegistryState;
  page: number;
  perPage: number;
}

export interface ListPromotionsResult {
  promotions: OpsPromotionRow[];
  total: number;
  page: number;
  per_page: number;
}

export async function listPromotions(params: ListPromotionsParams): Promise<ListPromotionsResult> {
  const now = new Date().toISOString();
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let query = supabase
    .from('promotions')
    .select(COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.state === 'inactive') {
    query = query.eq('is_active', false);
  } else if (params.state === 'scheduled') {
    query = query.eq('is_active', true).gt('starts_at', now);
  } else if (params.state === 'expired') {
    query = query.eq('is_active', true).lte('ends_at', now);
  } else if (params.state === 'active') {
    query = query.eq('is_active', true).lte('starts_at', now).gt('ends_at', now);
  }

  const { data, error, count } = await query;
  assertRegistryReady(error);
  if (error) throw error;

  return {
    promotions: ((data ?? []) as PromotionDbRow[]).map(toRow),
    total: count ?? 0,
    page: params.page,
    per_page: params.perPage,
  };
}

export interface CreatePromotionInput {
  name: string;
  productTypes: string[];
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startsAt: string | null;
  endsAt: string;
  actorId: string;
}

export async function createPromotion(input: CreatePromotionInput): Promise<OpsPromotionRow> {
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      name: input.name,
      product_types: input.productTypes,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      ...(input.startsAt ? { starts_at: input.startsAt } : {}),
      ends_at: input.endsAt,
      created_by: input.actorId,
    })
    .select(COLUMNS)
    .single();

  assertRegistryReady(error);
  if (error) throw error;

  console.info('[ops/promotions] create', { actorId: input.actorId, promotionId: data.id });
  return toRow(data as PromotionDbRow);
}

export async function setPromotionActive(
  id: string,
  isActive: boolean,
  actorId: string,
): Promise<OpsPromotionRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('promotions')
    .update({ is_active: isActive, deactivated_at: isActive ? null : now, updated_at: now })
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();

  assertRegistryReady(error);
  if (error) throw error;
  if (!data) throw new OpsRegistryError(404, 'Promoção não encontrada');

  console.info('[ops/promotions] set-active', { actorId, promotionId: id, isActive });
  return toRow(data as PromotionDbRow);
}
