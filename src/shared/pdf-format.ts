export interface PdfFormatResolutionInput {
  productType?: string | null;
  isFree?: boolean | null;
  birthName?: string | null;
  selectedSocialName?: string | null;
  harmonizedName?: string | null;
  requestedFormat?: string | null;
  requestedMode?: string | null;
}

export function normalizeComparableName(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Indica se existe um nome social harmonizado distinto do nome de nascimento.
 */
export function hasDistinctHarmonizedNameForPdf(
  birthName?: string | null,
  selectedSocialName?: string | null,
  harmonizedName?: string | null,
): boolean {
  const birthNorm = normalizeComparableName(birthName);
  const candidate = normalizeComparableName(selectedSocialName) || normalizeComparableName(harmonizedName);
  if (!candidate) return false;
  if (!birthNorm) return true;
  return candidate !== birthNorm;
}

/**
 * Decide se a geração deve usar o PDF gratuito do nome de nascimento (NomeAtualPDF).
 * Regra de produto: análises gratuitas, solicitações explícitas de formato/modo de nascimento
 * ou análises de Nome Social sem harmonização distinta sempre baixam a versão gratuita.
 */
export function shouldUseFreeBirthPdf(input: PdfFormatResolutionInput): boolean {
  const productType = input.productType ?? 'nome_social';
  if (productType === 'nome_bebe' || productType === 'nome_empresa') {
    return false;
  }
  if (
    input.requestedFormat === 'gratuito' ||
    input.requestedMode === 'nascimento'
  ) {
    return true;
  }
  if (productType === 'analise_gratuita' || input.isFree === true) {
    return true;
  }
  if (productType === 'nome_social') {
    return !hasDistinctHarmonizedNameForPdf(
      input.birthName,
      input.selectedSocialName,
      input.harmonizedName,
    );
  }
  return false;
}
