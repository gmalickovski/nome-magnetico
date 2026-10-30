import { supabase } from './supabase';
import type { Analysis, AnalysisProductType, AnalysisStatus } from './analyses';

/** Alinhado ao timeout de IA + margem para persistência e PDF. */
export const ANALYSIS_STALE_PROCESSING_MS = 10 * 60 * 1000;

const STALE_ERROR_MESSAGE =
  'A análise expirou antes de concluir (tempo limite do servidor). Você pode tentar novamente.';

export function isAnalysisStatusStale(
  status: AnalysisStatus,
  createdAtIso: string,
  nowMs = Date.now(),
): boolean {
  if (status !== 'pending' && status !== 'processing') return false;
  const createdMs = new Date(createdAtIso).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return nowMs - createdMs >= ANALYSIS_STALE_PROCESSING_MS;
}

export async function markAnalysisFailed(
  analysisId: string,
  errorMessage: string,
): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .update({
      status: 'error',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', analysisId)
    .select()
    .single();

  if (error) return null;
  return data as Analysis;
}

/**
 * Marca análises pending/processing antigas como error para liberar nova tentativa.
 */
export async function failStaleAnalysesForUser(
  userId: string,
  productType?: AnalysisProductType,
): Promise<number> {
  const staleBefore = new Date(Date.now() - ANALYSIS_STALE_PROCESSING_MS).toISOString();

  let selectQuery = supabase
    .from('analyses')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .lt('created_at', staleBefore);

  if (productType) {
    selectQuery = selectQuery.eq('product_type', productType);
  }

  const { data: rows, error: selectError } = await selectQuery;
  if (selectError || !rows?.length) return 0;

  const ids = rows.map((r) => r.id as string);
  const { error: updateError } = await supabase
    .from('analyses')
    .update({
      status: 'error',
      error_message: STALE_ERROR_MESSAGE,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (updateError) {
    console.error('[analysis-processing] Falha ao marcar análises stale:', updateError.message);
    return 0;
  }

  return ids.length;
}

export async function reconcileStaleAnalysis(analysis: Analysis): Promise<Analysis> {
  if (!isAnalysisStatusStale(analysis.status, analysis.created_at)) {
    return analysis;
  }
  const updated = await markAnalysisFailed(analysis.id, STALE_ERROR_MESSAGE);
  return updated ?? { ...analysis, status: 'error', error_message: STALE_ERROR_MESSAGE };
}

export { STALE_ERROR_MESSAGE };
