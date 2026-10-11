import type { APIRoute } from 'astro';

/**
 * Endpoint legado do Asaas.
 * PIX e cartão passaram a ser processados exclusivamente pelo Stripe (DEV-127).
 * Mantido apenas para rejeitar entregas antigas com resposta explícita.
 */
export const POST: APIRoute = async () => {
  console.warn('[asaas-webhook] Recebido evento após migração para Stripe — ignorado');
  return new Response(
    JSON.stringify({
      error: 'Asaas desativado. Use o webhook Stripe em /api/stripe-webhook.',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
};
