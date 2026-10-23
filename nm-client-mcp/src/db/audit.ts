import { getClientMcpDbClient } from './client.js';
import { sanitizeAuditParameters } from '../utils/sanitize.js';

export interface RecordClientAuditParams {
  tokenHash: string;
  tool: string;
  parameters: Record<string, unknown>;
  status: 'success' | 'error' | 'rejected';
  errorMessage?: string;
}

export async function recordClientAudit(params: RecordClientAuditParams): Promise<void> {
  const sanitized = sanitizeAuditParameters(params.parameters);

  try {
    const db = getClientMcpDbClient();
    const { error } = await db.from('mcp_client_audit').insert({
      token_hash: params.tokenHash,
      tool: params.tool,
      parameters: sanitized,
      status: params.status,
      error_message: params.errorMessage ?? null,
    });

    if (error) {
      console.error('[nm-client-mcp/audit] Falha ao gravar auditoria:', error.message);
    }
  } catch (err) {
    console.error('[nm-client-mcp/audit] Exceção ao gravar auditoria:', err);
  }
}
