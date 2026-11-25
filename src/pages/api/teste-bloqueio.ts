import { buildFreeAnalysisPreview } from '../../backend/public-free-analysis/preview';
import type { APIRoute } from 'astro';
import { readPaidCampaignProperties } from '../../backend/analytics/paid-attribution';
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
import {
  captureServerEvent,
  getPostHogServer,
  posthogEventUuid,
} from '../../backend/analytics/posthog-server';

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
    posthog_distinct_id,
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

    const built = buildFreeLeadAnalysisRecord({
      nomeCompleto: nome_completo,
      dataNascimentoPt: data_nascimento,
      dataNascimentoDb: toDbDate(data_nascimento),
      createdAt: new Date().toISOString(),
    });
    const { record: analysisObj, scoreLegado, score, avaliacaoV3 } = built;
    // DEV-314: a nota máxima do pop-up vem da mesma função do CTA do PDF (nunca um número inventado).
    const preview = buildFreeAnalysisPreview({
      firstName: nome_completo.trim().split(/\s+/)[0] || nome_completo.trim(),
      nomeCompleto: nome_completo,
      dataNascimentoPt: data_nascimento,
      score: avaliacaoV3.score_v3,
      nivelCodigo: avaliacaoV3.nivel.codigo,
      nivelRotulo: avaliacaoV3.nivel.rotulo,
      marcaDaDataPresente: avaliacaoV3.marcaDaData.length > 0,
    });

    const posthogSubmitQueued = Boolean(posthog_distinct_id && getPostHogServer());
    if (posthog_distinct_id && posthogSubmitQueued) {
      void captureServerEvent({
        distinctId: posthog_distinct_id,
        event: 'analise_gratis_submit',
        uuid: posthogEventUuid('analise_gratis_submit', String(lead.id)),
        properties: {
          $process_person_profile: false,
          product_type: 'analise_gratuita',
          analise_id: lead.id,
          score: preview.score,
          score_v3: avaliacaoV3.score_v3,
          nivel: avaliacaoV3.nivel.codigo,
          potencial_max: preview.potencialMax,
          marca_da_data_count: avaliacaoV3.marcaDaData.length,
          opt_in: Boolean(opt_in),
          utm_source: utm_source ?? null,
          utm_medium: utm_medium ?? null,
          utm_campaign: utm_campaign ?? null,
          source: 'server_teste_bloqueio',
        },
      });
    }

    const paidCampaign = await readPaidCampaignProperties(request);
    if (paidCampaign.paid_campaign_id && posthog_distinct_id) {
      void captureServerEvent({
        distinctId: posthog_distinct_id,
        event: 'paid_analysis_completed',
        uuid: posthogEventUuid('paid_analysis_completed', String(lead.id)),
        properties: { ...paidCampaign, product_type: 'nome_social' },
      });
    }

    (async () => {
      try {
        await supabase
          .from('free_analyses_leads')
          .update({ status: 'processing' })
          .eq('id', lead.id);

        persistenciaScoreFields({
          scoreLegado,
          nomeParaV3: nome_completo,
          dataNascimento: data_nascimento,
        });

        const pdfBase64 = await renderFreeLeadPdfBase64(
          analysisObj,
          nome_completo.split(' ')[0],
        );

        // DEV-211 (Fase 2): Gravar PDF no Supabase Storage (bucket free-pdfs) e registrar pdf_path
        const storagePath = `${lead.id}.pdf`;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        const { error: uploadError } = await supabase.storage
          .from('free-pdfs')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Falha ao enviar PDF para Storage: ${uploadError.message}`);
        }

        await supabase
          .from('free_analyses_leads')
          .update({ pdf_path: storagePath })
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
            potencial: preview.potencialMax,
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

    return json(
      {
        success: true,
        leadId: lead.id,
        preview,
        posthogSubmitQueued,
      },
      200,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar análise';
    console.error('[teste-bloqueio] Erro:', err);
    return json({ error: message }, 500);
  }
};
