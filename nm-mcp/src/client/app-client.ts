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

  async createPromotion(params: {
    name: string;
    productTypes?: string[];
    discountType: 'percent' | 'fixed';
    discountValue: number;
    startsAt?: string | null;
    endsAt: string;
    bannerText?: string | null;
    dryRun?: boolean;
  }): Promise<{
    ok: boolean;
    dry_run: boolean;
    status: string;
    message?: string;
    simulation?: any;
    promotion?: any;
  }> {
    return this.postInternal('/api/internal/mcp/create-promotion', {
      name: params.name,
      productTypes: params.productTypes ?? [],
      discountType: params.discountType,
      discountValue: params.discountValue,
      startsAt: params.startsAt ?? null,
      endsAt: params.endsAt,
      bannerText: params.bannerText ?? null,
      dryRun: params.dryRun ?? true,
    });
  }

  async recalcF5(params: { analysisId: string; dryRun?: boolean }): Promise<{
    ok: boolean;
    dry_run?: boolean;
    status: string;
    analysisId?: string;
    originalId?: string;
    newAnalysisId?: string;
    scoreV3?: number;
    prospectiveScoreV3?: number;
    prospectiveNivel?: string;
    nivel?: string;
  }> {
    return this.postInternal('/api/internal/mcp/recalc-f5', {
      analysisId: params.analysisId,
      dryRun: params.dryRun ?? true,
    });
  }

  async getStripeResumo(params?: { periodo?: 'mes' | 'semana' | 'total' }): Promise<{
    ok: boolean;
    periodo: string;
    since: string;
    vendas: { total: number; receita_centavos: number; receita_reais: number };
    reembolsos: { total: number; valor_centavos: number; valor_reais: number };
    mrr: { assinaturas_ativas: number; mrr_estimado_centavos: number; mrr_estimado_reais: number };
    stripe_balance: {
      disponivel_centavos: number | null;
      pendente_centavos: number | null;
      moeda: string;
      status: string;
    };
  }> {
    return this.postInternal('/api/internal/mcp/stripe-resumo', {
      periodo: params?.periodo ?? 'mes',
    });
  }
}
