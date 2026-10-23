import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createClientMcpServer } from '../src/server.js';
import { ClientRateLimiter } from '../src/auth/rate-limiter.js';
import { ClientInternalAppClient } from '../src/client/app-client.js';

describe('nm-client-mcp Isolation & Admin Shielding (DEV-208)', () => {
  it('garante que nenhuma ferramenta administrativa está presente no client MCP', () => {
    const rateLimiter = new ClientRateLimiter();
    const appClient = new ClientInternalAppClient({ appUrl: 'http://localhost', hmacSecret: 'secret' });
    const server = createClientMcpServer({ rateLimiter, appClient });

    // Inspecionar ferramentas registradas no McpServer
    const registeredTools = (server as any)._registeredTools ?? {};
    const toolNames = Object.keys(registeredTools);

    // 1. Ferramentas que DEVEM existir
    assert.deepEqual(toolNames.sort(), [
      'consultar_score_comprador',
      'explicar_score',
      'gerar_analise_social',
    ]);

    // 2. Ferramentas administrativas que NUNCA podem existir
    const forbiddenAdminTools = [
      'listar_analises_gratis',
      'status_lead',
      'reprocessar_analise',
      'reenviar_pdf',
      'funil',
      'lead_360',
      'listar_promocoes',
      'criar_promocao',
      'stripe_resumo',
      'votos_f6_status',
      'disparar_recalculo_f5',
    ];

    for (const forbidden of forbiddenAdminTools) {
      assert.equal(
        toolNames.includes(forbidden),
        false,
        `Violação de isolamento: ferramenta admin '${forbidden}' encontrada no nm-client-mcp`,
      );
    }
  });
});
