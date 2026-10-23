import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getCurrentClientPrincipal } from './context.js';
import { ClientRateLimiter } from './auth/rate-limiter.js';
import { recordClientAudit } from './db/audit.js';
import { ClientInternalAppClient } from './client/app-client.js';
import { ConsultarScoreSchema, executeConsultarScore } from './tools/consultar-score.js';
import { GerarAnaliseSchema, executeGerarAnalise } from './tools/gerar-analise.js';
import { ExplicarScoreSchema, executeExplicarScore } from './tools/explicar-score.js';

export function createClientMcpServer({
  rateLimiter,
  appClient,
}: {
  rateLimiter: ClientRateLimiter;
  appClient: ClientInternalAppClient;
}): McpServer {
  const server = new McpServer({
    name: 'nm-client-mcp',
    version: '1.0.0',
  });

  // 1. Tool: consultar_score_comprador
  server.tool(
    'consultar_score_comprador',
    'Consulta o score numérico, nível de harmonia e compatibilidade de uma compra ativa. Sem expor pesos crus ou dados de saúde.',
    ConsultarScoreSchema,
    async (params) => {
      const principal = getCurrentClientPrincipal();
      if (!principal) throw new Error('Não autenticado');

      const rateCheck = rateLimiter.check(principal.tokenHash);
      if (!rateCheck.allowed) {
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'consultar_score_comprador',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Limite de requisições excedido (60/min)',
        });
        throw new Error(`Limite de requisições excedido. Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeConsultarScore(params, principal.userId, appClient);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'consultar_score_comprador',
          parameters: params as any,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'consultar_score_comprador',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 2. Tool: gerar_analise_social
  server.tool(
    'gerar_analise_social',
    'Gera análise de harmonização e avalia nomes candidatos para quem possui compra ativa. Debita cota da compra e retorna aviso legal.',
    GerarAnaliseSchema,
    async (params) => {
      const principal = getCurrentClientPrincipal();
      if (!principal) throw new Error('Não autenticado');

      const rateCheck = rateLimiter.check(principal.tokenHash);
      if (!rateCheck.allowed) {
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'gerar_analise_social',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Limite de requisições excedido (60/min)',
        });
        throw new Error(`Limite de requisições excedido. Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeGerarAnalise(params, principal.userId, appClient);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'gerar_analise_social',
          parameters: params as any,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'gerar_analise_social',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  // 3. Tool: explicar_score
  server.tool(
    'explicar_score',
    'Explicação pedagógica e espiritual do score e recomendações práticas para a assinatura do cliente com aviso legal.',
    ExplicarScoreSchema,
    async (params) => {
      const principal = getCurrentClientPrincipal();
      if (!principal) throw new Error('Não autenticado');

      const rateCheck = rateLimiter.check(principal.tokenHash);
      if (!rateCheck.allowed) {
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'explicar_score',
          parameters: params as any,
          status: 'rejected',
          errorMessage: 'Limite de requisições excedido (60/min)',
        });
        throw new Error(`Limite de requisições excedido. Tente novamente em ${rateCheck.retryAfterSeconds}s.`);
      }

      try {
        const result = await executeExplicarScore(params, principal.userId, appClient);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'explicar_score',
          parameters: params as any,
          status: 'success',
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await recordClientAudit({
          tokenHash: principal.tokenHash,
          tool: 'explicar_score',
          parameters: params as any,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
  );

  return server;
}
