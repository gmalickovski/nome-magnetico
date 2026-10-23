import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export type ClientMcpConfig = {
  port: number;
  host: string;
  appUrl: string;
  internalHmacSecret: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function loadConfig(): ClientMcpConfig {
  const port = Number(process.env.MCP_PORT ?? process.env.PORT ?? 8766);
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
  };
}
