import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentPrincipal } from './context.js';
import { hasScope, hasAnyScope } from './auth/tokens.js';
import { TokenRateLimiter } from './auth/rate-limiter.js';
import { recordMcpAudit } from './db/audit.js';
import { InternalAppClient } from './client/app-client.js';
import { ListarAnalisesSchema, executeListarAnalises } from './tools/listar-analises.js';
import { StatusLeadSchema, executeStatusLead } from './tools/status-lead.js';
import { ReprocessarAnaliseSchema, executeReprocessarAnalise } from './tools/reprocessar.js';
import { ReenviarPdfSchema, executeReenviarPdf } from './tools/reenviar-pdf.js';
import { FunilSchema, executeFunil } from './tools/funil.js';
import { Lead360Schema, executeLead360 } from './tools/lead-360.js';
import {
  ListarPromocoesSchema,
  executeListarPromocoes,
  CriarPromocaoSchema,
  executeCriarPromocao,
} from './tools/promocoes.js';
import { StripeResumoSchema, executeStripeResumo } from './tools/stripe-resumo.js';
import {
  VotosF6Schema,
  executeVotosF6Status,
  DispararRecalculoF5Schema,
  executeDispararRecalculoF5,
} from './tools/f5-f6.js';
import { maskEmail } from './utils/mask-email.js';

export function createMcpServer({
  rateLimiter,
  appClient,
}: {
  rateLimiter: TokenRateLimiter;
  appClient: InternalAppClient;
}): McpServer {
  const server = new McpServer({
    name: 'nm-mcp-admin',
    version: '1.1.0',
  });

  // ==============================================================
  // FASE 1: Operação e Hotfix
  // ==============================================================

  // 1. Tool: listar_analises_gratis
  server.tool(
    'listar_analises_gratis',
    'Lista as análises gratuitas cadastradas, com filtros por status, e-mail e período. PII mascarada.',
    ListarAnalisesSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_analises_gratis',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Escopo read ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'read'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_analises_gratis',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeListarAnalises(params);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_analises_gratis',
          parameters: params as any,
          resultSummary: { totalRetornado: result.total },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_analises_gratis',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 2. Tool: status_lead
  server.tool(
    'status_lead',
    'Consulta o status consolidado de um lead ou cliente pelo e-mail (análise grátis, cadastro, assinatura).',
    StatusLeadSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'status_lead',
          parameters: { email: maskEmail(params.email) },
          status: 'rejected',
          errorMessage: 'Escopo read ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'read'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'status_lead',
          parameters: { email: maskEmail(params.email) },
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeStatusLead(params);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'status_lead',
          parameters: { email: maskEmail(params.email) },
          resultSummary: { encontrado: result.encontrado },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'status_lead',
          parameters: { email: maskEmail(params.email) },
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 3. Tool: reprocessar_analise
  server.tool(
    'reprocessar_analise',
    'Reprocessa uma análise gratuita com erro (gera PDF e conclui envio). Idempotente e com dry_run padrão.',
    ReprocessarAnaliseSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['reprocess', 'action'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reprocessar_analise',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Escopo reprocess ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'reprocess'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'action');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reprocessar_analise',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Rate limit de ações excedido (10/h)',
        });
        throw new Error(`Limite de ações excedido (10/h). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeReprocessarAnalise(params, appClient);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reprocessar_analise',
          parameters: params as any,
          resultSummary: { status: result.status, motivo: result.motivo },
          dryRun: params.dry_run ?? true,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reprocessar_analise',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 4. Tool: reenviar_pdf
  server.tool(
    'reenviar_pdf',
    'Reenvia o PDF de uma análise gratuita por e-mail para o lead. Idempotente e com dry_run padrão.',
    ReenviarPdfSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['resend', 'action'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reenviar_pdf',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Escopo resend ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'resend'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'action');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reenviar_pdf',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Rate limit de ações excedido (10/h)',
        });
        throw new Error(`Limite de ações excedido (10/h). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeReenviarPdf(params, appClient);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reenviar_pdf',
          parameters: params as any,
          resultSummary: { status: result.status, tem_pdf: result.tem_pdf },
          dryRun: params.dry_run ?? true,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'reenviar_pdf',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // ==============================================================
  // FASE 2: Growth & Finanças
  // ==============================================================

  // 5. Tool: funil
  server.tool(
    'funil',
    'Retorna as métricas agregadas do funil de conversão (leads, análises concluídas, vendas e taxas) para dia ou semana.',
    FunilSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth', 'finance'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'funil',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Escopo read/growth/finance ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui permissão para acessar o funil.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'funil',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeFunil(params);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'funil',
          parameters: params as any,
          resultSummary: {
            periodo: result.periodo,
            leads: result.leads_total,
            vendas: result.vendas_confirmadas,
          },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'funil',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 6. Tool: lead_360
  server.tool(
    'lead_360',
    'Visão 360° unificada do histórico do lead/cliente: cadastro, compras, análises v3 e legadas, e consentimento marketing.',
    Lead360Schema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'lead_360',
          parameters: { email: maskEmail(params.email) },
          status: 'rejected',
          errorMessage: 'Escopo read/growth ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui permissão para acessar o lead_360.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'lead_360',
          parameters: { email: maskEmail(params.email) },
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeLead360(params);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'lead_360',
          parameters: { email: maskEmail(params.email) },
          resultSummary: {
            cadastrado: result.is_registered,
            assinante: result.is_subscriber,
          },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'lead_360',
          parameters: { email: maskEmail(params.email) },
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 7. Tool: listar_promocoes
  server.tool(
    'listar_promocoes',
    'Lista as campanhas de promoção e cupons cadastradas, com filtro de estado (active, scheduled, expired, inactive).',
    ListarPromocoesSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth', 'promotions'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_promocoes',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Escopo read/growth/promotions ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui permissão para listar promoções.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_promocoes',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeListarPromocoes(params);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_promocoes',
          parameters: params as any,
          resultSummary: { total: result.total },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'listar_promocoes',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 8. Tool: criar_promocao
  server.tool(
    'criar_promocao',
    'Cria uma nova promoção ou cupom, respeitando obrigatoriamente os pisos de preço (DEV-178). dry_run padrão.',
    CriarPromocaoSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['promotions', 'action'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'criar_promocao',
          parameters: { name: params.name, dry_run: params.dry_run ?? true },
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Escopo promotions/action ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'promotions'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'action');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'criar_promocao',
          parameters: { name: params.name, dry_run: params.dry_run ?? true },
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Rate limit de ações excedido (10/h)',
        });
        throw new Error(`Limite de ações excedido (10/h). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeCriarPromocao(params, appClient);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'criar_promocao',
          parameters: { name: params.name, dry_run: params.dry_run ?? true },
          resultSummary: { status: result.status, ok: result.ok },
          dryRun: params.dry_run ?? true,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'criar_promocao',
          parameters: { name: params.name, dry_run: params.dry_run ?? true },
          dryRun: params.dry_run ?? true,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 9. Tool: stripe_resumo
  server.tool(
    'stripe_resumo',
    'Resumo financeiro só-leitura: total de vendas, receita líquida, reembolsos, MRR e saldo disponível no Stripe.',
    StripeResumoSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['finance', 'read'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'stripe_resumo',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Escopo finance ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'finance'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'stripe_resumo',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeStripeResumo(params, appClient);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'stripe_resumo',
          parameters: params as any,
          resultSummary: {
            periodo: result.periodo,
            vendas: result.vendas?.total,
            receita: result.vendas?.receita_reais,
          },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'stripe_resumo',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 10. Tool: votos_f6_status
  server.tool(
    'votos_f6_status',
    'Consulta a contagem agregada de votos da funcionalidade F6 (próximo produto do catálogo, zero PII).',
    VotosF6Schema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['read', 'growth'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'votos_f6_status',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Escopo read/growth ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'read'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'read');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'votos_f6_status',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Rate limit de leitura excedido (60/min)',
        });
        throw new Error(`Limite de leituras excedido (60/min). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeVotosF6Status();
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'votos_f6_status',
          parameters: params as any,
          resultSummary: { totalVotos: result.votos_total },
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'votos_f6_status',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 11. Tool: disparar_recalculo_f5
  server.tool(
    'disparar_recalculo_f5',
    'Dispara o recálculo F5 de uma análise legada para o motor v3 de scores. Idempotente e com dry_run padrão.',
    DispararRecalculoF5Schema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) throw new Error('Não autenticado');

      if (!hasAnyScope(principal.scopes, ['reprocess', 'action'])) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'disparar_recalculo_f5',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Escopo reprocess ausente',
        });
        throw new Error(`Permissão negada: o agente '${principal.agent}' não possui o escopo 'reprocess'.`);
      }

      const rateCheck = rateLimiter.check(principal.tokenHash, 'action');
      if (!rateCheck.allowed) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'disparar_recalculo_f5',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'rejected',
          errorMessage: 'Rate limit de ações excedido (10/h)',
        });
        throw new Error(`Limite de ações excedido (10/h). Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeDispararRecalculoF5(params, appClient);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'disparar_recalculo_f5',
          parameters: params as any,
          resultSummary: { status: result.status, scoreV3: result.scoreV3 ?? result.prospectiveScoreV3 },
          dryRun: params.dry_run ?? true,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'disparar_recalculo_f5',
          parameters: params as any,
          dryRun: params.dry_run ?? true,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  return server;
}
