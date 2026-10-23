import { z } from 'zod';
import { getMcpDbClient } from '../db/client.js';
import type { InternalAppClient } from '../client/app-client.js';

export const ListarPromocoesSchema = {
  state: z
    .enum(['active', 'scheduled', 'expired', 'inactive'])
    .optional()
    .describe('Filtro por estado da promoção (active, scheduled, expired ou inactive).'),
};

export async function executeListarPromocoes(params: {
  state?: 'active' | 'scheduled' | 'expired' | 'inactive';
}): Promise<{ total: number; promotions: any[] }> {
  const db = getMcpDbClient();
  let query = db.from('promotions_v').select('*').order('created_at', { ascending: false });

  if (params.state) {
    query = query.eq('state', params.state);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Erro ao listar promoções: ${error.message}`);
  }

  const list = data ?? [];
  return {
    total: list.length,
    promotions: list,
  };
}

export const CriarPromocaoSchema = {
  name: z.string().min(3).max(80).describe('Nome interno da campanha/promoção.'),
  product_types: z
    .array(z.enum(['nome_social', 'nome_bebe', 'nome_empresa']))
    .optional()
    .describe('Produtos elegíveis (nome_social, nome_bebe, nome_empresa). Omissão aplica a todos.'),
  discount_type: z.enum(['percent', 'fixed']).describe('Tipo de desconto: percent (1 a 100) ou fixed (centavos BRL).'),
  discount_value: z.number().int().positive().describe('Valor do desconto (1-100 para percent, ou centavos para fixed).'),
  starts_at: z.string().optional().describe('Data/hora de início ISO 8601 (opcional, padrão agora).'),
  ends_at: z.string().describe('Data/hora de término ISO 8601 da promoção.'),
  banner_text: z.string().max(200).optional().describe('Texto opcional para o banner do topo do site.'),
  dry_run: z
    .boolean()
    .optional()
    .default(true)
    .describe('Se true (padrão), valida os pisos de preço (DEV-178) e simula sem persistir.'),
};

export async function executeCriarPromocao(
  params: {
    name: string;
    product_types?: ('nome_social' | 'nome_bebe' | 'nome_empresa')[];
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    starts_at?: string;
    ends_at: string;
    banner_text?: string;
    dry_run?: boolean;
  },
  appClient: InternalAppClient,
): Promise<any> {
  return appClient.createPromotion({
    name: params.name,
    productTypes: params.product_types,
    discountType: params.discount_type,
    discountValue: params.discount_value,
    startsAt: params.starts_at,
    endsAt: params.ends_at,
    bannerText: params.banner_text,
    dryRun: params.dry_run ?? true,
  });
}
