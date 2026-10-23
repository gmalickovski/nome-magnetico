import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';

export const Lead360Schema = {
  email: z.string().email('Email inválido').describe('Endereço de e-mail do lead ou cliente para visão 360°.'),
};

export async function executeLead360(params: { email: string }): Promise<Record<string, unknown>> {
  const db = getMcpDbClient();
  const { data, error } = await db.rpc('get_lead_360', { email: params.email.trim() });

  if (error) {
    throw new Error(`Erro ao consultar lead 360: ${error.message}`);
  }

  const result = typeof data === 'string' ? JSON.parse(data) : data;
  return result ?? { error: 'lead não encontrado' };
}
