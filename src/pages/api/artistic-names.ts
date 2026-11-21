/**
 * POST /api/artistic-names (DEV-321)
 *
 * Nomes artísticos do chat: até 3 próximos do nome de nascimento e até 3 totalmente
 * novos. Público como o `/api/decide-live` (visitante e logado), com o mesmo teto de
 * chamadas externas (`jevBudget`) e o mesmo interruptor (`NM_JEV_REMOTE_DISABLED`).
 * A IA só dá ideias; o motor `products/nome-artistico` valida tudo. Se a IA não
 * responder, o banco determinístico completa, sem travar o chat.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { generateArtisticNameIdeas } from '../../backend/ai/brain';
import { getClientIp, hashClientIp } from '../../backend/security/apiRateLimit';
import {
  gerarNomesArtisticos,
  querNovos,
  type NomeArtisticoSugerido,
} from '../../backend/numerology/products/nome-artistico';
import { separarNome } from '../../backend/numerology/products/nome-artistico/proximos';
import { jevBudget, isJevRemoteDisabled } from '../../shared/interactive-engine/providers/jev-safety';
import {
  labelAreaArtistica,
  labelDetalheArtistico,
  labelImagemArtistica,
  sanitizeOutroText,
} from '../../shared/interactive-engine/questionnaire-adaptive';

const AI_TIMEOUT_MS = 25_000;

const schema = z.object({
  nome_completo: z.string().min(2).max(150),
  data_nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  area_artistica: z
    .enum(['cantor', 'ator', 'personagem', 'criador_conteudo', 'escritor', 'dj_produtor', 'outra'])
    .optional(),
  area_artistica_outro: z.string().max(60).optional(),
  detalhe_artistico: z.array(z.string().max(40)).max(2).optional(),
  genero_persona: z.enum(['feminino', 'masculino', 'neutro']).optional(),
  imagem_artistica: z
    .array(z.enum(['marcante', 'sofisticada', 'divertida', 'misteriosa', 'popular']))
    .max(2)
    .optional(),
  tipo_nome_artistico: z.enum(['proximo', 'diferente', 'ambos']).default('ambos'),
  sobrenomes_excluidos: z.array(z.string().max(80)).max(10).optional(),
  manter_primeiro_nome: z.boolean().optional(),
  sem_acento: z.boolean().optional(),
  /** Nomes já mostrados no chat (para "Gerar outras opções"). */
  excluir: z.array(z.string().max(150)).max(60).optional(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function comTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('AI_TIMEOUT')), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Formato que o chat já entende (`mapCandidate`), mais a seção. */
function paraChat(s: NomeArtisticoSugerido) {
  return {
    nomeCompleto: s.nomeCompleto,
    score: s.score,
    expressao: s.expressao,
    motivacao: s.motivacao,
    missao: s.missao,
    impressao: s.impressao,
    destino: s.destino,
    compatibilidade: s.compatibilidade,
    bloqueios: s.bloqueios,
    explicacaoPerfil: s.explicacao || undefined,
    secao: s.secao,
    origem: 'gerado' as const,
  };
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }
  const parsed = schema.safeParse(corpo);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, 400);
  }
  const d = parsed.data;

  const areaOutro = d.area_artistica_outro ? sanitizeOutroText(d.area_artistica_outro) || null : null;
  const perfil = {
    areaArtistica: d.area_artistica ?? null,
    areaArtisticaOutro: areaOutro,
    generoPersona: d.genero_persona ?? null,
    imagemArtistica: d.imagem_artistica ?? [],
    tipoNomeArtistico: d.tipo_nome_artistico,
    sobrenomesExcluidos: d.sobrenomes_excluidos,
    manterPrimeiroNome: d.manter_primeiro_nome,
    semAcento: d.sem_acento,
  };

  let ideiasIA: string[] = [];
  let usouIA = false;
  if (querNovos(d.tipo_nome_artistico) && !isJevRemoteDisabled()) {
    const userId = (locals as { user?: { id?: string } }).user?.id ?? null;
    const chave = userId ? `u:${userId}` : `ip:${hashClientIp(getClientIp(request, clientAddress))}`;
    if (jevBudget.tryReserve(chave).ok) {
      try {
        const area =
          d.area_artistica === 'outra'
            ? areaOutro || 'artista'
            : (labelAreaArtistica(d.area_artistica)?.toLowerCase() ?? 'artista');
        ideiasIA = await comTimeout(
          generateArtisticNameIdeas(
            {
              areaArtistica: area,
              detalhes: (d.detalhe_artistico ?? [])
                .map((id) => labelDetalheArtistico(d.area_artistica, id)?.toLowerCase())
                .filter((x): x is string => Boolean(x)),
              generoPersona: d.genero_persona ?? null,
              imagens: (d.imagem_artistica ?? [])
                .map((id) => labelImagemArtistica(id)?.toLowerCase())
                .filter((x): x is string => Boolean(x)),
              partesNascimento: separarNome(d.nome_completo),
              quantidade: 12,
            },
            userId,
            null,
          ),
          AI_TIMEOUT_MS,
        );
        usouIA = ideiasIA.length > 0;
      } catch (err) {
        // Sem IA, o banco determinístico completa. Nunca expor a mensagem de erro.
        console.warn('[api/artistic-names] IA indisponível, usando o banco local:', (err as Error)?.message?.slice(0, 120));
      }
    }
  }

  try {
    const r = gerarNomesArtisticos({
      nomeNascimento: d.nome_completo,
      dataNascimento: d.data_nascimento,
      perfil,
      ideiasIA,
      excluir: d.excluir,
    });
    return json({
      proximos: r.proximos.map(paraChat),
      novos: r.novos.map(paraChat),
      semProximos: r.semProximos,
      semNovos: r.semNovos,
      providerUsed: usouIA ? 'ia' : 'banco',
    });
  } catch (err) {
    console.error('[api/artistic-names] erro:', (err as Error)?.message);
    return json({ error: 'Não foi possível gerar os nomes agora.' }, 500);
  }
};
