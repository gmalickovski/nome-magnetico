import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';
import { notify } from '../../backend/notifications/notify';
import { persistenciaScoreFields } from '../../backend/numerology/score';
import {
  buildFreeLeadAnalysisRecord,
  renderFreeLeadPdfBase64,
} from '../../backend/public-free-analysis/generate-free-lead-pdf';
import { getPublicBaseUrl } from '../../utils/public-url';
import { toDbDate } from '../../backend/public-free-analysis/guards';
import { recordPublicFreeAnalysisIpHit } from '../../backend/public-free-analysis/rate-limit';
import { runFreeAnalysisPreflight } from '../../backend/public-free-analysis/preflight';
import { signDownloadPdfPath } from '../../backend/security/signedDownloadUrl';
import {
  buildDefaultFreeAnalysisMarketingUrls,
  fireFreeAnalysisMarketingEvent,
  resolvePublicFreeAnalysisMarketingConsent,
} from '../../backend/marketing/free-analysis-completed';

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const preflight = await runFreeAnalysisPreflight(request, supabase, { clientAddress });
  if (!('ok' in preflight)) {
    return json(preflight.body, preflight.status);
  }

  const {
    dedupEmail,
    nome_completo,
    data_nascimento,
    ipHash,
    opt_in,
    utm_source,
    utm_medium,
    utm_campaign,
  } = preflight;

  try {
    const { data: lead, error: insertError } = await supabase
      .from('free_analyses_leads')
      .insert({
        email: dedupEmail,
        nome_completo: nome_completo.trim(),
        data_nascimento: toDbDate(data_nascimento),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !lead) {
      throw new Error(`Erro ao salvar lead no Supabase: ${insertError?.message}`);
    }

    await recordPublicFreeAnalysisIpHit(
      supabase,
      ipHash,
      `${dedupEmail}|${nome_completo.trim()}`,
    );

    (async () => {
      try {
        await supabase
          .from('free_analyses_leads')
          .update({ status: 'processing' })
          .eq('id', lead.id);

        const built = buildFreeLeadAnalysisRecord({
          nomeCompleto: nome_completo,
          dataNascimentoPt: data_nascimento,
          dataNascimentoDb: toDbDate(data_nascimento),
          createdAt: new Date().toISOString(),
        });
        const { record: analysisObj, scoreLegado, score } = built;
        persistenciaScoreFields({
          scoreLegado,
          nomeParaV3: nome_completo,
          dataNascimento: data_nascimento,
        });

        const pdfBase64 = await renderFreeLeadPdfBase64(
          analysisObj,
          nome_completo.split(' ')[0],
        );

        await supabase
          .from('free_analyses_leads')
          .update({ pdf_base64: pdfBase64 })
          .eq('id', lead.id);

        const signedDownloadPath = signDownloadPdfPath(lead.id);

        await notify('free_analysis.requested', {
          email: dedupEmail,
          firstName: nome_completo.split(' ')[0] || nome_completo,
          fullName: nome_completo,
          downloadUrl: `${getPublicBaseUrl()}${signedDownloadPath}`,
        });

        const marketingConsent = resolvePublicFreeAnalysisMarketingConsent(opt_in);
        if (marketingConsent.send) {
          const completedAt = new Date().toISOString();
          const appUrl = process.env.APP_URL ?? getPublicBaseUrl();
          const urls = buildDefaultFreeAnalysisMarketingUrls(appUrl, lead.id, {
            downloadPath: signedDownloadPath,
          });
          fireFreeAnalysisMarketingEvent({
            email: dedupEmail,
            nomeCompleto: nome_completo,
            concluidaEm: completedAt,
            analiseId: lead.id,
            score,
            optIn: marketingConsent.optIn,
            optInEm: marketingConsent.optInEm,
            utmSource: utm_source,
            utmMedium: utm_medium,
            utmCampaign: utm_campaign,
            ...urls,
          });
        }

        await supabase
          .from('free_analyses_leads')
          .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[teste-bloqueio background] erro processando ID ${lead.id}:`, message);
        await supabase
          .from('free_analyses_leads')
          .update({
            status: 'error',
            error_message: message,
          })
          .eq('id', lead.id);
      }
    })();

    return json({ success: true, leadId: lead.id }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar análise';
    console.error('[teste-bloqueio] Erro:', err);
    return json({ error: message }, 500);
  }
};
