import type { ProductType } from './stripe';

/** Resposta JSON quando o usuário já tem o produto ativo (não reembolsado). */
export const CHECKOUT_ALREADY_ACTIVE_CODE = 'already_active' as const;

export function checkoutAlreadyActiveMessage(productType: ProductType): string {
  if (productType === 'nome_social') {
    return 'Você já possui o produto Nome Social ativo.';
  }
  if (productType === 'nome_bebe') {
    return 'Você já possui o produto Nome para Bebê ativo.';
  }
  if (productType === 'nome_empresa') {
    return 'Você já possui o produto Nome Empresarial ativo.';
  }
  return 'Você já possui este produto ativo.';
}

/** Caminho no app para iniciar ou ver a análise do produto. */
export function productAnalysisAppPath(productType: ProductType): string {
  switch (productType) {
    case 'nome_social':
      return '/app/analise/nome-social';
    case 'nome_bebe':
      return '/app/analise/nome-bebe';
    case 'nome_empresa':
      return '/app/analise/nome-empresa';
    default:
      return '/app';
  }
}

export function shouldBlockCheckoutForActiveProduct(isRenewal: boolean, hasActiveProduct: boolean): boolean {
  return !isRenewal && hasActiveProduct;
}
