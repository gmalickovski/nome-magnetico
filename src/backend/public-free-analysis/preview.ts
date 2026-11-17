import { calcularPotencialAssinaturaPdfGratuito } from '../numerology/products/nome-social-potencial-pdf';

/**
 * DEV-314 · Prévia mostrada no pop-up logo após o formulário da análise grátis.
 *
 * A nota máxima vem da MESMA função usada no CTA do PDF grátis
 * (`calcularPotencialAssinaturaPdfGratuito`), para o pop-up e o PDF nunca divergirem.
 * Sem sugestão elegível acima da nota atual, `potencialMax` é null (nada de número inventado).
 */
export interface FreeAnalysisPreviewPayload {
  firstName: string;
  score: number;
  nivelCodigo: string;
  nivelRotulo: string;
  /** Nota máxima que o nome pode alcançar; null quando não há ganho possível. */
  potencialMax: number | null;
  marcaDaDataPresente: boolean;
}

export function buildFreeAnalysisPreview(input: {
  firstName: string;
  nomeCompleto: string;
  /** DD/MM/AAAA, igual ao que o PDF usa. */
  dataNascimentoPt: string;
  score: number;
  nivelCodigo: string;
  nivelRotulo: string;
  marcaDaDataPresente: boolean;
}): FreeAnalysisPreviewPayload {
  let potencialMax: number | null = null;
  try {
    const p = calcularPotencialAssinaturaPdfGratuito(input.nomeCompleto, input.dataNascimentoPt);
    if (p.calculado && p.potencialMax != null && p.potencialMax > input.score) {
      potencialMax = p.potencialMax;
    }
  } catch (err) {
    console.error('[free-analysis-preview] falha ao calcular a nota máxima', err instanceof Error ? err.message : err);
  }
  return {
    firstName: input.firstName,
    score: input.score,
    nivelCodigo: input.nivelCodigo,
    nivelRotulo: input.nivelRotulo,
    potencialMax,
    marcaDaDataPresente: input.marcaDaDataPresente,
  };
}
