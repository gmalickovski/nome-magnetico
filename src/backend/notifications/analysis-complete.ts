import { notify } from './notify';
import type { ProductType } from '../payments/stripe';
import { productAnalysisAppPath } from '../payments/checkout-access';
import { getPublicBaseUrl } from '../../utils/public-url';

export async function notifyPaidAnalysisComplete(params: {
  email: string;
  firstName: string;
  productType: ProductType;
  analysisId: string;
}): Promise<boolean> {
  const baseUrl = getPublicBaseUrl();
  const analysisPath = productAnalysisAppPath(params.productType);
  const analysisUrl =
    params.productType === 'nome_social'
      ? // DEV-317: abre o painel atual em Minhas análises (a página /app/resultado é a antiga).
        `${baseUrl}/app/analises?id=${encodeURIComponent(params.analysisId)}&painel=1`
      : `${baseUrl}${analysisPath}`;

  return notify('user.analysis_complete', {
    email: params.email,
    firstName: params.firstName,
    analysisId: params.analysisId,
    analysisUrl,
    productType: params.productType,
  });
}
