import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';
import type { InternalAppClient } from '../client/app-client.js';

export const VotosF6Schema = {};

export async function executeVotosF6Status(): Promise<{
  votos_total: number;
  breakdown: Record<string, number>;
  opcoes: Array<{ option: string; votes_count: number; updated_at: string }>;
}> {
  const db = getMcpDbClient();
  const { data, error } = await db.from('product_votes_v').select('*');

  if (error) {
    throw new Error(`Erro ao consultar votos F6: ${error.message}`);
  }

  const rows = data ?? [];
  let total = 0;
  const breakdown: Record<string, number> = {
    nome_bebe: 0,
    nome_empresa: 0,
    outro: 0,
  };

  for (const r of rows) {
    const count = Number(r.votes_count ?? 0);
    total += count;
    breakdown[r.option] = count;
  }

  return {
    votos_total: total,
    breakdown,
    opcoes: rows,
  };
}

export const DispararRecalculoF5Schema = {
  analysis_id: z.string().uuid('analysis_id deve ser um UUID válido').describe('ID da análise legada para recálculo no motor v3.'),
  dry_run: z
    .boolean()
    .optional()
    .default(true)
    .describe('Se true (padrão), simula o recálculo F5 sem salvar nova análise no banco.'),
};

export async function executeDispararRecalculoF5(
  params: {
    analysis_id: string;
    dry_run?: boolean;
  },
  appClient: InternalAppClient,
): Promise<any> {
  return appClient.recalcF5({
    analysisId: params.analysis_id,
    dryRun: params.dry_run ?? true,
  });
}
