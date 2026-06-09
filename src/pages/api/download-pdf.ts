import type { APIRoute } from 'astro';
import { supabase } from '../../backend/db/supabase';

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
      .select('nome_completo, pdf_base64')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return new Response(
        JSON.stringify({ error: 'Análise não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!lead.pdf_base64) {
      return new Response(
        JSON.stringify({ error: 'PDF ainda não foi gerado ou está indisponível' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Decodificar base64 para buffer
    const pdfBuffer = Buffer.from(lead.pdf_base64, 'base64');

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
      },
    });
  } catch (err: any) {
    console.error('[download-pdf] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao recuperar PDF' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
