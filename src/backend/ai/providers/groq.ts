import Groq from 'groq-sdk';
import type { AITask } from '../config/models';
import { getModel } from '../config/models';
import { getTaskConfig } from '../config/temperatures';

function getErrorStatus(err: unknown): number | undefined {
  return (err as { status?: number; response?: { status?: number } } | null)?.status
    ?? (err as { status?: number; response?: { status?: number } } | null)?.response?.status;
}

function getErrorMessage(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).toLowerCase();
}

function isRateLimit(err: unknown): boolean {
  // Não confia só em `instanceof Groq.APIError` — em builds com múltiplas cópias
  // do pacote no node_modules (comum em monorepo/hoisting), a checagem de classe
  // pode falhar mesmo sendo o mesmo erro. Checa a propriedade `status` direto
  // e cai para análise de mensagem (incluindo String(err), não só Error.message).
  if (getErrorStatus(err) === 429) return true;

  const msg = getErrorMessage(err);
  return msg.includes('429') || msg.includes('rate_limit') || msg.includes('rate limit') || msg.includes('quota');
}

/** Modelo descontinuado, 404, auth ou indisponibilidade permanente do Groq. */
function isGroqUnavailable(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (status === 404 || status === 401 || status === 403) return true;

  const msg = getErrorMessage(err);
  return (
    msg.includes('model_not_found') ||
    msg.includes('does not exist') ||
    msg.includes('decommissioned') ||
    msg.includes('not have access') ||
    msg.includes('invalid api key') ||
    msg.includes('incorrect api key')
  );
}

function mapGroqError(err: unknown): never {
  if (isRateLimit(err)) throw new Error('GROQ_RATE_LIMITED');
  if (isGroqUnavailable(err)) throw new Error('GROQ_UNAVAILABLE');
  throw err;
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
    mapGroqError(err);
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
    mapGroqError(err);
  }

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
