import type { APIRoute } from 'astro';
import { getAnalysis, getMagneticNames } from '../../backend/db/analyses';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NomeSocialPDF } from '../../frontend/components/pdf/NomeSocialPDF';
import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';
import { NomeBebePDF } from '../../frontend/components/pdf/NomeBebePDF';
import { NomeEmpresaPDF } from '../../frontend/components/pdf/NomeEmpresaPDF';
import { logError } from '../../backend/utils/error-logger';

// Cache em memória para evitar renderizar o mesmo PDF duas vezes seguidas (como aquecimento fetch + window.location no mobile)
const pdfCache = new Map<string, { buffer: Buffer; expiresAt: number }>();
const CACHE_TTL = 15_000; // 15 segundos

export const GET: APIRoute = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) {
    // Redirect to login so the user can re-authenticate instead of seeing a blank error page
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/auth/login?redirect=' + encodeURIComponent(url.pathname + url.search) },
    });
  }

  const analysisId = url.searchParams.get('id');
  if (!analysisId) return new Response('ID ausente', { status: 400 });

  let analysis = await getAnalysis(analysisId);
  if (!analysis || analysis.user_id !== user.id) {
    return new Response('Análise não encontrada', { status: 404 });
  }

  if (analysis.status !== 'complete') {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline && analysis.status !== 'complete') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const nextAnalysis = await getAnalysis(analysisId);
      if (!nextAnalysis || nextAnalysis.user_id !== user.id) {
        return new Response('Análise não encontrada', { status: 404 });
      }
      analysis = nextAnalysis;
    }
  }

  if (analysis.status !== 'complete') {
    await logError({
      type: 'pdf_generation',
      severity: 'warning',
      userId: user.id,
      analysisId,
      message: `Análise ${analysisId} ainda não concluída após 45s ao tentar gerar PDF`,
      details: { status: analysis.status, productType: analysis.product_type },
    });
    return new Response('Análise ainda não concluída', { status: 202 });
  }

  const magneticNames = await getMagneticNames(analysisId);
  const firstName = analysis.nome_completo.split(' ')[0];

  // Gera slug para uso no nome do arquivo
  function toSlug(str: string) {
    return str
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const productType = analysis.product_type ?? 'nome_social';
  const isGratuita = productType === 'analise_gratuita' || (analysis as any).is_free === true;
  const socialFreqData = (analysis as any).frequencias_numeros as any;
  const selectedSocialName =
    socialFreqData?.selectedNomeSocial ??
    String((analysis as any).analise_texto ?? '').match(/^#\s*Relatorio do Nome Social:\s*(.+)$/im)?.[1]?.trim() ??
    socialFreqData?.ranking?.melhorNome?.nomeCompleto ??
    analysis.nome_completo;
  let filename: string;

  if (productType === 'nome_bebe') {
    const sobrenome = toSlug(
      analysis.nome_completo.split(' ').slice(1).join(' ') || analysis.nome_completo
    );
    filename = `analise-nome-bebe-${sobrenome}-nome-magnetico.pdf`;
  } else if (productType === 'nome_empresa') {
    const freqData = (analysis as any).frequencias_numeros as any;
    const nomeEmpresa = freqData?.melhorNome?.nomeEmpresa ?? analysis.nome_completo;
    filename = `analise-nome-empresa-${toSlug(nomeEmpresa)}-nome-magnetico.pdf`;
  } else if (isGratuita) {
    filename = `analise-gratuita-${toSlug(analysis.nome_completo)}-nome-magnetico.pdf`;
  } else {
    filename = `analise-nome-social-${toSlug(selectedSocialName)}-nome-magnetico.pdf`;
  }

  if ((analysis as any).is_analyst_generated === true) {
    filename = filename.replace('.pdf', '..-analista.pdf');
  }

  const PDFComponent =
    productType === 'nome_bebe'
      ? NomeBebePDF
      : productType === 'nome_empresa'
        ? NomeEmpresaPDF
        : isGratuita
          ? NomeAtualPDF
          : NomeSocialPDF;

  // Limpa cache expirado periodicamente
  const agora = Date.now();
  for (const [key, val] of pdfCache.entries()) {
    if (val.expiresAt < agora) pdfCache.delete(key);
  }

  const cacheKey = `${analysisId}-${productType}`;
  const cached = pdfCache.get(cacheKey);
  let pdfBuffer: Buffer;

  if (cached && cached.expiresAt > agora) {
    pdfBuffer = cached.buffer;
  } else {
    try {
      pdfBuffer = await renderToBuffer(
        React.createElement(PDFComponent, {
          analysis: analysis as any,
          magneticNames,
          userName: firstName,
        }) as any
      );
      
      // Salva no cache
      pdfCache.set(cacheKey, {
        buffer: pdfBuffer,
        expiresAt: Date.now() + CACHE_TTL,
      });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const stack = err?.stack ?? '';
      console.error('[generate-pdf] renderToBuffer FAILED:', msg, stack);

      // Registra falha de PDF no monitor do HQ
      await logError({
        type: 'pdf_generation',
        severity: 'error',
        userId: user.id,
        analysisId: analysisId ?? undefined,
        message: msg,
        details: { productType, stack: stack.slice(0, 500) },
      });

      return new Response(
        JSON.stringify({ error: 'Erro ao gerar PDF', detail: msg, stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-PDF-Template': productType === 'nome_bebe'
        ? 'nome-bebe'
        : productType === 'nome_empresa'
          ? 'nome-empresa'
          : isGratuita
            ? 'nome-atual'
            : 'nome-social',
    },
  });
};
