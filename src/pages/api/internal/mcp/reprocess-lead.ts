import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import {
  maskEmail,
  runReprocessFreeLeads,
  createDefaultReprocessDeps,
  type FreeAnalysisLeadRow,
} from '@/backend/public-free-analysis/reprocess-free-leads';

export const prerender = false;

const ReprocessSchema = z.object({
  leadId: z.string().uuid('leadId deve ser um UUID válido'),
  dryRun: z.boolean().optional().default(true),
});

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('X-Internal-Signature');
  const timestampHeader = request.headers.get('X-Internal-Timestamp');

  const auth = verifyInternalHmacRequest({
    rawBody,
    signatureHeader,
    timestampHeader,
  });

  if (!auth.ok) {
    return new Response(JSON.stringify({ ok: false, error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let parsedBody: unknown;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parseResult = ReprocessSchema.safeParse(parsedBody);
  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: parseResult.error.errors.map((e) => e.message).join(', '),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { leadId, dryRun } = parseResult.data;
  const supabase = getSupabaseAdmin();

  const { data: lead, error: fetchError } = await supabase
    .from('free_analyses_leads')
    .select('id, email, nome_completo, data_nascimento, status, error_message, created_at')
    .eq('id', leadId)
    .maybeSingle();

  if (fetchError) {
    return new Response(JSON.stringify({ ok: false, error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!lead) {
    return new Response(JSON.stringify({ ok: false, error: 'Lead não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const typedLead = lead as FreeAnalysisLeadRow;
  const emailMasked = maskEmail(typedLead.email);

  if (typedLead.status === 'complete') {
    return new Response(
      JSON.stringify({
        ok: true,
        status: 'skipped',
        reason: 'already_complete',
        leadId,
        emailMasked,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (dryRun) {
    return new Response(
      JSON.stringify({
        ok: true,
        status: 'dry_run',
        leadId,
        emailMasked,
        currentStatus: typedLead.status,
        action: 'processing -> PDF -> send-free-pdf',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const deps = createDefaultReprocessDeps(supabase);
  const summary = await runReprocessFreeLeads([typedLead], { dryRun: false, pauseMs: 0 }, deps);

  if (summary.failed > 0) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Falha durante reprocessamento do lead',
        leadId,
        emailMasked,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      status: 'reprocessed',
      leadId,
      emailMasked,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
