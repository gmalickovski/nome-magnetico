import type { APIRoute } from 'astro';
import { z } from 'zod';
import { verifyInternalHmacRequest } from '@/backend/security/hmac';
import { getSupabaseAdmin } from '@/backend/db/supabase';
import { maskEmail, type FreeAnalysisLeadRow } from '@/backend/public-free-analysis/reprocess-free-leads';
import {
  buildFreeLeadAnalysisRecord,
  dbBirthDateToPtBr,
  renderFreeLeadPdfBase64,
} from '@/backend/public-free-analysis/generate-free-lead-pdf';
import { invokeSendFreePdf } from '@/backend/public-free-analysis/invoke-send-free-pdf';

export const prerender = false;

const ResendPdfSchema = z.object({
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

  const parseResult = ResendPdfSchema.safeParse(parsedBody);
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
    .select('id, email, nome_completo, data_nascimento, status, pdf_path, created_at')
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

  const typedLead = lead as FreeAnalysisLeadRow & { pdf_path?: string | null };
  const emailMasked = maskEmail(typedLead.email);

  if (dryRun) {
    return new Response(
      JSON.stringify({
        ok: true,
        status: 'dry_run',
        leadId,
        emailMasked,
        hasPdf: Boolean(typedLead.pdf_path),
        action: 'send-free-pdf',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    if (!typedLead.pdf_path) {
      const dataPt = dbBirthDateToPtBr(typedLead.data_nascimento);
      const dataDb = typedLead.data_nascimento.slice(0, 10);
      const { record: analysis } = buildFreeLeadAnalysisRecord({
        nomeCompleto: typedLead.nome_completo,
        dataNascimentoPt: dataPt,
        dataNascimentoDb: dataDb,
        createdAt: typedLead.created_at ?? new Date().toISOString(),
      });
      const firstName = typedLead.nome_completo.split(' ')[0] || typedLead.nome_completo;
      const generatedBase64 = await renderFreeLeadPdfBase64(analysis, firstName);

      const storagePath = `${leadId}.pdf`;
      const pdfBuffer = Buffer.from(generatedBase64, 'base64');
      const { error: uploadError } = await supabase.storage
        .from('free-pdfs')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Falha ao enviar PDF para Storage: ${uploadError.message}`);
      }

      const { error: savePdfError } = await supabase
        .from('free_analyses_leads')
        .update({ pdf_path: storagePath, status: 'processing' })
        .eq('id', leadId);
      if (savePdfError) {
        throw new Error(`Falha ao salvar PDF path: ${savePdfError.message}`);
      }
    }

    await invokeSendFreePdf(supabase, leadId);

    return new Response(
      JSON.stringify({
        ok: true,
        status: 'sent',
        leadId,
        emailMasked,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
        leadId,
        emailMasked,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
