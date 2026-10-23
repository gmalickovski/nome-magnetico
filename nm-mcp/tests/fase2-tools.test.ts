import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { executeFunil } from '../src/tools/funil.js';
import { executeLead360 } from '../src/tools/lead-360.js';
import { executeListarPromocoes, executeCriarPromocao } from '../src/tools/promocoes.js';
import { executeStripeResumo } from '../src/tools/stripe-resumo.js';
import { executeVotosF6Status, executeDispararRecalculoF5 } from '../src/tools/f5-f6.js';
import { setMockDbClient } from '../src/db/client.js';
import { hasAnyScope, hasScope } from '../src/auth/tokens.js';
import type { McpScope } from '../src/config.js';
import type { InternalAppClient } from '../src/client/app-client.js';

describe('nm-mcp Fase 2 Tools & Permissions', () => {
  beforeEach(() => {
    setMockDbClient(null);
  });

  it('funil agrega métricas e taxas de conversão corretamente', async () => {
    const mockDb = {
      rpc: async (fn: string, args: any) => {
        if (fn === 'get_funil_metrics') {
          return {
            data: {
              periodo: args.periodo,
              since: '2026-10-22T00:00:00Z',
              leads_total: 100,
              analises_gratis_concluidas: 80,
              vendas_confirmadas: 8,
              reembolsos: 1,
              receita_centavos: 77600,
              conversao_lead_venda_pct: 8.0,
              conversao_analise_venda_pct: 10.0,
            },
            error: null,
          };
        }
        return { data: null, error: new Error('unknown rpc') };
      },
    };

    setMockDbClient(mockDb);

    const result = await executeFunil({ periodo: 'dia' });
    assert.equal(result.periodo, 'dia');
    assert.equal(result.leads_total, 100);
    assert.equal(result.vendas_confirmadas, 8);
    assert.equal(result.receita_centavos, 77600);
    assert.equal(result.receita_reais, 776.0);
    assert.equal(result.conversao_lead_venda_pct, 8.0);
  });

  it('lead_360 consulta histórico unificado do lead', async () => {
    const mockDb = {
      rpc: async (fn: string, args: any) => {
        if (fn === 'get_lead_360') {
          return {
            data: {
              email: args.email,
              is_registered: true,
              is_subscriber: true,
              profile: { id: 'p1', nome: 'Ana Costa' },
              subscriptions: [{ id: 's1', product_type: 'nome_social', amount_paid: 9700 }],
              analyses: [{ id: 'a1', score_v3: 85, score_version: 'v3' }],
              free_analyses: [{ id: 'f1', status: 'completed', has_pdf: true }],
              marketing_opt_in: { opted_in: true, opt_in_date: '2026-10-20T10:00:00Z' },
              summary: { total_paid_cents: 9700, active_subscriptions_count: 1 },
            },
            error: null,
          };
        }
        return { data: null, error: new Error('unknown rpc') };
      },
    };

    setMockDbClient(mockDb);

    const result = await executeLead360({ email: 'ana@example.com' });
    assert.equal(result.email, 'ana@example.com');
    assert.equal(result.is_registered, true);
    assert.equal(result.is_subscriber, true);
    assert.equal((result as any).summary.total_paid_cents, 9700);
  });

  it('listar_promocoes retorna lista de promoções com filtro', async () => {
    const mockPromos = [
      { id: 'promo-1', name: 'Black Friday', state: 'active' },
      { id: 'promo-2', name: 'Natal', state: 'scheduled' },
    ];

    const mockDb = {
      from: (table: string) => ({
        select: () => ({
          order: () => ({
            eq: (_col: string, val: string) => {
              const filtered = mockPromos.filter((p) => p.state === val);
              return Promise.resolve({ data: filtered, error: null });
            },
            then: (resolve: any) => resolve({ data: mockPromos, error: null }),
          }),
        }),
      }),
    };

    setMockDbClient(mockDb);

    const all = await executeListarPromocoes({});
    assert.equal(all.total, 2);

    const activeOnly = await executeListarPromocoes({ state: 'active' });
    assert.equal(activeOnly.total, 1);
    assert.equal(activeOnly.promotions[0].name, 'Black Friday');
  });

  it('criar_promocao usa dry_run true por padrão e chama endpoint interno', async () => {
    let captured: any = null;
    const mockClient = {
      createPromotion: async (params: any) => {
        captured = params;
        return {
          ok: true,
          dry_run: params.dryRun,
          status: 'simulated',
          simulation: { name: params.name },
        };
      },
    } as unknown as InternalAppClient;

    const res = await executeCriarPromocao(
      {
        name: 'Flash Sale',
        discount_type: 'percent',
        discount_value: 15,
        ends_at: '2026-11-01T00:00:00Z',
      },
      mockClient,
    );

    assert.equal(res.ok, true);
    assert.equal(res.dry_run, true);
    assert.equal(captured.dryRun, true);
    assert.equal(captured.name, 'Flash Sale');
    assert.equal(captured.discountValue, 15);
  });

  it('stripe_resumo chama o endpoint interno de finanças', async () => {
    let captured: any = null;
    const mockClient = {
      getStripeResumo: async (params: any) => {
        captured = params;
        return {
          ok: true,
          periodo: params.periodo,
          vendas: { total: 10, receita_reais: 970.0 },
          reembolsos: { total: 0, valor_reais: 0 },
          mrr: { assinaturas_ativas: 10, mrr_estimado_reais: 970.0 },
          stripe_balance: { status: 'ok', disponivel_centavos: 97000 },
        };
      },
    } as unknown as InternalAppClient;

    const res = await executeStripeResumo({ periodo: 'mes' }, mockClient);
    assert.equal(res.ok, true);
    assert.equal(res.periodo, 'mes');
    assert.equal(captured.periodo, 'mes');
    assert.equal(res.vendas.total, 10);
    assert.equal(res.stripe_balance.disponivel_centavos, 97000);
  });

  it('votos_f6_status totaliza e sumariza opções sem PII', async () => {
    const mockVotes = [
      { option: 'nome_bebe', votes_count: 42, updated_at: '2026-10-22T00:00:00Z' },
      { option: 'nome_empresa', votes_count: 28, updated_at: '2026-10-22T00:00:00Z' },
      { option: 'outro', votes_count: 10, updated_at: '2026-10-22T00:00:00Z' },
    ];

    const mockDb = {
      from: (table: string) => ({
        select: () => Promise.resolve({ data: mockVotes, error: null }),
      }),
    };

    setMockDbClient(mockDb);

    const res = await executeVotosF6Status();
    assert.equal(res.votos_total, 80);
    assert.equal(res.breakdown.nome_bebe, 42);
    assert.equal(res.breakdown.nome_empresa, 28);
    assert.equal(res.breakdown.outro, 10);
  });

  it('disparar_recalculo_f5 usa dry_run true por padrão', async () => {
    let captured: any = null;
    const mockClient = {
      recalcF5: async (params: any) => {
        captured = params;
        return {
          ok: true,
          dry_run: params.dryRun,
          status: 'simulated',
          prospectiveScoreV3: 92,
        };
      },
    } as unknown as InternalAppClient;

    const res = await executeDispararRecalculoF5(
      { analysis_id: 'a0000000-0000-0000-0000-000000000001' },
      mockClient,
    );

    assert.equal(res.ok, true);
    assert.equal(res.dry_run, true);
    assert.equal(captured.dryRun, true);
    assert.equal(captured.analysisId, 'a0000000-0000-0000-0000-000000000001');
  });

  it('hasAnyScope valida os novos escopos de Growth e Finanças', () => {
    const growthScopes: McpScope[] = ['growth'];
    assert.equal(hasAnyScope(growthScopes, ['read', 'growth']), true);
    assert.equal(hasAnyScope(growthScopes, ['finance']), false);
    assert.equal(hasAnyScope(growthScopes, ['promotions']), false);

    const financeScopes: McpScope[] = ['finance'];
    assert.equal(hasAnyScope(financeScopes, ['finance', 'read']), true);
    assert.equal(hasAnyScope(financeScopes, ['reprocess']), false);

    const promoScopes: McpScope[] = ['promotions'];
    assert.equal(hasAnyScope(promoScopes, ['promotions', 'action']), true);
    assert.equal(hasAnyScope(promoScopes, ['reprocess']), false);
  });
});
