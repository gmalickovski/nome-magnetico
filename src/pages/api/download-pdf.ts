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
import { calcularScore } from '../../backend/numerology/score';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';

function toBrazilliandate(dbDate: string): string {
  // dbDate is YYYY-MM-DD
  const parts = dbDate.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dbDate;
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'ID da análise é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Buscar o lead pelo ID
    const { data: lead, error } = await supabase
      .from('free_analyses_leads')
      .select('nome_completo, data_nascimento, pdf_base64, created_at')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return new Response(
        JSON.stringify({ error: 'Análise não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cutoff: data do deploy do novo layout de PDF gratuito
    const cutoffDate = new Date('2026-06-10T18:40:00Z');
    const recordDate = lead.created_at ? new Date(lead.created_at) : new Date();
    const isOld = recordDate < cutoffDate;
    const isPdfMissing = !lead.pdf_base64;

    let pdfBase64 = lead.pdf_base64;

    if (isPdfMissing || isOld) {
      console.log(`[download-pdf] Regenerando PDF para o lead ${id} (isPdfMissing: ${isPdfMissing}, isOld: ${isOld})`);
      const birthDateStr = toBrazilliandate(lead.data_nascimento);
      const fullName = lead.nome_completo;

      // Cálculos numerológicos locais
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
      const score = calcularScore({
        bloqueios: bloqueios.length,
        licoesCarmicas: licoesCarmicas.length,
        tendenciasOcultas: tendenciasOcultas.length,
        debitosCarmicos: debitosCarmicos.length,
        debitosCarmicoFixos: debitosCarmicos.filter(d => d.fixo).length,
        compatibilidade: avaliarCompatibilidade(expressao, destino),
      });

      // Montar objeto de análise compatível com NomeAtualPDF
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
        is_free: true,
        created_at: lead.created_at,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      // Renderizar o PDF do relatório
      const pdfBuffer = await renderToBuffer(
        React.createElement(NomeAtualPDF, {
          analysis: analysisObj as any,
          magneticNames: [],
          userName: fullName.split(' ')[0],
        }) as any
      );
      
      pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      // Atualizar o registro com o PDF gerado no Supabase para futuros downloads rápidos
      await supabase
        .from('free_analyses_leads')
        .update({
          pdf_base64: pdfBase64,
          status: 'complete',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    // Decodificar base64 para buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Nome do arquivo limpo e amigável
    const slugName = lead.nome_completo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `analise-gratuita-${slugName}.pdf`;

    return new Response(pdfBuffer, {
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
    console.error('[download-pdf] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao recuperar ou gerar PDF' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
