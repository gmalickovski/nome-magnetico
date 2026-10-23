import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';
import { maskEmail } from '../utils/mask-email.js';

export const StatusLeadSchema = {
  email: z.string().email('E-mail informado inválido').describe('Endereço de e-mail do lead para consulta'),
};

export async function executeStatusLead(params: z.infer<z.ZodObject<typeof StatusLeadSchema>>) {
  const supabase = getMcpDbClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data, error } = await supabase.rpc('get_lead_status', {
    email: normalizedEmail,
  });

  if (error) {
    throw new Error(`Erro ao consultar status do lead: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      encontrado: false,
      email_masked: maskEmail(normalizedEmail),
      mensagem: 'Nenhum registro encontrado para este e-mail.',
    };
  }

  return {
    encontrado: true,
    email_masked: maskEmail(row.email ?? normalizedEmail),
    cadastro: {
      cadastrado: Boolean(row.is_registered),
      nome: row.profile_nome ?? null,
      criado_em: row.profile_created_at ?? null,
    },
    assinatura: {
      ativo: Boolean(row.is_subscriber),
      produtos: row.product_types ?? [],
      termina_em: row.subscription_ends_at ?? null,
    },
    analise_gratuita: {
      total: Number(row.total_free_analyses ?? 0),
      ultimo_id: row.last_free_analysis_id ?? null,
      ultimo_status: row.last_free_analysis_status ?? null,
      criado_em: row.last_free_analysis_created_at ?? null,
      tem_pdf: Boolean(row.last_free_analysis_has_pdf),
    },
  };
}
