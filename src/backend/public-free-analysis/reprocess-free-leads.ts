import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildFreeLeadAnalysisRecord,
  dbBirthDateToPtBr,
  renderFreeLeadPdfBase64,
} from './generate-free-lead-pdf';
import { invokeSendFreePdf } from './invoke-send-free-pdf';

export type FreeAnalysisLeadRow = {
  id: string;
  email: string;
  nome_completo: string;
  data_nascimento: string;
  status: string;
  error_message?: string | null;
  created_at?: string | null;
};

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const head = local.length <= 1 ? local || '*' : local[0];
  return `${head}***@${domain}`;
}

export type ReprocessCliOptions = {
  ids?: string[];
  errorLike?: string;
  limit: number;
  dryRun: boolean;
  pauseMs: number;
};

export function parseReprocessArgv(argv: string[]): ReprocessCliOptions {
  let ids: string[] | undefined;
  let errorLike: string | undefined;
  let limit = 50;
  let dryRun = true;
  let pauseMs = 1_500;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ids') {
      const raw = argv[i + 1];
      if (!raw) throw new Error('--ids requer uma lista separada por vírgula');
      ids = raw.split(',').map((id) => id.trim()).filter(Boolean);
      i += 1;
      continue;
    }
    if (arg === '--error-like') {
      errorLike = argv[i + 1];
      if (!errorLike) throw new Error('--error-like requer um padrão');
      i += 1;
      continue;
    }
    if (arg === '--limit') {
      const n = Number(argv[i + 1]);
      if (!Number.isFinite(n) || n < 1) throw new Error('--limit deve ser um inteiro >= 1');
      limit = Math.floor(n);
      i += 1;
      continue;
    }
    if (arg === '--pause-ms') {
      const n = Number(argv[i + 1]);
      if (!Number.isFinite(n) || n < 0) throw new Error('--pause-ms deve ser um inteiro >= 0');
      pauseMs = Math.floor(n);
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--execute') {
      dryRun = false;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      throw new Error('HELP');
    }
    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!ids?.length && !errorLike) {
    throw new Error('Informe --ids ou --error-like');
  }

  return { ids, errorLike, limit, dryRun, pauseMs };
}

export async function fetchLeadsForReprocess(
  supabase: SupabaseClient,
  options: Pick<ReprocessCliOptions, 'ids' | 'errorLike' | 'limit'>,
): Promise<FreeAnalysisLeadRow[]> {
  if (options.ids?.length) {
    const { data, error } = await supabase
      .from('free_analyses_leads')
      .select('id, email, nome_completo, data_nascimento, status, error_message, created_at')
      .in('id', options.ids);

    if (error) throw new Error(error.message);
    return (data ?? []) as FreeAnalysisLeadRow[];
  }

  let query = supabase
    .from('free_analyses_leads')
    .select('id, email, nome_completo, data_nascimento, status, error_message, created_at')
    .eq('status', 'error')
    .order('created_at', { ascending: true })
    .limit(options.limit);

  if (options.errorLike) {
    query = query.ilike('error_message', `%${options.errorLike}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as FreeAnalysisLeadRow[];
}

export type ReprocessRunSummary = {
  listed: number;
  skippedComplete: number;
  processed: number;
  failed: number;
};

export type ReprocessLeadDeps = {
  updateProcessing: (leadId: string) => Promise<void>;
  savePdf: (leadId: string, pdfBase64: string) => Promise<void>;
  sendFreePdf: (leadId: string) => Promise<void>;
  markError: (leadId: string, message: string) => Promise<void>;
  generatePdfBase64: (lead: FreeAnalysisLeadRow) => Promise<string>;
  sleep: (ms: number) => Promise<void>;
  log: (line: string) => void;
};

export async function runReprocessFreeLeads(
  leads: FreeAnalysisLeadRow[],
  options: Pick<ReprocessCliOptions, 'dryRun' | 'pauseMs'>,
  deps: ReprocessLeadDeps,
): Promise<ReprocessRunSummary> {
  const summary: ReprocessRunSummary = {
    listed: leads.length,
    skippedComplete: 0,
    processed: 0,
    failed: 0,
  };

  for (let index = 0; index < leads.length; index += 1) {
    const lead = leads[index];
    const masked = maskEmail(lead.email);
    const prefix = `[${lead.id}] status=${lead.status} email=${masked}`;

    if (lead.status === 'complete') {
      summary.skippedComplete += 1;
      deps.log(`${prefix} → skip (já complete)`);
      continue;
    }

    if (options.dryRun) {
      deps.log(`${prefix} → dry-run: processing → PDF → send-free-pdf`);
      continue;
    }

    try {
      deps.log(`${prefix} → processing…`);
      await deps.updateProcessing(lead.id);

      const pdfBase64 = await deps.generatePdfBase64(lead);
      await deps.savePdf(lead.id, pdfBase64);

      deps.log(`${prefix} → send-free-pdf…`);
      await deps.sendFreePdf(lead.id);

      summary.processed += 1;
      deps.log(`${prefix} → ok (edge function conclui envio)`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      summary.failed += 1;
      deps.log(`${prefix} → error: ${message}`);
      await deps.markError(lead.id, message);
    }

    if (index < leads.length - 1 && options.pauseMs > 0) {
      await deps.sleep(options.pauseMs);
    }
  }

  return summary;
}

export function createDefaultReprocessDeps(
  supabase: SupabaseClient,
  log: (line: string) => void = console.log,
): ReprocessLeadDeps {
  return {
    log,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    updateProcessing: async (leadId) => {
      const { error } = await supabase
        .from('free_analyses_leads')
        .update({ status: 'processing', error_message: null })
        .eq('id', leadId);
      if (error) throw new Error(error.message);
    },
    savePdf: async (leadId, pdfBase64) => {
      const { error } = await supabase
        .from('free_analyses_leads')
        .update({ pdf_base64: pdfBase64, status: 'processing' })
        .eq('id', leadId);
      if (error) throw new Error(error.message);
    },
    sendFreePdf: (leadId) => invokeSendFreePdf(supabase, leadId),
    markError: async (leadId, message) => {
      const { error } = await supabase
        .from('free_analyses_leads')
        .update({ status: 'error', error_message: message })
        .eq('id', leadId);
      if (error) {
        log(`[${leadId}] falha ao gravar error_message: ${error.message}`);
      }
    },
    generatePdfBase64: async (lead) => {
      const dataPt = dbBirthDateToPtBr(lead.data_nascimento);
      const dataDb = lead.data_nascimento.slice(0, 10);
      const { record: analysis } = buildFreeLeadAnalysisRecord({
        nomeCompleto: lead.nome_completo,
        dataNascimentoPt: dataPt,
        dataNascimentoDb: dataDb,
        createdAt: lead.created_at ?? new Date().toISOString(),
      });
      const firstName = lead.nome_completo.split(' ')[0] || lead.nome_completo;
      return renderFreeLeadPdfBase64(analysis, firstName);
    },
  };
}
