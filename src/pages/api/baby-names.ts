/**
 * POST /api/baby-names (DEV-326)
 *
 * Nomes do caminho do bebê no chat: nomes dos pais (analisados sempre) e sugestões por grupo.
 * Sem IA e sem banco: só cálculo numerológico. Público como o `/api/decide-live`, com limite
 * simples por visitante em memória (sem IP em claro). Nomes e sobrenomes do bebê não são
 * gravados nem registrados em log.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { getClientIp } from '../../backend/security/apiRateLimit';
import {
  analisarNomeRegistradoBebe,
  gerarNomesBebe,
  type NomeBebeSugerido,
} from '../../backend/numerology/products/nome-bebe-chat';

const DATA_PT = /^\d{2}\/\d{2}\/\d{4}$/;

const schema = z.object({
  situacao: z.enum(['nao_nasceu', 'nasceu_sem_registro', 'nasceu_registrado']),
  data_tipo: z.enum(['marcada', 'prevista']).optional(),
  data: z.string().regex(DATA_PT),
  sexo: z.enum(['menina', 'menino', 'indefinido']).default('indefinido'),
  sobrenomes: z.array(z.string().max(40)).max(4).default([]),
  nomes_pais: z.array(z.string().max(40)).max(5).default([]),
  nome_registrado: z.string().max(80).optional(),
  estilos: z
    .array(z.enum(['classico', 'moderno', 'curto', 'biblico', 'internacional', 'tanto_faz']))
    .max(2)
    .optional(),
  /** Nomes já mostrados no chat (para "Gerar outras opções"). */
  excluir: z.array(z.string().max(80)).max(80).optional(),
});

// ── Limite por visitante, em memória (nunca persistido, sem IP em claro) ──────
const JANELA_MS = 10 * 60 * 1000;
const MAX_CHAMADAS = 40;
const SALT = randomBytes(16).toString('hex');
const baldes = new Map<string, { n: number; fim: number }>();

export function resetBabyNamesRateLimitForTests(): void {
  baldes.clear();
}

function permitido(chave: string, agora = Date.now()): boolean {
  if (baldes.size > 2000) {
    for (const [k, v] of baldes) if (v.fim <= agora) baldes.delete(k);
  }
  const atual = baldes.get(chave);
  if (!atual || atual.fim <= agora) {
    baldes.set(chave, { n: 1, fim: agora + JANELA_MS });
    return true;
  }
  if (atual.n >= MAX_CHAMADAS) return false;
  atual.n += 1;
  return true;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Formato que o chat já entende (`mapCandidate`), mais o grupo e os dias bons. */
function paraChat(s: NomeBebeSugerido) {
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
    grupoBebe: s.grupo,
    diasBons: s.diasBons,
    diasTotal: s.diasTotal,
    origem: 'gerado' as const,
  };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json({ error: 'Body inválido' }, 400);
  }
  const parsed = schema.safeParse(corpo);
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, 400);
  const d = parsed.data;

  const chave = createHash('sha256').update(`${SALT}:${getClientIp(request, clientAddress)}`).digest('hex').slice(0, 24);
  if (!permitido(chave)) {
    return json({ error: 'Muitos pedidos desta conexão. Aguarde alguns minutos e tente de novo.' }, 429);
  }

  try {
    if (d.situacao === 'nasceu_registrado') {
      const nome = d.nome_registrado ? analisarNomeRegistradoBebe(d.nome_registrado, d.data) : null;
      if (!nome) return json({ error: 'Confira o nome completo e a data de nascimento do bebê.' }, 400);
      return json({ seusNomes: [paraChat(nome)], sugestoes: [], semSugestoes: false, gruposSemSugestoes: [], motivoSemSugestoes: null, nomesPaisIgnorados: [], janela: null });
    }

    const r = gerarNomesBebe({
      sobrenomes: d.sobrenomes,
      data: d.data,
      modoData: d.situacao === 'nao_nasceu' && d.data_tipo === 'prevista' ? 'janela' : 'exata',
      sexo: d.sexo,
      estilos: (d.estilos ?? []).filter((e) => e !== 'tanto_faz'),
      nomesPais: d.nomes_pais,
      excluir: d.excluir,
    });
    if (r.motivoSemSugestoes === 'data_invalida') return json({ error: 'Confira a data informada.' }, 400);
    return json({
      seusNomes: r.seusNomes.map(paraChat),
      sugestoes: r.sugestoes.map(paraChat),
      semSugestoes: r.semSugestoes,
      gruposSemSugestoes: r.gruposSemSugestoes,
      motivoSemSugestoes: r.motivoSemSugestoes,
      nomesPaisIgnorados: r.nomesPaisIgnorados,
      janela: r.janela,
    });
  } catch (err) {
    console.error('[api/baby-names] erro:', (err as Error)?.message);
    return json({ error: 'Não foi possível calcular os nomes agora.' }, 500);
  }
};
