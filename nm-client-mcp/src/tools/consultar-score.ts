import { z } from 'zod';
import type { ClientInternalAppClient } from '../client/app-client.js';

export const ConsultarScoreSchema = {
  analysis_id: z
    .string()
    .uuid('analysis_id deve ser um UUID válido')
    .optional()
    .describe('ID da análise (opcional; se omitido, consulta a análise mais recente da compra ativa).'),
};

export async function executeConsultarScore(
  params: { analysis_id?: string },
  userId: string,
  appClient: ClientInternalAppClient,
): Promise<any> {
  return appClient.getScore({
    userId,
    analysisId: params.analysis_id,
  });
}
