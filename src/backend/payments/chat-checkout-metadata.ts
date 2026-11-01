export type ChatCheckoutSource = 'card_pdf' | 'paywall_free';

export interface ParsedChatCheckoutMetadata {
  chosenSignature: string | null;
  analysisId: string | null;
  source: ChatCheckoutSource | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Extrai e higieniza os metadados de contexto do chat enviados na sessão do Stripe.
 * Retorna null se nenhum campo válido de contexto do chat estiver presente.
 */
export function parseChatCheckoutMetadata(
  metadata: Record<string, string | undefined> | null | undefined,
): ParsedChatCheckoutMetadata | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const rawChosen = typeof metadata.chosen_signature === 'string' ? metadata.chosen_signature.trim() : '';
  const chosenSignature = rawChosen.length > 0 ? rawChosen.slice(0, 80) : null;

  const rawAnalysisId = typeof metadata.analysis_id === 'string' ? metadata.analysis_id.trim() : '';
  const analysisId = UUID_RE.test(rawAnalysisId) ? rawAnalysisId : null;

  const rawSource = typeof metadata.source === 'string' ? metadata.source.trim() : '';
  const source: ChatCheckoutSource | null =
    rawSource === 'card_pdf' || rawSource === 'paywall_free' ? rawSource : null;

  if (!chosenSignature && !analysisId && !source) {
    return null;
  }

  return {
    chosenSignature,
    analysisId,
    source,
  };
}
