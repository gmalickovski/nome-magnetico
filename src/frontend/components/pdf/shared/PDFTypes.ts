/**
 * PDFTypes — interfaces compartilhadas pelos 3 PDFs de produto.
 */

export interface BloqueioRecord {
  codigo: string;
  titulo: string;
  descricao: string;
  triangulos?: string[];
  antidoto?: string;
}

export interface DebitoRecord {
  numero: number;
  titulo: string;
  descricao: string;
  fixo?: boolean;
  fontes?: string[];
}

export interface LicaoRecord {
  numero: number;
  titulo: string;
  descricao: string;
  comoTrabalhar?: string;
}

export interface TendenciaRecord {
  numero: number;
  titulo: string;
  descricao: string;
  frequencia: number;
  comoEquilibrar?: string;
}

export interface TrianguloRecord {
  tipo: string;
  linhas: number[][];
  arcanoRegente: number | null;
  arcanosDoMinantes?: number[];
  sequenciasNegativas: string[];
  /** Arcanos de passagem (cronologia) — presente no dado calculado */
  arcanosDePassagem?: number[];
  /** Arcano de trânsito atual baseado na idade */
  arcanoAtual?: {
    numero: number | null;
    periodo: string;
    idadeInicio: number;
    idadeFim: number;
  };
}

export interface MagneticName {
  nome_sugerido: string;
  numero_expressao: number | null;
  numero_motivacao: number | null;
  score: number;
  justificativa?: string | null;
}

/** Interface completa da análise vinda do banco */
export interface AnalysisRecord {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  product_type: string;
  numero_expressao: number | null;
  numero_destino: number | null;
  numero_motivacao: number | null;
  numero_missao: number | null;
  numero_impressao: number | null;
  numero_personalidade: number | null;
  bloqueios: BloqueioRecord[];
  debitos_carmicos?: DebitoRecord[] | null;
  licoes_carmicas?: LicaoRecord[] | null;
  tendencias_ocultas?: TendenciaRecord[] | null;
  frequencias_numeros?: any | null;
  score?: number | null;
  triangulo_vida?: TrianguloRecord | null;
  triangulo_pessoal?: TrianguloRecord | null;
  triangulo_social?: TrianguloRecord | null;
  triangulo_destino?: TrianguloRecord | null;
  analise_texto: string | null;
  completed_at: string | null;
  created_at: string;
}

/** Props comuns a todos os PDFs de produto */
export interface ProductPDFProps {
  analysis: AnalysisRecord;
  magneticNames: MagneticName[];
  userName?: string;
  /** Preço efetivo do Nome Social no momento da geração (DEV-178). */
  upgradeOfferLabel?: string;
}
