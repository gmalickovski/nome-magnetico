import { getMcpDbClient } from './client.js';
import { sanitizeAuditParameters, maskEmail } from '../utils/mask-email.js';

export type AuditEntry = {
  agent: string;
  tool: string;
  parameters: Record<string, unknown>;
  resultSummary?: Record<string, unknown>;
  dryRun?: boolean;
  status: 'success' | 'error' | 'rejected';
  errorMessage?: string;
};

export async function recordMcpAudit(entry: AuditEntry): Promise<void> {
  const sanitizedParams = sanitizeAuditParameters(entry.parameters);
  const sanitizedSummary = entry.resultSummary
    ? sanitizeAuditParameters(entry.resultSummary)
    : null;

  try {
    const supabase = getMcpDbClient();
    const { error } = await supabase.from('mcp_audit').insert({
      agent: entry.agent,
      tool: entry.tool,
      parameters: sanitizedParams,
      result_summary: sanitizedSummary,
      dry_run: entry.dryRun ?? true,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
    });

    if (error) {
      console.error('[nm-mcp/audit] Falha ao gravar auditoria no banco:', error.message);
    }
  } catch (err) {
    console.error('[nm-mcp/audit] Erro inesperado ao gravar auditoria:', err);
  }
}
