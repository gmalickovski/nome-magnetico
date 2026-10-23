import { z } from 'zod';
import type { ClientInternalAppClient } from '../client/app-client.js';

export const ExplicarScoreSchema = {
  analysis_id: z
    .string()
    .uuid('analysis_id deve ser um UUID válido')
    .optional()
    .describe('ID da análise (opcional).'),
  score: z.number().int().min(0).max(100).optional().describe('Score numérico a ser explicado.'),
  nivel: z.string().optional().describe('Nível do score (Harmonioso, Neutro ou Tensão Vibracional).'),
};

export async function executeExplicarScore(
  params: {
    analysis_id?: string;
    score?: number;
    nivel?: string;
  },
  userId: string,
  appClient: ClientInternalAppClient,
): Promise<any> {
  return appClient.explainScore({
    userId,
    analysisId: params.analysis_id,
    score: params.score,
    nivel: params.nivel,
  });
}
