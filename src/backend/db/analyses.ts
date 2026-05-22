import { supabase } from './supabase';
import type { ProductType } from '../payments/stripe';

export type AnalysisProductType = ProductType | 'analise_gratuita';

export type AnalysisStatus = 'pending' | 'processing' | 'complete' | 'error';

export interface Analysis {
  id: string;
  user_id: string;
  product_type: AnalysisProductType;
  nome_completo: string;
  data_nascimento: string;
  numero_expressao: number | null;
  numero_destino: number | null;
  numero_motivacao: number | null;
  numero_missao: number | null;
  numero_impressao: number | null;
  numero_personalidade: number | null;
  arcano_regente: number | null;
  bloqueios: unknown[];
  triangulo_da_vida: unknown | null;
  triangulo_vida: unknown | null;
  triangulo_pessoal: unknown | null;
  triangulo_social: unknown | null;
  triangulo_destino: unknown | null;
  licoes_carmicas: unknown[] | null;
  tendencias_ocultas: unknown[] | null;
  debitos_carmicos: unknown[] | null;
  frequencias_numeros: unknown | null;
  analise_texto: string | null;
  score: number | null;
  status: AnalysisStatus;
  is_free: boolean;
  is_analyst_generated: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface MagneticName {
  id: string;
  analysis_id: string;
  user_id: string;
  nome_sugerido: string;
  numero_expressao: number | null;
  numero_motivacao: number | null;
  numero_missao: number | null;
  numero_impressao: number | null;
  tem_bloqueio: boolean;
  score: number;
  justificativa: string | null;
  created_at: string;
}

function toISODate(date: string): string {
  // Converte DD/MM/YYYY → YYYY-MM-DD se necessário
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }
  return date;
}

export async function hasUsedFreeAnalysis(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('analyses')
    .select('status, created_at')
    .eq('user_id', userId)
    .or('is_free.eq.true,product_type.eq.analise_gratuita');

  if (!data || data.length === 0) return false;

  // Verifica se há alguma análise concluída
  const hasComplete = data.some(a => a.status === 'complete');
  if (hasComplete) return true;

  // Verifica se há alguma análise em andamento (menos de 15 minutos atrás)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
  const isCurrentlyProcessing = data.some(
    a => (a.status === 'pending' || a.status === 'processing') && a.created_at > fifteenMinsAgo
  );

  return isCurrentlyProcessing;
}

export async function createAnalysis(params: {
  userId: string;
  productType: AnalysisProductType;
  nomeCompleto: string;
  dataNascimento: string;
  isFree?: boolean;
}): Promise<Analysis> {
  const { data, error } = await supabase

    .from('analyses')
    .insert({
      user_id: params.userId,
      product_type: params.productType,
      nome_completo: params.nomeCompleto,
      data_nascimento: toISODate(params.dataNascimento),
      status: 'pending',
      is_free: params.isFree ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Analysis;
}

export async function updateAnalysis(
  analysisId: string,
  updates: Partial<Analysis>
): Promise<Analysis | null> {
  const { data, error } = await supabase
    
    .from('analyses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', analysisId)
    .select()
    .single();

  if (error) return null;
  return data as Analysis;
}

export async function getAnalysis(analysisId: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error) return null;
  return data as Analysis;
}

export async function getUserAnalyses(
  userId: string,
  productType?: ProductType
): Promise<Analysis[]> {
  let query = supabase
    
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (productType) {
    query = query.eq('product_type', productType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Analysis[];
}

export async function saveMagneticNames(
  analysisId: string,
  userId: string,
  names: Array<{
    nomeSugerido: string;
    numeroExpressao?: number;
    motivacao?: number;
    missao?: number;
    impressao?: number;
    temBloqueio: boolean;
    score: number;
    justificativa?: string;
  }>
): Promise<MagneticName[]> {
  const rows = names.map(n => ({
    analysis_id: analysisId,
    user_id: userId,
    nome_sugerido: n.nomeSugerido,
    numero_expressao: n.numeroExpressao,
    numero_motivacao: n.motivacao,
    numero_missao: n.missao,
    numero_impressao: n.impressao,
    tem_bloqueio: n.temBloqueio,
    score: n.score,
    justificativa: n.justificativa,
  }));

  const { data, error } = await supabase
    
    .from('magnetic_names')
    .insert(rows)
    .select();

  if (error) throw error;
  return (data ?? []) as MagneticName[];
}

export async function getMagneticNames(analysisId: string): Promise<MagneticName[]> {
  const { data, error } = await supabase
    
    .from('magnetic_names')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('score', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MagneticName[];
}
