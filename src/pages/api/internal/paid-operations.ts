import type { APIRoute } from 'astro';
import { z } from 'zod';
import { authorizeInternalRequest } from '../../../backend/env/internal-auth';
import { readServerEnv } from '../../../backend/env/runtime';
import { brandArtifactSchema, matureCampaignPeriod, PaidOperationBusy, periodSchema, withPaidOperationLock } from '../../../backend/analytics/paid-operations';
import { syncBrand, syncCampaigns } from '../../../backend/analytics/paid-sync';

const schema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('campaigns'), apply: z.boolean().default(false), period: periodSchema.optional() }).strict(),
  z.object({ operation: z.literal('brand'), apply: z.boolean().default(false), artifact: brandArtifactSchema }).strict(),
]);

export const POST: APIRoute = async ({ request }) => {
  const auth = authorizeInternalRequest(request.headers.get('x-internal-secret'));
  if (!auth.ok) return new Response(null, { status: auth.status });
  if (readServerEnv('NM_MEDIA_SYNC_ENABLED') !== '1') return new Response(null, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const input = parsed.data;
  try {
    const result = await withPaidOperationLock(input.operation, async () => {
      if (input.operation === 'brand') return syncBrand(input.artifact, input.apply);
      const period = input.period ?? matureCampaignPeriod();
      if (period.end > matureCampaignPeriod().end) throw new Error('A coorte ainda está em maturação');
      return syncCampaigns(period, input.apply);
    });
    return Response.json(result, {
      status: result.status === 'no_data' || result.status === 'reconciliation_error' ? 424 : 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof PaidOperationBusy) return new Response(null, { status: 409 });
    console.warn('[paid-operations] Falha no workflow', input.operation, error instanceof Error ? error.message : 'erro');
    return new Response(null, { status: 503 });
  }
};
