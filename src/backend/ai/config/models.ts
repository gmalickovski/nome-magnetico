import type { AIProvider } from './providers';

export type AITask = 'analysis' | 'suggestions' | 'guide' | 'support_polish';

export const MODELS: Record<AIProvider, Record<AITask, string>> = {
  // Groq retirou llama-3.3-70b-versatile e llama-3.1-8b-instant em 16/08/2026
  // (free/developer). Substitutos oficiais: gpt-oss-120b / gpt-oss-20b.
  groq: {
    analysis: 'openai/gpt-oss-120b',
    suggestions: 'openai/gpt-oss-120b',
    guide: 'openai/gpt-oss-120b',
    support_polish: 'openai/gpt-oss-20b',
  },
  claude: {
    analysis: 'claude-sonnet-4-6',
    suggestions: 'claude-sonnet-4-6',
    guide: 'claude-haiku-4-5-20251001',
    support_polish: 'claude-haiku-4-5-20251001',
  },
  openai: {
    analysis: 'gpt-4o',
    suggestions: 'gpt-4o-mini',
    guide: 'gpt-4o-mini',
    support_polish: 'gpt-4o-mini',
  },
};

export function getModel(provider: AIProvider, task: AITask): string {
  return MODELS[provider][task];
}
