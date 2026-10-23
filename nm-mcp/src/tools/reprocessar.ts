import { z } from 'zod';
import { InternalAppClient } from '../client/app-client.js';

export const ReprocessarAnaliseSchema = {
  lead_id: z.string().uuid('lead_id deve ser um UUID válido').describe('ID do lead na tabela free_analyses_leads'),
  dry_run: z
    .boolean()
    .optional()
    .default(true)
    .describe('Se true (padrão), apenas simula e valida a operação sem mutações'),
};

export async function executeReprocessarAnalise(
  params: z.infer<z.ZodObject<typeof ReprocessarAnaliseSchema>>,
  appClient: InternalAppClient,
) {
  const result = await appClient.reprocessLead({
    leadId: params.lead_id,
    dryRun: params.dry_run ?? true,
  });

  return {
    sucesso: result.ok,
    status: result.status,
    lead_id: result.leadId,
    email_masked: result.emailMasked,
    dry_run: params.dry_run ?? true,
    motivo: result.reason ?? null,
  };
}
