import type { ProductType } from '../../payments/stripe';
import type { AITask } from './models';

export interface ProductAIConfig {
  tasks: AITask[];
  systemPromptKey: string;
}

export const PRODUCT_AI_CONFIG: Record<ProductType, ProductAIConfig> = {
  nome_social: {
    // DEV-321: o caminho artístico do chat roda dentro do produto nome_social.
    tasks: ['analysis', 'suggestions', 'guide', 'artistic_names'],
    systemPromptKey: 'kabbalistic',
  },
  nome_bebe: {
    tasks: ['analysis', 'suggestions'],
    systemPromptKey: 'kabbalistic',
  },
  nome_empresa: {
    tasks: ['analysis', 'suggestions'],
    systemPromptKey: 'kabbalistic',
  },
};
