/**
 * LLM Escritor de Textos Curtos (DEV-235 · Seção 5A).
 * Responsabilidade: escrever frases curtas, eyebrows e hipóteses personalizadas.
 * NUNCA toma decisões de rota.
 * Possui fallback transparente para os textos estáticos canônicos em caso de ausência de chaves ou erro de rede.
 */

import { buildInitialMomentReadingText, type AreaFocoNomeMagnetico } from './copy';

export interface WriterHypothesisParams {
  areaFoco: AreaFocoNomeMagnetico;
  destino: number;
  notaHoje: number;
  potencial: number;
  bloqueio?: string | null;
  relatoUsuario?: string;
  alertaComplianceLegal?: boolean;
}

export async function writeHypothesis(params: WriterHypothesisParams): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback imediato determinístico se não houver chave configurada
  if (!apiKey || apiKey.trim() === '') {
    return buildInitialMomentReadingText({
      areaFoco: params.areaFoco,
      destino: params.destino,
      notaHoje: params.notaHoje,
      potencial: params.potencial,
      bloqueio: params.bloqueio ?? null,
      alertaComplianceLegal: Boolean(params.alertaComplianceLegal),
    });
  }

  try {
    const prompt = `Escreva uma hipótese empática e precisa em 2 a 3 frases para um consulente de numerologia cabalística.
Destino: ${params.destino}.
Nota civil hoje: ${params.notaHoje}/100.
Potencial da nova assinatura: ${params.potencial}/100.
Sequência no Triângulo da Vida: ${params.bloqueio || 'nenhuma'}.
Área de foco: ${params.areaFoco}.
Contexto informado: ${params.relatoUsuario || 'nenhum'}.
Regras estritas:
1. Zero travessões (— ou –) e zero símbolo de multiplicação (x).
2. Sem menção a diagnósticos médicos, depressão, dor física ou cura.
3. Termine com uma pergunta curta convidativa como: "Faz sentido para o seu momento?"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`OpenAI writer status ${res.status}`);
    }

    const data = await res.json();
    const texto = data.choices?.[0]?.message?.content?.trim();
    if (texto && texto.length > 20) {
      // Limpeza de travessões caso o modelo os tenha inserido
      return texto.replace(/[—–]/g, ',').replace(/\s{2,}/g, ' ');
    }
  } catch {
    // Silently falls back to canonical preset
  }

  return buildInitialMomentReadingText({
    areaFoco: params.areaFoco,
    destino: params.destino,
    notaHoje: params.notaHoje,
    potencial: params.potencial,
    bloqueio: params.bloqueio ?? null,
    alertaComplianceLegal: Boolean(params.alertaComplianceLegal),
  });
}
