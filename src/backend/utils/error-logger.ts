/**
 * error-logger.ts — Registra erros operacionais do Nome Magnético na tabela error_logs.
 *
 * Tipos suportados:
 *   'pdf_generation'   — falha ao gerar PDF
 *   'ai_loop'          — Loop Guard ativado (respostas similares ou máx. tentativas)
 *   'ai_timeout'       — IA não respondeu a tempo
 *   'checkout_stripe'  — erro crítico no checkout Stripe
 *   'checkout_pix'     — legado (PIX custom removido; cobrança só via Checkout Stripe)
 *   'other'            — demais erros
 */

import { supabase } from '../db/supabase';

export type ErrorType =
  | 'pdf_generation'
  | 'ai_loop'
  | 'ai_timeout'
  | 'checkout_stripe'
  | 'checkout_pix'
  | 'other';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorLogParams {
  type: ErrorType;
  message: string;
  severity?: ErrorSeverity;
  userId?: string | null;
  analysisId?: string | null;
  details?: Record<string, unknown>;
  durationMs?: number;
}

/**
 * Registra um erro na tabela `error_logs` do Supabase.
 * Falha silenciosa — nunca lança exceção para não interromper o fluxo principal.
 */
export async function logError(params: ErrorLogParams): Promise<void> {
  try {
    const { error } = await supabase.from('error_logs').insert({
      type: params.type,
      severity: params.severity ?? 'error',
      user_id: params.userId ?? null,
      analysis_id: params.analysisId ?? null,
      message: params.message,
      details: params.details ?? null,
      duration_ms: params.durationMs ?? null,
      resolved: false,
    });
    if (error) {
      console.error('[ErrorLogger] Falha ao salvar error_log:', error.message);
    }
  } catch (err) {
    console.error('[ErrorLogger] Exceção ao salvar error_log:', err);
  }
}
