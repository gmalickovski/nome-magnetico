import Groq from 'groq-sdk';
import type { AITask } from '../config/models';
import { getModel } from '../config/models';
import { getTaskConfig } from '../config/temperatures';

function isRateLimit(err: unknown): boolean {
  // Não confia só em `instanceof Groq.APIError` — em builds com múltiplas cópias
  // do pacote no node_modules (comum em monorepo/hoisting), a checagem de classe
  // pode falhar mesmo sendo o mesmo erro. Checa a propriedade `status` direto
  // e cai para análise de mensagem (incluindo String(err), não só Error.message).
  const status = (err as { status?: number; response?: { status?: number } } | null)?.status
    ?? (err as { status?: number; response?: { status?: number } } | null)?.response?.status;
  if (status === 429) return true;

  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('429') || msg.includes('rate_limit') || msg.includes('rate limit') || msg.includes('quota');
}

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY não configurado');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export interface AIResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  task: AITask,
  stream = false
): Promise<AIResponse> {
  const client = getGroqClient();
  const model = getModel('groq', task);
  const config = getTaskConfig(task);

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false,
    });
  } catch (err) {
    if (isRateLimit(err)) throw new Error('GROQ_RATE_LIMITED');
    throw err;
  }

  const choice = completion.choices[0];
  if (!choice?.message?.content) {
    throw new Error('Groq retornou resposta vazia');
  }

  return {
    content: choice.message.content,
    tokensInput: completion.usage?.prompt_tokens ?? 0,
    tokensOutput: completion.usage?.completion_tokens ?? 0,
  };
}

export async function* streamGroq(
  systemPrompt: string,
  userPrompt: string,
  task: AITask
): AsyncGenerator<string, void, unknown> {
  const client = getGroqClient();
  const model = getModel('groq', task);
  const config = getTaskConfig(task);

  let stream;
  try {
    stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    });
  } catch (err) {
    if (isRateLimit(err)) throw new Error('GROQ_RATE_LIMITED');
    throw err;
  }

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
