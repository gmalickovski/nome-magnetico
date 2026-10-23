import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentPrincipal } from './context.js';
import { hasScope } from './auth/tokens.js';
import { TokenRateLimiter } from './auth/rate-limiter.js';
import { recordMcpAudit } from './db/audit.js';
import { InternalAppClient } from './client/app-client.js';
import { ListarAnalisesSchema, executeListarAnalises } from './tools/listar-analises.js';
import { StatusLeadSchema, executeStatusLead } from './tools/status-lead.js';
import { ReprocessarAnaliseSchema, executeReprocessarAnalise } from './tools/reprocessar.js';
import { ReenviarPdfSchema, executeReenviarPdf } from './tools/reenviar-pdf.js';

export function createMcpServer({
  rateLimiter,
  appClient,
}: {
  rateLimiter: TokenRateLimiter;
  appClient: InternalAppClient;
}): McpServer {
  const server = new McpServer({
    name: 'nm-mcp-admin',
    version: '1.0.0',
  });

  // 1. Tool: listar_analises_gratis
  server.tool(
    'listar_analises_gratis',
    'Lista as análises gratuitas cadastradas, com filtros por status, e-mail e período. PII mascarada.',
    ListarAnalisesSchema,
    async (params) => {
      const principal = getCurrentPrincipal();
      if (!principal) {
        throw new Error('Não autenticado');
      }

      if (!hasScope(principal.scopes, 'read')) {
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
      if (!principal) {
        throw new Error('Não autenticado');
      }

      if (!hasScope(principal.scopes, 'read')) {
        await recordMcpAudit({
          agent: principal.agent,
          tool: 'status_lead',
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
          tool: 'status_lead',
          parameters: params as any,
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
          parameters: params as any,
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
          parameters: params as any,
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
      if (!principal) {
        throw new Error('Não autenticado');
      }

      if (!hasScope(principal.scopes, 'reprocess')) {
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
      if (!principal) {
        throw new Error('Não autenticado');
      }

      if (!hasScope(principal.scopes, 'resend')) {
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

  return server;
}
