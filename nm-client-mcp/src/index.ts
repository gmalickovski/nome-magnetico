import { createServer } from 'node:http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { loadConfig } from './config.js';
import { createClientMcpServer } from './server.js';
import { ClientRateLimiter } from './auth/rate-limiter.js';
import { ClientInternalAppClient } from './client/app-client.js';
import { authenticateClientToken } from './auth/tokens.js';
import { runWithClientPrincipal, type ClientPrincipal } from './context.js';

const config = loadConfig();
const rateLimiter = new ClientRateLimiter(60, 60000);
const appClient = new ClientInternalAppClient({
  appUrl: config.appUrl,
  hmacSecret: config.internalHmacSecret,
});

const mcpServer = createClientMcpServer({
  rateLimiter,
  appClient,
});

const activeTransports = new Map<
  string,
  { transport: SSEServerTransport; principal: ClientPrincipal }
>();

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // Headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (url.pathname === '/healthz' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'nm-client-mcp' }));
    return;
  }

  // Endpoint SSE
  if (url.pathname === '/sse') {
    const authResult = await authenticateClientToken(req.headers.authorization);
    if (!authResult.ok) {
      res.writeHead(authResult.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: authResult.error }));
      return;
    }

    try {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;
      activeTransports.set(sessionId, {
        transport,
        principal: authResult.principal,
      });

      req.on('close', () => {
        activeTransports.delete(sessionId);
      });

      await mcpServer.connect(transport);
    } catch (err: unknown) {
      console.error('[nm-client-mcp] Erro ao conectar transporte SSE:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Falha ao estabelecer conexão SSE' }));
      }
    }
    return;
  }

  // Endpoint de mensagens (POST /messages?sessionId=...)
  if (url.pathname === '/messages' && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'sessionId ausente' }));
      return;
    }

    const entry = activeTransports.get(sessionId);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Sessão MCP não encontrada ou expirada' }));
      return;
    }

    await runWithClientPrincipal(entry.principal, async () => {
      await entry.transport.handlePostMessage(req, res);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
});

httpServer.listen(config.port, config.host, () => {
  console.info(`[nm-client-mcp] Servidor ativo em http://${config.host}:${config.port} (SSE: /sse)`);
});
