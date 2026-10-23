import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';
import { maskEmail } from '../utils/mask-email.js';

export const ListarAnalisesSchema = {
  status: z
    .enum(['pending', 'processing', 'complete', 'error'])
    .optional()
    .describe('Filtro por status da análise gratuita'),
  email: z
    .string()
    .optional()
    .describe('Filtro por endereço de e-mail do lead'),
  created_after: z
    .string()
    .optional()
    .describe('Filtro por data de criação mínima (ISO 8601)'),
  created_before: z
    .string()
    .optional()
    .describe('Filtro por data de criação máxima (ISO 8601)'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(50)
    .describe('Quantidade máxima de registros a retornar (1 a 100, default: 50)'),
};

export async function executeListarAnalises(params: z.infer<z.ZodObject<typeof ListarAnalisesSchema>>) {
  const supabase = getMcpDbClient();
  let query = supabase
    .from('analises_gratis_v')
    .select('id, email, nome_completo, data_nascimento, status, error_message, has_pdf, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 50);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.email) {
    query = query.eq('email', params.email.trim().toLowerCase());
  }

  if (params.created_after) {
    query = query.gte('created_at', params.created_after);
  }

  if (params.created_before) {
    query = query.lte('created_at', params.created_before);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Erro ao listar análises gratuitas: ${error.message}`);
  }

  const sanitizedList = (data ?? []).map((row: any) => ({
    id: row.id,
    email_masked: maskEmail(row.email),
    nome_completo: row.nome_completo,
    data_nascimento: row.data_nascimento,
    status: row.status,
    has_pdf: row.has_pdf,
    error_message: row.error_message,
    created_at: row.created_at,
    completed_at: row.completed_at,
  }));

  return {
    total: sanitizedList.length,
    analises: sanitizedList,
  };
}
