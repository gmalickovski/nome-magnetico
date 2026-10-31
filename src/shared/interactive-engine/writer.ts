/**
 * LLM Escritor de Textos Curtos (DEV-235 · Leitura do momento).
 * Sem potencial/nota harmonizada antes da escolha de sugestão.
 */

import {
  buildInitialMomentReadingText,
  type AreaFocoNomeMagnetico,
  type SubfocoMomento,
} from './copy';
import { validateMomentReadingText } from './moment-reading-validation';

export interface WriterHypothesisParams {
  nome: string;
  areaFoco: AreaFocoNomeMagnetico;
  destino: number;
  notaHoje: number;
  subfocoMomento?: SubfocoMomento | null;
  relatoUsuario?: string;
  alertaComplianceLegal?: boolean;
}

function templateFallback(params: WriterHypothesisParams): string {
  return buildInitialMomentReadingText({
    nome: params.nome,
    areaFoco: params.areaFoco,
    destino: params.destino,
    notaHoje: params.notaHoje,
    alertaComplianceLegal: Boolean(params.alertaComplianceLegal),
  });
}

function subfocoLabel(subfoco: SubfocoMomento | null | undefined): string {
  if (!subfoco) return 'não informado';
  return subfoco.replace(/_/g, ' ');
}

export async function writeHypothesis(params: WriterHypothesisParams): Promise<string> {
  const fallback = templateFallback(params);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return fallback;
  }

  const ctx = { notaHoje: params.notaHoje, destino: params.destino };

  try {
    const prompt = `Você escreve a "Leitura do momento" do produto Nome Magnético.
Voz: calorosa, direta, segunda pessoa (você). Português do Brasil. Sem emoji.
Tamanho: 2 a 3 frases, no máximo 280 caracteres no total.
Entrada:
- Nome: ${params.nome}
- Destino cabalístico: ${params.destino}
- Nota atual do nome de registro: ${params.notaHoje}
- Área de foco: ${params.areaFoco}
- Subfoco: ${subfocoLabel(params.subfocoMomento)}
- Relato do consulente: ${params.relatoUsuario?.trim() || 'nenhum'}

Tarefa: reconhecer o momento de vida, ligar de forma leve ao Destino e à nota atual, e convidar a escolher uma das sugestões de assinatura (sem prometer resultado).
Proibido: citar qualquer outro número além de ${params.notaHoje} e ${params.destino}; travessão (—); símbolo ×; palavras score, ranking; promessas de ganho, garantia, saúde, cura, ansiedade, religião, IA ou mudança de documento.`;

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
        temperature: 0.6,
        max_tokens: 180,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`OpenAI writer status ${res.status}`);
    }

    const data = await res.json();
    const texto = data.choices?.[0]?.message?.content?.trim();
    if (texto && validateMomentReadingText(texto, ctx)) {
      return texto.replace(/[—–]/g, ',').replace(/\s{2,}/g, ' ');
    }
  } catch {
    // fallback abaixo
  }

  return fallback;
}
