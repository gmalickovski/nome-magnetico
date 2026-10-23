import http from 'node:http';
import { URL } from 'node:url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { loadConfig } from './config.js';
import { authenticateBearerToken } from './auth/tokens.js';
import { TokenRateLimiter } from './auth/rate-limiter.js';
import { InternalAppClient } from './client/app-client.js';
import { createMcpServer } from './server.js';
import { requestContext, type RequestPrincipal } from './context.js';

const config = loadConfig();
const rateLimiter = new TokenRateLimiter();
const appClient = new InternalAppClient({
  appUrl: config.appUrl,
  hmacSecret: config.internalHmacSecret,
});

const mcpServer = createMcpServer({
  rateLimiter,
  appClient,
});

// Armazena as conexões SSE ativas indexadas por sessionId
const activeTransports = new Map<
  string,
  { transport: SSEServerTransport; principal: RequestPrincipal }
>();

function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Internal-Signature, X-Internal-Timestamp',
  );
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
  const pathname = reqUrl.pathname;

  // Endpoint de health check simples (sem vazar PII nem config)
  if (pathname === '/healthz' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'nm-mcp' }));
    return;
  }

  // Autenticação Bearer Token
  const auth = authenticateBearerToken(req.headers.authorization, config.tokens);
  if (!auth.ok) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: auth.error }));
    return;
  }

  const principal = auth.principal;

  // 1. Início de sessão SSE: GET /sse
  if (req.method === 'GET' && (pathname === '/sse' || pathname === '/')) {
    try {
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;

      activeTransports.set(sessionId, { transport, principal });

      transport.onclose = () => {
        activeTransports.delete(sessionId);
      };

      await mcpServer.connect(transport);
      await transport.start();
    } catch (err) {
      console.error('[nm-mcp] Erro ao iniciar conexão SSE:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Falha ao inicializar SSE' }));
      }
    }
    return;
  }

  // 2. Envio de mensagens MCP: POST /messages?sessionId=...
  if (req.method === 'POST' && pathname === '/messages') {
    const sessionId = reqUrl.searchParams.get('sessionId');
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Parâmetro sessionId ausente' }));
      return;
    }

    const session = activeTransports.get(sessionId);
    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Sessão MCP não encontrada ou encerrada' }));
      return;
    }

    // Executa a mensagem no contexto do agente autenticado
    await requestContext.run({ principal: session.principal }, async () => {
      try {
        await session.transport.handlePostMessage(req, res);
      } catch (err) {
        console.error('[nm-mcp] Erro ao processar mensagem POST:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Erro ao processar mensagem' }));
        }
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Rota não encontrada' }));
});

// Limpeza periódica do rate limiter
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000).unref();

server.listen(config.port, config.host, () => {
  console.log(`[nm-mcp] Servidor MCP escutando estritamente em http://${config.host}:${config.port}`);
  console.log(`[nm-mcp] Agentes configurados: ${config.tokens.map((t) => t.agent).join(', ') || 'nenhum'}`);
});
