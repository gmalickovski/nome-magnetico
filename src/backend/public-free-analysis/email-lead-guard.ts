import type { SupabaseClient } from '@supabase/supabase-js';
import { EMAIL_COOLDOWN_MESSAGE, EMAIL_COOLDOWN_MS } from './guards';

export type EmailLeadGuardResult =
  | { allowed: true }
  | { allowed: false; status: 409; code: 'already_requested' }
  | { allowed: false; status: 429; message: string };

type LeadRow = { id: string; created_at: string };

export async function checkFreeAnalysisEmailEligibility(
  supabase: SupabaseClient,
  dedupEmail: string,
  now = Date.now(),
): Promise<EmailLeadGuardResult> {
  const { data: existingLeads, error } = await supabase
    .from('free_analyses_leads')
    .select('id, created_at')
    .eq('email', dedupEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Erro ao verificar e-mail: ${error.message}`);
  }

  const lead = (existingLeads?.[0] ?? null) as LeadRow | null;
  if (!lead) {
    return { allowed: true };
  }

  const createdAt = new Date(lead.created_at).getTime();
  if (now - createdAt < EMAIL_COOLDOWN_MS) {
    return { allowed: false, status: 429, message: EMAIL_COOLDOWN_MESSAGE };
  }

  return { allowed: false, status: 409, code: 'already_requested' };
}
