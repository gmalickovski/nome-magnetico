import type { APIRoute } from 'astro';
import { z } from 'zod';
import { supabase } from '../../backend/db/supabase';
import { hasActiveSubscription } from '../../backend/db/subscriptions';
import { getAnalysis } from '../../backend/db/analyses';
import { buildClientBirthNamePanel } from '../../backend/numerology/birth-name-panel';
import { getArquetipo } from '../../backend/numerology/archetypes';
import { manualNameSessions, ManualNameSessionError } from '../../backend/numerology/manual-name-session';
import { computeContextualRadarAxes, motorRadarToRecord } from '../../shared/interactive-engine/motor-radar';
import { resolveRadarContext } from '../../shared/interactive-engine/radar-context';
import { NOME_SOCIAL_MAX_MANUAIS, normalizarChaveNome, validarNomeManual } from '../../shared/nome-social/manual-name-limits';
import { parseIsoBirthDate } from '../../backend/public-free-analysis/birth-date';

const contextSchema = z.object({
  action: z.literal('start'), chatKey: z.string().uuid(),
  nomeNascimento: z.string().min(2).max(150), dataNascimento: z.string().max(10),
  areaFoco: z.enum(['carreira_negocios', 'prosperidade_financeira', 'relacionamentos_harmonia', 'autoestima_expressao']).nullable(),
  ondeAssinaRaw: z.array(z.string().max(80)).max(10),
  analysisId: z.string().uuid().optional(),
  sugestoesExistentes: z.array(z.string().min(2).max(150)).max(14),
});
const schema = z.discriminatedUnion('action', [contextSchema, z.object({ action: z.literal('evaluate'), sessionId: z.string().uuid(), nome: z.string().max(150), sugestoesExistentes: z.array(z.string().min(2).max(150)).max(14).optional() })]);
export function origemPermitida(origin: string, request: Request): boolean {
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const candidatos = [request.headers.get('host'), request.headers.get('x-forwarded-host'), new URL(request.url).host]
    .filter((h): h is string => Boolean(h))
    .map((h) => h.split(',')[0]!.trim().toLowerCase());
  return candidatos.includes(host);
}
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, locals }) => {
  let user = locals.user;
  if (!user) {
    const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (bearer) { const { data, error } = await supabase.auth.getUser(bearer); if (!error) user = data.user ?? undefined; }
  }
  if (!user) return json({ error: 'Autenticação necessária.' }, 401);
  // DEV-317: atrás do Nginx, request.url é o endereço interno (localhost). Compara com o Host público.
  const origin = request.headers.get('origin');
  if (origin && !origemPermitida(origin, request)) return json({ error: 'Origem inválida.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Envie os dados em JSON.' }, 415);
  if (Number(request.headers.get('content-length') ?? 0) > 8192) return json({ error: 'Dados muito extensos.' }, 413);
  try {
    if (!await hasActiveSubscription(user.id, 'nome_social')) return json({ error: 'Acesso ativo ao Nome Social necessário.' }, 403);
    const text = await request.text();
    if (text.length > 8192) return json({ error: 'Dados muito extensos.' }, 413);
    let raw: unknown; try { raw = JSON.parse(text); } catch { return json({ error: 'Dados inválidos.' }, 400); }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return json({ error: 'Dados inválidos.' }, 400);
    const body = parsed.data;
    if (body.action === 'start') {
      if (validarNomeManual(body.nomeNascimento) || !/^\d{2}\/\d{2}\/\d{4}$/.test(body.dataNascimento) || !parseIsoBirthDate(body.dataNascimento.split('/').reverse().join('-')).ok) return json({ error: 'Confira o nome e a data de nascimento.' }, 400);
      let context = { nomeNascimento: body.nomeNascimento, dataNascimento: body.dataNascimento, areaFoco: body.areaFoco, ondeAssinaRaw: body.ondeAssinaRaw, analysisId: body.analysisId };
      if (body.analysisId) {
        const analysis = await getAnalysis(body.analysisId);
        if (!analysis || analysis.user_id !== user.id || analysis.product_type !== 'nome_social') return json({ error: 'Análise não encontrada.' }, 404);
        const freq = analysis.frequencias_numeros as any;
        const savedContext = resolveRadarContext(freq);
        const rawDate = freq?.ranking?.dataNascimento ?? analysis.data_nascimento;
        const date = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? `${rawDate.slice(8, 10)}/${rawDate.slice(5, 7)}/${rawDate.slice(0, 4)}` : rawDate;
        context = { ...context, nomeNascimento: freq?.ranking?.nomeNascimento ?? analysis.nome_completo, dataNascimento: date, areaFoco: savedContext.areaFoco, ondeAssinaRaw: savedContext.ondeAssinaRaw };
      }
      const sessionId = manualNameSessions.start(user.id, body.chatKey, context, body.sugestoesExistentes);
      return json({ sessionId, used: manualNameSessions.get(user.id, sessionId).results.size, maxManuais: NOME_SOCIAL_MAX_MANUAIS });
    }
    const invalid = validarNomeManual(body.nome);
    if (invalid) return json({ error: invalid }, 400);
    const session = manualNameSessions.get(user.id, body.sessionId);
    body.sugestoesExistentes?.forEach(n => session.existing.add(normalizarChaveNome(n)));
    const result = manualNameSessions.evaluate(user.id, body.sessionId, body.nome, context => {
      const panel = buildClientBirthNamePanel(body.nome, context.dataNascimento);
      return {
        id: `manual-${normalizarChaveNome(body.nome)}`, nome: body.nome, origem: 'manual', scoreVersion: 'v3',
        score: panel.score, expressao: panel.expressao, compatibilidade: panel.compatibilidade ?? 'neutro',
        bloqueiosEliminados: 0, bloqueiosRestantes: panel.bloqueiosCount, arcanosPositivos: 0,
        dimensoes: { amor: 0, carreira: 0, espiritual: 0 },
        panel: { ...panel, nome: body.nome, arquetipo: getArquetipo(panel.expressao) },
        radarAxes: motorRadarToRecord(computeContextualRadarAxes(body.nome, context.dataNascimento, context)),
      };
    });
    return json({ ...result, candidates: Array.from(session.results.values()), maxManuais: NOME_SOCIAL_MAX_MANUAIS });
  } catch (error) {
    if (error instanceof ManualNameSessionError) {
      if (error.code === 'limit') return json({ error: 'Você já avaliou 5 nomes manuais nesta sessão.', limiteManuais: true, maxManuais: NOME_SOCIAL_MAX_MANUAIS }, 429);
      if (error.code === 'expired') return json({ error: 'A sessão de avaliação expirou ou o servidor foi reiniciado. Seus resultados continuam no chat; reinicie a análise para avaliar novos nomes.', expired: true }, 410);
      if (error.code === 'context') return json({ error: 'O contexto da sessão mudou. Reinicie a análise para usar outro contexto.' }, 409);
      if (error.code === 'capacity') return json({ error: 'Avaliação indisponível agora. Tente novamente em alguns minutos.' }, 503);
      return json({ error: 'Nome inválido.' }, 400);
    }
    // Não registrar body, nome, nascimento ou o objeto de erro (pode conter PII).
    return json({ error: 'Não foi possível avaliar agora. Tente novamente.' }, 500);
  }
};
