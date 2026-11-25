import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeEmailDedupKey } from './guards';

/**
 * Pré-preenchimento do chat com os dados da análise grátis (DEV-343).
 *
 * Quem fez a análise grátis e depois cria a conta não precisa digitar nome e data de novo.
 * Só LEITURA, no servidor, e só para conta com e-mail confirmado (senão alguém poderia cadastrar
 * o e-mail de outra pessoa para ler o nome e a data dela). Nada vai na URL e nada é gravado: os
 * valores só entram nos campos que o chat mostra para a pessoa confirmar.
 */

export interface LeadPrefill {
  /** Nome completo de nascimento, como foi digitado na análise grátis. */
  nome: string;
  /** Data no formato dd/mm/aaaa (o mesmo do chat). */
  data: string;
}

function dbDateToInput(dbDate: string | null | undefined): string {
  if (!dbDate) return '';
  const parts = String(dbDate).slice(0, 10).split('-');
  if (parts.length !== 3 || parts.some((p) => !p)) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export async function findLeadPrefill(
  admin: SupabaseClient,
  email: string | null | undefined,
  emailConfirmed: boolean,
): Promise<LeadPrefill | null> {
  if (!emailConfirmed || !email?.trim()) return null;
  const lower = email.trim().toLowerCase();
  const chaves = [...new Set([lower, normalizeEmailDedupKey(lower)])];

  const { data, error } = await admin
    .from('free_analyses_leads')
    .select('nome_completo, data_nascimento')
    .in('email', chaves)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  const nome = String(data[0]?.nome_completo ?? '').replace(/\s+/g, ' ').trim();
  const dataInput = dbDateToInput(data[0]?.data_nascimento as string | null);
  if (nome.length < 3 || !dataInput) return null;
  return { nome, data: dataInput };
}
