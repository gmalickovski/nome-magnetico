import { z } from 'zod';
import { supabase } from '../db/supabase';
import { invalidateUserSubscriptionsCache } from '../cache/memo';
import { TRIAL_NOT_FOUND } from './promo-math';

export interface RedeemTrialResult {
  ok: boolean;
  status: number;
  error?: string;
  alreadyActive?: boolean;
  alreadyRedeemed?: boolean;
  endsAt?: string | null;
  skippedActiveProducts?: string[];
}

const resultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    status: z.literal(200),
    endsAt: z.string().datetime({ offset: true }),
    skippedActiveProducts: z.array(z.string()),
  }),
  z.object({
    ok: z.literal(false),
    status: z.union([z.literal(400), z.literal(409)]),
    error: z.string(),
    alreadyActive: z.boolean().optional(),
    alreadyRedeemed: z.boolean().optional(),
  }),
]);

/** A RPC valida a configuração e confirma uso, assinaturas e perfil atomicamente. */
export async function redeemAccessTrial(params: {
  trialCode: string;
  userId: string;
  userEmail?: string | null;
}): Promise<RedeemTrialResult> {
  const trialCode = params.trialCode.trim();
  if (!trialCode) return { ok: false, status: 400, error: TRIAL_NOT_FOUND };

  try {
    const { data, error } = await supabase.rpc('redeem_access_trial', {
      p_trial_code: trialCode,
      p_user_id: params.userId,
      p_user_email: params.userEmail?.trim() || null,
    });
    if (error) throw new Error('Trial transaction failed');
    const result = resultSchema.parse(data);
    if (result.ok) invalidateUserSubscriptionsCache(params.userId);
    return result;
  } catch {
    // Não expor código, e-mail ou detalhe de SQL no log/client.
    console.error('[trial-redeem] Falha na transação de resgate');
    return { ok: false, status: 503, error: 'Não foi possível concluir o resgate agora. Tente de novo em instantes.' };
  }
}
