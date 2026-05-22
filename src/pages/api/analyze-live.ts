import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { supabase } from '@/backend/db/supabase';
import { calcularTodosTriangulos, detectarBloqueios } from '@/backend/numerology/triangle';
import { calcularExpressao, calcularDestino, calcularMotivacao, calcularImpressao, calcularMissao } from '@/backend/numerology/numbers';
import { detectarLicoesCarmicas, detectarTendenciasOcultas, calcularDebitosCarmicos } from '@/backend/numerology/karmic';
import { avaliarCompatibilidade } from '@/backend/numerology/harmonization';
import { calcularScore } from '@/backend/numerology/score';

const RequestSchema = z.object({
  nome_candidato: z.string().min(2),
  data_nascimento_db: z.string().optional().or(z.literal('')),
});

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIp(request: Request, clientAddress?: string) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    clientAddress ||
    'unknown'
  );
}

function hashIp(ip: string) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'nome-magnetico';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return json({ error: 'Dados invalidos' }, 400);
  }

  const user = (locals as any).user;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin';

    const { data: freeAnalysis } = await supabase
      .from('analyses')
      .select('id, status')
      .eq('user_id', user.id)
      .or('is_free.eq.true,product_type.eq.analise_gratuita')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!isAdmin && freeAnalysis) {
      return json({
        code: 'free_analysis_already_used',
        error: 'Você atingiu o limite da análise gratuita. Já existe uma análise de nascimento registrada nesta conta.',
        redirectUrl: '/app',
      }, 409);
    }
  } else {
    const ipHash = hashIp(getClientIp(request, clientAddress));
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('public_analysis_rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if (countError) {
      console.error('[api/analyze-live] rate limit count failed:', countError.message);
    } else if ((count ?? 0) >= 3) {
      return json({
        code: 'public_rate_limit',
        error: 'Identificamos múltiplas consultas. Para continuar analisando novos nomes e frequências, adquira o Nome Social.',
        redirectUrl: '/app',
      }, 429);
    }

    const { error: insertError } = await supabase
      .from('public_analysis_rate_limits')
      .insert({
        ip_hash: ipHash,
        nome_consultado: body.nome_candidato.trim().slice(0, 150),
      });

    if (insertError) {
      console.error('[api/analyze-live] rate limit insert failed:', insertError.message);
    }
  }

  try {
    let bdDataStr = '';
    if (body.data_nascimento_db && body.data_nascimento_db.includes('-')) {
      const partes = body.data_nascimento_db.split('-');
      bdDataStr = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const triangulos = calcularTodosTriangulos(body.nome_candidato, bdDataStr);
    const bloqueios = detectarBloqueios(triangulos);

    const expressao = calcularExpressao(body.nome_candidato);
    const destino = calcularDestino(bdDataStr);
    const motivacao = calcularMotivacao(body.nome_candidato);
    const impressao = calcularImpressao(body.nome_candidato);
    const missao = calcularMissao(body.nome_candidato, bdDataStr);

    const licoesCarmicas = detectarLicoesCarmicas(body.nome_candidato);
    const tendenciasOcultas = detectarTendenciasOcultas(body.nome_candidato);
    const debitosCarmicos = calcularDebitosCarmicos(bdDataStr, destino, motivacao, expressao);

    const compatibilidade = avaliarCompatibilidade(expressao, destino);
    const score = calcularScore({
      bloqueios: bloqueios.length,
      licoesCarmicas: licoesCarmicas.length,
      tendenciasOcultas: tendenciasOcultas.length,
      debitosCarmicos: debitosCarmicos.length,
      debitosCarmicoFixos: debitosCarmicos.filter(d => d.fixo).length,
      compatibilidade,
    });

    return json({
      triangulos,
      bloqueios,
      numeros: {
        expressao,
        destino,
        motivacao,
        impressao,
        missao,
      },
      licoesCarmicas,
      tendenciasOcultas,
      debitosCarmicos,
      compatibilidade,
      score: { total: score },
    });
  } catch (error) {
    console.error('[api/analyze-live] Erro:', error);
    return json({ error: 'Erro de calculo interno' }, 500);
  }
};
