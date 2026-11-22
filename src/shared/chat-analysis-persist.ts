/**
 * Schemas Zod e tipos compartilhados da persistência do caminho do chat em `analyses.frequencias_numeros` (DEV-328).
 */

import { z } from 'zod';

const DATA_PT = /^\d{2}\/\d{2}\/\d{4}$/;

export const perfilChatSchema = z.object({
  motivo: z.enum(['dia_a_dia', 'carreira', 'artistico', 'recomeco', 'bebe']).optional(),
  areaArtistica: z.string().max(40).optional(),
  areaArtisticaOutro: z.string().max(60).optional(),
  detalheArtistico: z.array(z.string().max(40)).max(2).optional(),
  generoPersona: z.enum(['feminino', 'masculino', 'neutro']).optional(),
  imagemArtistica: z.array(z.string().max(40)).max(2).optional(),
  tipoNomeArtistico: z.enum(['proximo', 'diferente', 'ambos']).optional(),
  outrosUsos: z.array(z.string().max(40)).max(6).optional(),
  // Caminho do bebê (DEV-326 / DEV-328): apenas dados estruturados necessários.
  bebeMae: z.string().trim().min(2).max(120).optional(),
  bebePai: z.string().trim().min(2).max(120).optional(),
  bebeSituacao: z.enum(['nao_nasceu', 'nasceu_sem_registro', 'nasceu_registrado']).optional(),
  bebeDataTipo: z.enum(['marcada', 'prevista', 'exata']).optional(),
  bebeSexo: z.enum(['menina', 'menino', 'indefinido']).optional(),
  bebeData: z.string().regex(DATA_PT, 'Data do bebê inválida').optional(),
  bebeSobrenomes: z.array(z.string().trim().min(1).max(40)).max(4).optional(),
  bebeNomesPais: z.array(z.string().trim().min(1).max(60)).max(5).optional(),
  bebeNomeRegistrado: z.string().trim().min(2).max(80).optional(),
  bebeEstilos: z
    .array(z.enum(['classico', 'moderno', 'curto', 'biblico', 'internacional', 'tanto_faz']))
    .max(2)
    .optional(),
});

export const nomeArtisticoItemPersistSchema = z.object({
  nome: z.string().trim().min(2).max(150),
  nota: z.number().min(0).max(100),
  expressao: z.number().int().min(1).max(99),
  afinidade: z.number().min(0).max(10).optional(),
  explicacao: z.string().max(500).optional(),
  tecnica: z.string().max(40).optional(),
  secao: z.enum(['proximo', 'novo']),
});

export const nomesArtisticosPersistSchema = z.object({
  proximos: z.array(nomeArtisticoItemPersistSchema).max(30),
  novos: z.array(nomeArtisticoItemPersistSchema).max(30),
  escolhido: z.string().trim().min(2).max(150),
});

export const nomeBebeItemPersistSchema = z.object({
  nome: z.string().trim().min(2).max(150),
  nota: z.number().min(0).max(100),
  expressao: z.number().int().min(1).max(99),
  bloqueios: z.array(z.string().max(12)).max(20),
  diasBons: z.number().int().min(0).max(60).optional(),
  diasTotal: z.number().int().min(1).max(60).optional(),
  grupo: z.enum(['seu', 'menina', 'menino', 'neutro']),
});

export const nomesBebePersistSchema = z.object({
  seusNomes: z.array(nomeBebeItemPersistSchema).max(10),
  sugestoes: z.array(nomeBebeItemPersistSchema).max(60),
  janela: z
    .object({
      dias: z.number().int().min(1).max(60),
      centro: z.string().regex(DATA_PT, 'Data da janela inválida'),
    })
    .nullable(),
  escolhido: z.string().trim().min(2).max(150),
});

export type NomeArtisticoItemPersistido = z.infer<typeof nomeArtisticoItemPersistSchema>;
export type NomesArtisticosPersistidos = z.infer<typeof nomesArtisticosPersistSchema>;
export type NomeBebeItemPersistido = z.infer<typeof nomeBebeItemPersistSchema>;
export type NomesBebePersistidos = z.infer<typeof nomesBebePersistSchema>;
