export interface PdfFormatResolutionInput {
  productType?: string | null;
  isFree?: boolean | null;
  birthName?: string | null;
  selectedSocialName?: string | null;
  harmonizedName?: string | null;
  requestedFormat?: string | null;
  requestedMode?: string | null;
  /** DEV-328: motivo salvo em `frequencias_numeros.perfilChat.motivo`. */
  perfilChatMotivo?: string | null;
}

export type PdfVariant =
  | 'gratuito'
  | 'nome_social'
  | 'nome_artistico'
  | 'nome_bebe_chat'
  | 'nome_bebe'
  | 'nome_empresa';

export type PdfTemplateKey =
  | 'nome-atual'
  | 'nome-social'
  | 'nome-artistico'
  | 'nome-bebe-chat'
  | 'nome-bebe'
  | 'nome-empresa';

export interface PdfVariantResolutionInput extends PdfFormatResolutionInput {
  /** Flags até os templates dedicados (DEV-329 / DEV-330) existirem. */
  hasArtisticTemplate?: boolean;
  hasBabyChatTemplate?: boolean;
}

export interface PdfVariantResolution {
  variant: PdfVariant;
  template: PdfTemplateKey;
  isGratuita: boolean;
  fellBackToSocial: boolean;
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
    if (input.perfilChatMotivo === 'bebe') {
      return false;
    }
    return !hasDistinctHarmonizedNameForPdf(
      input.birthName,
      input.selectedSocialName,
      input.harmonizedName,
    );
  }
  return false;
}

/**
 * Escolhe a versão do PDF pago a partir do caminho salvo em `perfilChat.motivo` (DEV-328).
 * Enquanto os templates dedicados da DEV-329 e DEV-330 não existirem, cai com segurança
 * para `nome-social` quando as flags de template forem falsas.
 */
export function resolvePdfVariant(input: PdfVariantResolutionInput): PdfVariantResolution {
  const productType = input.productType ?? 'nome_social';
  if (shouldUseFreeBirthPdf(input)) {
    return {
      variant: 'gratuito',
      template: 'nome-atual',
      isGratuita: true,
      fellBackToSocial: false,
    };
  }
  if (productType === 'nome_bebe') {
    return {
      variant: 'nome_bebe',
      template: 'nome-bebe',
      isGratuita: false,
      fellBackToSocial: false,
    };
  }
  if (productType === 'nome_empresa') {
    return {
      variant: 'nome_empresa',
      template: 'nome-empresa',
      isGratuita: false,
      fellBackToSocial: false,
    };
  }

  const motivo = input.perfilChatMotivo ?? null;
  if (motivo === 'artistico') {
    const useDedicated = input.hasArtisticTemplate === true;
    return {
      variant: 'nome_artistico',
      template: useDedicated ? 'nome-artistico' : 'nome-social',
      isGratuita: false,
      fellBackToSocial: !useDedicated,
    };
  }
  if (motivo === 'bebe') {
    const useDedicated = input.hasBabyChatTemplate === true;
    return {
      variant: 'nome_bebe_chat',
      template: useDedicated ? 'nome-bebe-chat' : 'nome-social',
      isGratuita: false,
      fellBackToSocial: !useDedicated,
    };
  }

  return {
    variant: 'nome_social',
    template: 'nome-social',
    isGratuita: false,
    fellBackToSocial: false,
  };
}
