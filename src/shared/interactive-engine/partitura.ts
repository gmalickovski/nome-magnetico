/**
 * Partitura do Motor Interativo (DEV-235 · Seção 5A).
 * Define a matriz Passo × Camada (Regra em Código, Jev, LLM Escritor, Descoberta/Cálculo).
 */

export type PassoChatId =
  | 'nome_nascimento'
  | 'nome_uso'
  | 'sobrenomes_uso'
  | 'relacao_nome'
  | 'onde_assina'
  | 'estilo_presenca'
  | 'area_foco'
  | 'subfoco'
  | 'abertura_mudanca'
  | 'sobrenomes'
  | 'onde_vai_usar'
  | 'foco_momento'
  | 'esclarecimento'
  | 'palpite'
  | 'resposta_palpite'
  | 'formato_preferido'
  | 'fim_coleta'
  | 'gerar_outras_opcoes';

export interface PassoConfig {
  id: PassoChatId;
  ordem: number;
  descricao: string;
  usaRegraCodigo: boolean;
  usaJev: boolean;
  usaLlmEscritor: boolean;
  usaCalculoLocal: boolean;
  limiar?: string;
}

export const PARTITURA_PASSOS: Record<PassoChatId, PassoConfig> = {
  nome_nascimento: {
    id: 'nome_nascimento',
    ordem: 1,
    descricao: 'Validação civil do nome de certidão e data de nascimento.',
    usaRegraCodigo: true,
    usaJev: false,
    usaLlmEscritor: false,
    usaCalculoLocal: true,
  },
  sobrenomes: {
    id: 'sobrenomes',
    ordem: 2,
    descricao: 'Extração e definição de sobrenomes a manter ou retirar.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: false,
    usaCalculoLocal: true,
    limiar: 'CHOICE_MIN (> 0.45)',
  },
  onde_vai_usar: {
    id: 'onde_vai_usar',
    ordem: 3,
    descricao: 'Canais de uso principal da nova assinatura.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: true,
    usaCalculoLocal: false,
    limiar: 'CHOICE_MIN (> 0.45)',
  },
  foco_momento: {
    id: 'foco_momento',
    ordem: 4,
    descricao: 'Área da vida que o consulente mais quer destravar.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: true,
    usaCalculoLocal: false,
    limiar: 'NOUL_YES/NO (>= 0.7 / <= 0.3)',
  },
  esclarecimento: {
    id: 'esclarecimento',
    ordem: 5,
    descricao: 'Pergunta de aprofundamento acionada em caso de ambiguidade.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: true,
    usaCalculoLocal: false,
    limiar: 'CHOICE_MIN (<= 0.45)',
  },
  palpite: {
    id: 'palpite',
    ordem: 6,
    descricao: 'Hipótese de leitura interpretativa do momento.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: true,
    usaCalculoLocal: true,
    limiar: 'GUESS_MIN (> 0.42)',
  },
  resposta_palpite: {
    id: 'resposta_palpite',
    ordem: 7,
    descricao: 'Feedback do consulente (Na mosca, Em parte, Não).',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: true,
    usaCalculoLocal: false,
    limiar: 'JUDGE_MAX (< 0.2)',
  },
  formato_preferido: {
    id: 'formato_preferido',
    ordem: 8,
    descricao: 'Preferência de estilo (sobrenome forte, acento sutil, curto).',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: false,
    usaCalculoLocal: true,
    limiar: 'CHOICE_MIN (> 0.45)',
  },
  fim_coleta: {
    id: 'fim_coleta',
    ordem: 9,
    descricao: 'Encerramento da coleta e revelação do resultado no chat.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: false,
    usaCalculoLocal: true,
    limiar: 'NOUL_YES (>= 0.7)',
  },
  gerar_outras_opcoes: {
    id: 'gerar_outras_opcoes',
    ordem: 10,
    descricao: 'Regeneração de sugestões respeitando novos filtros.',
    usaRegraCodigo: true,
    usaJev: true,
    usaLlmEscritor: false,
    usaCalculoLocal: true,
    limiar: 'CHOICE_MIN (> 0.45)',
  },
};
