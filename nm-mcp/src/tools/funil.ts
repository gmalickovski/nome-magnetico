import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';

export const FunilSchema = {
  periodo: z
    .enum(['dia', 'semana'])
    .optional()
    .default('dia')
    .describe("Período de agregação do funil: 'dia' (desde a meia-noite) ou 'semana' (últimos 7 dias)."),
};

export async function executeFunil(params: {
  periodo?: 'dia' | 'semana';
}): Promise<{
  periodo: string;
  since: string;
  leads_total: number;
  analises_gratis_concluidas: number;
  vendas_confirmadas: number;
  reembolsos: number;
  receita_centavos: number;
  receita_reais: number;
  conversao_lead_venda_pct: number;
  conversao_analise_venda_pct: number;
}> {
  const periodo = params.periodo ?? 'dia';
  const db = getMcpDbClient();

  const { data, error } = await db.rpc('get_funil_metrics', { periodo });
  if (error) {
    throw new Error(`Erro ao consultar métricas do funil: ${error.message}`);
  }

  const result = typeof data === 'string' ? JSON.parse(data) : data;
  const receitaCentavos = Number(result?.receita_centavos ?? 0);

  return {
    periodo: result?.periodo ?? periodo,
    since: result?.since ?? new Date().toISOString(),
    leads_total: Number(result?.leads_total ?? 0),
    analises_gratis_concluidas: Number(result?.analises_gratis_concluidas ?? 0),
    vendas_confirmadas: Number(result?.vendas_confirmadas ?? 0),
    reembolsos: Number(result?.reembolsos ?? 0),
    receita_centavos: receitaCentavos,
    receita_reais: Number((receitaCentavos / 100).toFixed(2)),
    conversao_lead_venda_pct: Number(result?.conversao_lead_venda_pct ?? 0),
    conversao_analise_venda_pct: Number(result?.conversao_analise_venda_pct ?? 0),
  };
}
