import type { SupabaseClient } from '@supabase/supabase-js';

export async function invokeSendFreePdf(
  supabase: SupabaseClient,
  leadId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-free-pdf', {
    body: { leadId },
  });

  if (error) {
    throw new Error(error.message ?? 'Falha ao invocar send-free-pdf');
  }

  const payload = data as { error?: string; success?: boolean } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }
}
