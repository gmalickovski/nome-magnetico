import type { APIRoute } from 'astro';
import { z } from 'zod';
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
import { calcularScore } from '../../backend/numerology/score';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { NomeAtualPDF } from '../../frontend/components/pdf/NomeAtualPDF';

const schema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  data_nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato: DD/MM/AAAA'),
  email: z.string().email('E-mail inválido'),
});

function toDbDate(date: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [d, m, y] = date.split('/');
    return `${y}-${m}-${d}`;
  }
  return date;
}

export const POST: APIRoute = async ({ request, url }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { nome_completo, data_nascimento, email } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Verificar se este e-mail já solicitou uma análise gratuita
    const { data: existingLeads } = await supabase
      .from('free_analyses_leads')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1);

    if (existingLeads && existingLeads.length > 0) {
      return new Response(
        JSON.stringify({ error: 'already_requested' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Criar o registro na tabela de leads de análises gratuitas como pendente
    const { data: lead, error: insertError } = await supabase
      .from('free_analyses_leads')
      .insert({
        email: normalizedEmail,
        nome_completo: nome_completo.trim(),
        data_nascimento: toDbDate(data_nascimento),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !lead) {
      throw new Error(`Erro ao salvar lead no Supabase: ${insertError?.message}`);
    }

    // 3. Executar o processamento em background (não bloqueia a resposta HTTP para a landing page)
    (async () => {
      try {
        // Atualizar status para processando
        await supabase
          .from('free_analyses_leads')
          .update({ status: 'processing' })
          .eq('id', lead.id);

        // Cálculos numerológicos locais
        const todosTriangulos = calcularTodosTriangulos(nome_completo, data_nascimento);
        const bloqueios = detectarBloqueios(todosTriangulos);
        const expressao = calcularExpressao(nome_completo);
        const destino = calcularDestino(data_nascimento);
        const motivacao = calcularMotivacao(nome_completo);
        const impressao = calcularImpressao(nome_completo);
        const missao = calcularMissao(nome_completo, data_nascimento);
        const licoesCarmicas = detectarLicoesCarmicas(nome_completo);
        const tendenciasOcultas = detectarTendenciasOcultas(nome_completo);
        const debitosCarmicos = calcularDebitosCarmicos(data_nascimento, destino, motivacao, expressao);
        const frequencias = mapearFrequencias(nome_completo);
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

        // Renderizar o PDF do relatório
        const pdfBuffer = await renderToBuffer(
          React.createElement(NomeAtualPDF, {
            analysis: analysisObj as any,
            magneticNames: [],
            userName: nome_completo.split(' ')[0],
          }) as any
        );
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

        // Atualizar o registro com o PDF gerado
        await supabase
          .from('free_analyses_leads')
          .update({
            pdf_base64: pdfBase64,
          })
          .eq('id', lead.id);

        // Chamar n8n para enviar o e-mail via notify
        await notify('free_analysis.requested', {
          email: normalizedEmail,
          firstName: nome_completo.split(' ')[0] || nome_completo,
          fullName: nome_completo,
          downloadUrl: `${url.origin}/api/download-pdf?id=${lead.id}`
        });

        // Atualizar o status do lead para concluído
        await supabase
          .from('free_analyses_leads')
          .update({
            status: 'complete',
            completed_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

      } catch (err: any) {
        console.error(`[teste-bloqueio background] erro processando ID ${lead.id}:`, err.message);
        await supabase
          .from('free_analyses_leads')
          .update({
            status: 'error',
            error_message: err.message ?? String(err),
          })
          .eq('id', lead.id);
      }
    })();

    // Retorna imediatamente informando que foi recebido com sucesso
    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[teste-bloqueio] Erro:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Erro ao processar análise' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
