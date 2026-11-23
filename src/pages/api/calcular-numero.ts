import type { APIRoute } from 'astro';
import { z } from 'zod';
import { calcularExpressao, calcularDestino } from '../../backend/numerology/numbers';
import { calcularTodosTriangulos, detectarBloqueios } from '../../backend/numerology/triangle';
import { ARCANOS } from '../../backend/numerology/arcanos';

const schema = z.object({
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  data_nascimento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato: DD/MM/AAAA'),
});

// Interpretações básicas por número de Expressão (1–9, 11, 22)
const INTERPRETACOES: Record<number, string> = {
  1: 'Você carrega a frequência do pioneiro — liderança, iniciativa e independência são suas marcas naturais. Seu nome irradia vontade de criar e de começar novos ciclos.',
  2: 'Sua vibração é de harmonia e cooperação. Você tem um dom natural para mediar conflitos e construir pontes entre pessoas. O equilíbrio é o seu maior tesouro.',
  3: 'Expressão, criatividade e comunicação definem sua frequência. Você nasceu para inspirar e encantar — as palavras e a arte são extensões da sua alma.',
  4: 'Construção sólida, método e disciplina: essa é a essência do seu nome. Você tem a capacidade rara de transformar sonhos em estruturas concretas e duradouras.',
  5: 'Liberdade, adaptação e movimento. O seu nome vibra na frequência da mudança — você aprende com cada experiência e expande horizontes onde outros veem barreiras.',
  6: 'Cuidado, beleza e responsabilidade. Sua frequência é de serviço amoroso — você tem o dom de criar ambientes harmoniosos e de acolher quem está ao seu redor.',
  7: 'Introspecção, espiritualidade e sabedoria. Você carrega a frequência do pesquisador da alma — a busca pelo conhecimento profundo é o seu caminho natural.',
  8: 'Poder, abundância e conquista. Sua vibração é de liderança material e espiritual — você tem a capacidade de construir legados e de gerir recursos com maestria.',
  9: 'Compaixão, universalidade e conclusão de ciclos. Você vibra na frequência do mestre compassivo — seu propósito envolve servir, curar e elevar consciências.',
  11: 'Você carrega o Número Mestre 11 — intuição elevada, inspiração e sensibilidade espiritual fora do comum. Um canal entre o humano e o divino.',
  22: 'Número Mestre 22: o Construtor Mestre. Você tem a capacidade de materializar visões extraordinárias e de impactar o mundo em grande escala.',
};

// Rate limit simples em memória (produção: usar Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    '0.0.0.0';

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Muitas requisições. Tente novamente em 1 hora.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

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

  const { nome_completo, data_nascimento } = parsed.data;

  try {
    const numeroExpressao = calcularExpressao(nome_completo);
    const numeroDestino = calcularDestino(data_nascimento);
    const nomePrimeiro = nome_completo.trim().split(' ')[0];
    const arcano = ARCANOS[numeroExpressao];
    const interpretacao = INTERPRETACOES[numeroExpressao] ?? INTERPRETACOES[9];

    const todosTriangulos = calcularTodosTriangulos(nome_completo, data_nascimento);
    const bloqueios = detectarBloqueios(todosTriangulos);

    return new Response(
      JSON.stringify({
        nome_primeiro: nomePrimeiro,
        numero_expressao: numeroExpressao,
        numero_destino: numeroDestino,
        arcano_nome: arcano?.nome ?? null,
        interpretacao_basica: interpretacao,
        quantidade_bloqueios: bloqueios.length,
        primeiro_bloqueio_titulo: bloqueios[0]?.titulo ?? null,
        cta_url: '/comprar?produto=nome_social&from=calculadora',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[calcular-numero] Erro:', err);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar cálculo' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
