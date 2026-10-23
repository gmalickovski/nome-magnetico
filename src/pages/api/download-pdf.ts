import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';
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
import { avaliarNome, calcularScoreV1SemOcorrenciasExtras } from '../../backend/numerology/score';
import { isScoreV3 } from '../../backend/numerology/score-version';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';
import {
  verifyDownloadPdfRequest,
  DOWNLOAD_PDF_LEGACY_CUTOFF_MS,
  DOWNLOAD_PDF_TTL_SECONDS,
} from '../../backend/security/signedDownloadUrl';

function toBrazilliandate(dbDate: string): string {
  // dbDate is YYYY-MM-DD
  const parts = dbDate.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dbDate;
}

function errorResponse(status: number, message: string, acceptsJson: boolean) {
  if (acceptsJson) {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Download de Análise — Nome Magnético</title>
  <style>
    body { background-color: #131313; color: #e5e2e1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; }
    .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.25); border-radius: 1rem; padding: 2.5rem; max-width: 28rem; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    h1 { color: #f2ca50; font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #a1a1aa; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
    .btn { display: inline-block; background: #d4af37; color: #111; font-weight: 700; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link Indisponível</h1>
    <p>${message}</p>
    <a href="/#teste" class="btn">Fazer Nova Análise</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function generateLeadPdfBuffer(lead: {
  nome_completo: string;
  data_nascimento: string;
  created_at: string | null;
}): Promise<Buffer> {
  const birthDateStr = toBrazilliandate(lead.data_nascimento);
  const fullName = lead.nome_completo;

  const todosTriangulos = calcularTodosTriangulos(fullName, birthDateStr);
  const bloqueios = detectarBloqueios(todosTriangulos);
  const expressao = calcularExpressao(fullName);
  const destino = calcularDestino(birthDateStr);
  const motivacao = calcularMotivacao(fullName);
  const impressao = calcularImpressao(fullName);
  const missao = calcularMissao(fullName, birthDateStr);
  const licoesCarmicas = detectarLicoesCarmicas(fullName);
  const tendenciasOcultas = detectarTendenciasOcultas(fullName);
  const debitosCarmicos = calcularDebitosCarmicos(birthDateStr, destino, motivacao, expressao);
  const frequencias = mapearFrequencias(fullName);
  const scoreLegado = calcularScoreV1SemOcorrenciasExtras({
    bloqueios,
    licoesCarmicas: licoesCarmicas.length,
    tendenciasOcultas: tendenciasOcultas.length,
    debitosCarmicos,
    compatibilidade: avaliarCompatibilidade(expressao, destino),
  });
  const avaliacaoV3 = avaliarNome(fullName, birthDateStr, { calcularPotencial: true });
  const score = isScoreV3() ? avaliacaoV3.score_v3 : scoreLegado;

  const analysisObj = {
    nome_completo: fullName.trim(),
    data_nascimento: lead.data_nascimento,
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
        melhorNome: { nomeCompleto: fullName.trim() },
        dataNascimento: lead.data_nascimento,
      },
    },
    analise_texto: null,
    score,
    score_version: avaliacaoV3.score_version,
    score_v3: avaliacaoV3.score_v3,
    nivel: avaliacaoV3.nivel.codigo,
    potencial: avaliacaoV3.potencial,
    score_detalhe: avaliacaoV3,
    is_free: true,
    created_at: lead.created_at,
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(
    React.createElement(NomeAtualPDF, {
      analysis: analysisObj as any,
      magneticNames: [],
      userName: fullName.split(' ')[0],
    }) as any
  );
  return Buffer.from(buffer);
}

export const GET: APIRoute = async ({ url, request }) => {
  const id = url.searchParams.get('id');
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');
  const acceptsJson = (request.headers.get('accept') ?? '').includes('application/json');

  if (!id) {
    return errorResponse(400, 'ID da análise é obrigatório.', acceptsJson);
  }

  // Se exp e sig foram fornecidos, validamos em tempo constante antes de qualquer query
  if (exp && sig) {
    const validation = verifyDownloadPdfRequest({ id, exp, sig });
    if (!validation.ok) {
      return errorResponse(validation.status, validation.reason, acceptsJson);
    }
  }

  try {
    // Buscar o lead pelo ID com colunas explícitas
    const { data: lead, error } = await supabase
      .from('free_analyses_leads')
      .select('id, nome_completo, data_nascimento, pdf_base64, pdf_path, created_at')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return errorResponse(404, 'Análise não encontrada.', acceptsJson);
    }

    // Se exp/sig não foram passados, verifica se está na janela de transição de links antigos
    if (!exp || !sig) {
      const createdTime = lead.created_at ? new Date(lead.created_at).getTime() : 0;
      const now = Date.now();
      const maxLegacyExpiry = createdTime + DOWNLOAD_PDF_TTL_SECONDS * 1000;
      const isAllowedLegacy = createdTime < DOWNLOAD_PDF_LEGACY_CUTOFF_MS && now <= maxLegacyExpiry;

      if (!isAllowedLegacy) {
        return errorResponse(
          403,
          'Este link de download é antigo ou expirou. Por motivos de segurança e proteção de dados (LGPD), gere um novo link ou refaça sua análise.',
          acceptsJson
        );
      }
    }

    // Cutoff: data do deploy do novo layout de PDF gratuito
    const cutoffDate = new Date('2026-06-10T18:40:00Z');
    const recordDate = lead.created_at ? new Date(lead.created_at) : new Date();
    const isOld = recordDate < cutoffDate;

    let pdfBuffer: Buffer | null = null;

    // 1. Tentar ler do Supabase Storage se pdf_path estiver preenchido (Fase 2)
    if (lead.pdf_path) {
      const { data: storageData, error: downloadError } = await supabase.storage
        .from('free-pdfs')
        .download(lead.pdf_path);

      if (!downloadError && storageData) {
        pdfBuffer = Buffer.from(await storageData.arrayBuffer());
      } else {
        console.warn(`[download-pdf] Falha ao recuperar ${lead.pdf_path} do Storage, tentando fallback:`, downloadError?.message);
      }
    }

    // 2. Se não encontrou no Storage, verificar se possui pdf_base64 no banco
    if (!pdfBuffer && lead.pdf_base64) {
      if (isOld) {
        // Opção B: registros anteriores ao novo layout são regenerados on-the-fly
        // e entregues ao usuário SEM gravar no banco (evita Disk IO desnecessário)
        pdfBuffer = await generateLeadPdfBuffer(lead);
      } else {
        pdfBuffer = Buffer.from(lead.pdf_base64, 'base64');
      }
    }

    // 3. Se ainda não há PDF (ausente no registro): gerar e subir para o Storage
    if (!pdfBuffer) {
      pdfBuffer = await generateLeadPdfBuffer(lead);

      const storagePath = `${id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('free-pdfs')
        .upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadError) {
        await supabase
          .from('free_analyses_leads')
          .update({
            pdf_path: storagePath,
            status: 'complete',
            completed_at: new Date().toISOString(),
          })
          .eq('id', id);
      } else {
        console.error('[download-pdf] Erro ao subir PDF para Storage:', uploadError.message);
      }
    }

    // Nome do arquivo limpo e amigável
    const slugName = lead.nome_completo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `analise-gratuita-${slugName}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('[download-pdf] Erro ao recuperar ou gerar PDF');
    return errorResponse(500, 'Erro interno ao recuperar ou gerar PDF.', acceptsJson);
  }
};
