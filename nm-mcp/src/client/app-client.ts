import { createHmac } from 'node:crypto';

export type AppClientConfig = {
  appUrl: string;
  hmacSecret: string;
};

export class InternalAppClient {
  private appUrl: string;
  private hmacSecret: string;

  constructor(config: AppClientConfig) {
    this.appUrl = config.appUrl.replace(/\/$/, '');
    this.hmacSecret = config.hmacSecret;
  }

  private signPayload(rawBody: string, timestamp: number): string {
    const message = `${timestamp}.${rawBody}`;
    return createHmac('sha256', this.hmacSecret).update(message).digest('hex');
  }

  private async postInternal<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    if (!this.hmacSecret) {
      throw new Error('INTERNAL_HMAC_SECRET não configurado no nm-mcp');
    }

    const timestamp = Date.now();
    const rawBody = JSON.stringify(body);
    const signature = this.signPayload(rawBody, timestamp);

    const url = `${this.appUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Signature': signature,
        'X-Internal-Timestamp': String(timestamp),
      },
      body: rawBody,
    });

    const text = await response.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Resposta inválida do app (${response.status}): ${text.slice(0, 100)}`);
    }

    if (!response.ok || json.ok === false) {
      throw new Error(json.error ?? `Erro HTTP ${response.status} ao chamar ${endpoint}`);
    }

    return json as T;
  }

  async reprocessLead(params: { leadId: string; dryRun?: boolean }): Promise<{
    ok: boolean;
    status: string;
    reason?: string;
    leadId: string;
    emailMasked: string;
    currentStatus?: string;
  }> {
    return this.postInternal('/api/internal/mcp/reprocess-lead', {
      leadId: params.leadId,
      dryRun: params.dryRun ?? true,
    });
  }

  async resendPdf(params: { leadId: string; dryRun?: boolean }): Promise<{
    ok: boolean;
    status: string;
    leadId: string;
    emailMasked: string;
    hasPdf?: boolean;
  }> {
    return this.postInternal('/api/internal/mcp/resend-pdf', {
      leadId: params.leadId,
      dryRun: params.dryRun ?? true,
    });
  }
}
