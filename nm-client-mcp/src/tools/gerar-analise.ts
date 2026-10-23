import { z } from 'zod';
import type { ClientInternalAppClient } from '../client/app-client.js';

export const GerarAnaliseSchema = {
  nome_completo: z.string().min(3).max(120).describe('Nome completo da pessoa a ser analisado.'),
  data_nascimento: z.string().min(8).max(10).describe('Data de nascimento no formato DD/MM/AAAA ou AAAA-MM-DD.'),
  nomes_candidatos: z
    .array(z.string().min(2).max(120))
    .optional()
    .describe('Variações de nomes ou assinaturas desejadas pelo cliente para avaliação comparativa.'),
};

export async function executeGerarAnalise(
  params: {
    nome_completo: string;
    data_nascimento: string;
    nomes_candidatos?: string[];
  },
  userId: string,
  appClient: ClientInternalAppClient,
): Promise<any> {
  return appClient.generateAnalysis({
    userId,
    nomeCompleto: params.nome_completo,
    dataNascimento: params.data_nascimento,
    nomesCandidatos: params.nomes_candidatos ?? [],
  });
}
