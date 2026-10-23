import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export type McpScope =
  | 'read'
  | 'reprocess'
  | 'resend'
  | 'growth'
  | 'finance'
  | 'promotions'
  | 'action';

export type AgentTokenConfig = {
  agent: string;
  token_hash: string; // SHA-256 em hexadecimal minúsculo
  scopes: McpScope[];
  is_active?: boolean;
};

export type AppConfig = {
  port: number;
  host: string;
  appUrl: string;
  internalHmacSecret: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  tokens: AgentTokenConfig[];
};

export function loadTokensConfig(): AgentTokenConfig[] {
  const rawTokens = process.env.MCP_TOKENS_JSON?.trim();
  if (rawTokens) {
    try {
      const parsed = JSON.parse(rawTokens);
      if (Array.isArray(parsed)) {
        return parsed as AgentTokenConfig[];
      }
    } catch (err) {
      console.error('[nm-mcp] Falha ao processar MCP_TOKENS_JSON:', err);
    }
  }

  // Fallback para variáveis individuais se configuradas
  // Ex: MCP_TOKEN_HASH_GROK_BOT="<hash>"
  const tokens: AgentTokenConfig[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('MCP_TOKEN_HASH_') && value) {
      const agent = key.replace('MCP_TOKEN_HASH_', '').toLowerCase();
      tokens.push({
        agent,
        token_hash: value.trim().toLowerCase(),
        scopes: ['read', 'reprocess', 'resend'],
        is_active: true,
      });
    }
  }

  return tokens;
}

export function loadConfig(): AppConfig {
  const port = Number(process.env.MCP_PORT ?? process.env.PORT ?? 8765);
  const host = process.env.MCP_HOST ?? '127.0.0.1';
  const appUrl = (process.env.APP_URL ?? 'http://127.0.0.1:4321').replace(/\/$/, '');
  const internalHmacSecret =
    process.env.INTERNAL_HMAC_SECRET ?? process.env.INTERNAL_API_SECRET ?? '';
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

  return {
    port,
    host,
    appUrl,
    internalHmacSecret,
    supabaseUrl,
    supabaseAnonKey,
    tokens: loadTokensConfig(),
  };
}
