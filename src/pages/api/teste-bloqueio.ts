import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';
import { notify } from '../../backend/notifications/notify';
import { calcularTodosTriangulos, detectarBloqueios } from '../../backend/numerology/triangle';
import {
  calcularExpressao,
  calcularDestino,
  calcularMotivacao,
  calcularImpressao,
  calcularMissao,
} from '../../backend/numerology/numbers';
import {
  detectarLicoesCarmicas,
  detectarTendenciasOcultas,
  mapearFrequencias,
  calcularDebitosCarmicos,
} from '../../backend/numerology/karmic';
import { avaliarCompatibilidade } from '../../backend/numerology/harmonization';
import { persistenciaScoreFields, pontuacaoNomeCompleta } from '../../backend/numerology/score';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';
import { getPublicBaseUrl } from '../../utils/public-url';
import { toDbDate } from '../../backend/public-free-analysis/guards';
import { recordPublicFreeAnalysisIpHit } from '../../backend/public-free-analysis/rate-limit';
import { runFreeAnalysisPreflight } from '../../backend/public-free-analysis/preflight';
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

        const todosTriangulos = calcularTodosTriangulos(nome_completo, data_nascimento);
        const bloqueios = detectarBloqueios(todosTriangulos);
        const expressao = calcularExpressao(nome_completo);
        const destino = calcularDestino(data_nascimento);
        const motivacao = calcularMotivacao(nome_completo);
        const impressao = calcularImpressao(nome_completo);
        const missao = calcularMissao(nome_completo, data_nascimento);
        const licoesCarmicas = detectarLicoesCarmicas(nome_completo);
        const tendenciasOcultas = detectarTendenciasOcultas(nome_completo);
        const debitosCarmicos = calcularDebitosCarmicos(
          data_nascimento,
          destino,
          motivacao,
          expressao,
        );
        const frequencias = mapearFrequencias(nome_completo);
        const scoreFields = persistenciaScoreFields(nome_completo, data_nascimento);
        const { scoreExibido: score } = pontuacaoNomeCompleta(nome_completo, data_nascimento);

        const analysisObj = {
          nome_completo: nome_completo.trim(),
          data_nascimento: toDbDate(data_nascimento),
          numero_expressao: expressao,
          numero_destino: destino,
          numero_motivacao: motivacao,
          numero_missao: missao,
          numero_impressao: impressao,
          numero_personalidade: impressao,
          arcano_regente: todosTriangulos.vida.arcanoRegente,
          bloqueios,
          triangulo_vida: todosTriangulos.vida,
          triangulo_pessoal: todosTriangulos.pessoal,
          triangulo_social: todosTriangulos.social,
          triangulo_destino: todosTriangulos.destino,
          licoes_carmicas: licoesCarmicas,
          tendencias_ocultas: tendenciasOcultas,
          debitos_carmicos: debitosCarmicos,
          frequencias_numeros: {
            frequencias,
            ranking: {
              melhorNome: { nomeCompleto: nome_completo.trim() },
              dataNascimento: toDbDate(data_nascimento),
            },
          },
          analise_texto: null,
          score,
          is_free: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };

        const pdfBuffer = await renderToBuffer(
          React.createElement(NomeAtualPDF, {
            analysis: analysisObj as any,
            magneticNames: [],
            userName: nome_completo.split(' ')[0],
          }) as any,
        );
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        await supabase
          .from('free_analyses_leads')
          .update({ pdf_base64: pdfBase64 })
          .eq('id', lead.id);

        await notify('free_analysis.requested', {
          email: dedupEmail,
          firstName: nome_completo.split(' ')[0] || nome_completo,
          fullName: nome_completo,
          downloadUrl: `${getPublicBaseUrl()}/api/download-pdf?id=${lead.id}`,
        });

        const marketingConsent = resolvePublicFreeAnalysisMarketingConsent(opt_in);
        if (marketingConsent.send) {
          const completedAt = new Date().toISOString();
          const appUrl = process.env.APP_URL ?? getPublicBaseUrl();
          const urls = buildDefaultFreeAnalysisMarketingUrls(appUrl, lead.id, {
            downloadPath: `/api/download-pdf?id=${lead.id}`,
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
