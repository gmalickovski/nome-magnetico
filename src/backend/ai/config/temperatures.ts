import type { AITask } from './models';

export interface TaskConfig {
  temperature: number;
  maxTokens: number;
}

export const TASK_CONFIG: Record<AITask, TaskConfig> = {
  analysis: {
    temperature: 0.7,
    maxTokens: 6000,
  },
  suggestions: {
    temperature: 0.4,
    maxTokens: 2048,
  },
  guide: {
    temperature: 0.6,
    maxTokens: 3000,
  },
  support_polish: {
    temperature: 0.4,
    maxTokens: 1024,
  },
  // DEV-321: criatividade maior, resposta curta (só a lista em JSON).
  artistic_names: {
    temperature: 0.9,
    maxTokens: 600,
  },
};

export function getTaskConfig(task: AITask): TaskConfig {
  return TASK_CONFIG[task];
}
