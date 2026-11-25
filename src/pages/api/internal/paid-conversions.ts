import type { APIRoute } from 'astro';
import { drainPurchaseDeliveries } from '../../../backend/analytics/purchase-delivery';
import { paidAttributionEnabled } from '../../../backend/analytics/paid-attribution';
import { supabase } from '../../../backend/db/supabase';
import { authorizeInternalRequest } from '../../../backend/env/internal-auth';

export const POST: APIRoute = async ({ request }) => {
  const auth = authorizeInternalRequest(request.headers.get('x-internal-secret'));
  if (!auth.ok) return new Response(null, { status: auth.status });
  if (!paidAttributionEnabled()) return new Response(null, { status: 404 });
  try {
    const result = await drainPurchaseDeliveries();
    const { error } = await supabase.rpc('nm_clean_paid_attribution');
    if (error) throw error;
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new Response(null, { status: 503 });
  }
};
