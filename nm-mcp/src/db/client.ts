import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppConfig } from '../config.js';

let dbClient: any;

export function getMcpDbClient(config?: Pick<AppConfig, 'supabaseUrl' | 'supabaseAnonKey'>): any {
  if (dbClient) return dbClient;

  const url = config?.supabaseUrl || process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
  const key = config?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios para consultas do nm-mcp');
  }

  dbClient = createClient(url, key, {
    db: { schema: 'mcp_admin' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return dbClient;
}

export function setMockDbClient(mockClient: any): void {
  dbClient = mockClient;
}
