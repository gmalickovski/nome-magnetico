import { z } from 'zod';
import type { InternalAppClient } from '../client/app-client.js';

export const StripeResumoSchema = {
  periodo: z
    .enum(['mes', 'semana', 'total'])
    .optional()
    .default('mes')
    .describe("Período para resumo de vendas e reembolsos: 'mes' (mês atual), 'semana' (últimos 7 dias) ou 'total'."),
};

export async function executeStripeResumo(
  params: { periodo?: 'mes' | 'semana' | 'total' },
  appClient: InternalAppClient,
): Promise<any> {
  return appClient.getStripeResumo({ periodo: params.periodo ?? 'mes' });
}
