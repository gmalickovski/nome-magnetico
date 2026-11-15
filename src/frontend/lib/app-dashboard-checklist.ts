export type ChecklistKey =
  | 'pdf'
  | 'treino_assinatura'
  | 'registro_identidade'
  | 'redes_email'
  | 'cartao_visita'
  | 'primeiro_documento';

export interface ChecklistItemDef {
  key: ChecklistKey;
  step: number;
  label: string;
  description: string;
}

export const CHECKLIST_ITEMS: ReadonlyArray<ChecklistItemDef> = [
  {
    key: 'pdf',
    step: 1,
    label: 'Baixar o dossiê completo em PDF',
    description: 'Salve seu mapa cabalístico e o guia de traçado para consultar sempre que precisar.',
  },
  {
    key: 'treino_assinatura',
    step: 2,
    label: 'Treinar a nova assinatura (ciclo de 21 dias)',
    description:
      'Pratique a grafia legível, contínua e levemente ascendente até que o movimento flua naturalmente.',
  },
  {
    key: 'registro_identidade',
    step: 3,
    label: 'Atualizar a assinatura na CIN (novo RG), CNH e Cartório',
    description:
      'No Brasil, a Carteira de Identidade Nacional (CIN) oficializa a nova rubrica no Registro Civil; depois atualize gradualmente na CNH (Detran) e na ficha de firma em Cartório de Notas.',
  },
  {
    key: 'redes_email',
    step: 4,
    label: 'Usar o nome nas redes sociais e assinatura de e-mail',
    description:
      'Adote sua identidade harmonizada no Instagram, LinkedIn, WhatsApp e rodapé de e-mails profissionais.',
  },
  {
    key: 'cartao_visita',
    step: 5,
    label: 'Criar cartão de visita digital ou físico com o nome harmonizado',
    description:
      'Consolidar o nome em materiais comerciais, portfólio e cartões multiplica o alcance da nova frequência.',
  },
  {
    key: 'primeiro_documento',
    step: 6,
    label: 'Assinar seu primeiro documento ou contrato oficial',
    description:
      'Sele o ciclo firmando um acordo, proposta ou documento real com a sua nova assinatura magnética.',
  },
];

export type ChecklistState = Record<ChecklistKey, boolean>;

export const EMPTY_CHECKLIST: ChecklistState = {
  pdf: false,
  treino_assinatura: false,
  registro_identidade: false,
  redes_email: false,
  cartao_visita: false,
  primeiro_documento: false,
};

export interface VibrationActivationInfo {
  doneCount: number;
  totalCount: number;
  percentage: number;
  levelName: string;
  summary: string;
  textColor: string;
  barGradient: string;
  badgeStyle: {
    color: string;
    backgroundColor: string;
    borderColor: string;
  };
}

export function checklistStorageKey(userId: string) {
  return `nm-dashboard-checklist:${userId}`;
}

export function checklistSlideStorageKey(userId: string, slideKey: string) {
  return `nm-dashboard-checklist:v2:${userId}:${slideKey}`;
}

export function offerDismissStorageKey(userId: string) {
  return `nm-dashboard-offer-dismissed:${userId}`;
}

export function parseChecklistState(raw: unknown): ChecklistState {
  if (!raw) return { ...EMPTY_CHECKLIST };
  try {
    const parsed = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_CHECKLIST };
    return {
      pdf: Boolean(parsed.pdf),
      treino_assinatura: Boolean(parsed.treino_assinatura ?? parsed.tracado),
      registro_identidade: Boolean(parsed.registro_identidade),
      redes_email: Boolean(parsed.redes_email ?? parsed.redes),
      cartao_visita: Boolean(parsed.cartao_visita),
      primeiro_documento: Boolean(parsed.primeiro_documento),
    };
  } catch {
    return { ...EMPTY_CHECKLIST };
  }
}

export function countChecklistDone(state: ChecklistState): number {
  return CHECKLIST_ITEMS.filter((item) => state[item.key]).length;
}

/**
 * Converte a quantidade de passos concluídos em um índice visual de
 * Grau de Ativação Vibracional alinhado à paleta semântica do score.
 */
export function getVibrationActivationInfo(
  doneCount: number,
  totalCount = CHECKLIST_ITEMS.length,
): VibrationActivationInfo {
  const safeTotal = Math.max(1, totalCount);
  const safeDone = Math.max(0, Math.min(safeTotal, doneCount));
  const percentage = Math.round((safeDone / safeTotal) * 100);

  if (safeDone === 0) {
    return {
      doneCount: safeDone,
      totalCount: safeTotal,
      percentage: 0,
      levelName: 'Potencial Latente',
      summary: 'Marque os primeiros passos para começar a ativar esta vibração na prática.',
      textColor: '#d7c6ff',
      barGradient: 'from-[#bea5ff]/60 to-[#d7c6ff]/80',
      badgeStyle: {
        color: '#d7c6ff',
        backgroundColor: 'rgba(190, 165, 255, 0.12)',
        borderColor: 'rgba(190, 165, 255, 0.30)',
      },
    };
  }

  if (safeDone === 1) {
    return {
      doneCount: safeDone,
      totalCount: safeTotal,
      percentage,
      levelName: 'Despertar Vibracional',
      summary: 'A intenção foi ancorada. Continue avançando para fortalecer o campo magnético.',
      textColor: '#FB923C',
      barGradient: 'from-orange-500 to-amber-400',
      badgeStyle: {
        color: '#FB923C',
        backgroundColor: 'rgba(249, 115, 22, 0.14)',
        borderColor: 'rgba(249, 115, 22, 0.35)',
      },
    };
  }

  if (safeDone === 2) {
    return {
      doneCount: safeDone,
      totalCount: safeTotal,
      percentage,
      levelName: 'Frequência em Formação',
      summary: 'Seu novo padrão começa a ganhar forma e reconhecimento no dia a dia.',
      textColor: '#FACC15',
      barGradient: 'from-amber-500 to-yellow-400',
      badgeStyle: {
        color: '#FACC15',
        backgroundColor: 'rgba(234, 179, 8, 0.14)',
        borderColor: 'rgba(234, 179, 8, 0.35)',
      },
    };
  }

  if (safeDone === 3) {
    return {
      doneCount: safeDone,
      totalCount: safeTotal,
      percentage,
      levelName: 'Ressonância em Expansão',
      summary: 'Metade do ciclo concluído: sua nova frequência já atua nas conexões e oportunidades.',
      textColor: '#f2ca50',
      barGradient: 'from-[#d4af37] to-[#f2ca50]',
      badgeStyle: {
        color: '#f2ca50',
        backgroundColor: 'rgba(212, 175, 55, 0.16)',
        borderColor: 'rgba(212, 175, 55, 0.38)',
      },
    };
  }

  if (safeDone < safeTotal) {
    return {
      doneCount: safeDone,
      totalCount: safeTotal,
      percentage,
      levelName: 'Forte Atração Magnética',
      summary: 'Alinhamento elevado! Faltam poucos marcos para consolidar a assinatura por completo.',
      textColor: '#A3E635',
      barGradient: 'from-lime-500 to-emerald-400',
      badgeStyle: {
        color: '#A3E635',
        backgroundColor: 'rgba(132, 204, 22, 0.14)',
        borderColor: 'rgba(132, 204, 22, 0.35)',
      },
    };
  }

  return {
    doneCount: safeDone,
    totalCount: safeTotal,
    percentage: 100,
    levelName: 'Plena Sintonia Magnética',
    summary: 'Todos os passos cumpridos: sua identidade magnética está 100% ativa no mundo físico e digital.',
    textColor: '#34D399',
    barGradient: 'from-emerald-500 to-emerald-400',
    badgeStyle: {
      color: '#34D399',
      backgroundColor: 'rgba(16, 185, 129, 0.14)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
    },
  };
}

export async function persistSlideChecklist(params: {
  userId: string;
  analysisId: string | null;
  slideKey: string;
  state: ChecklistState;
}): Promise<boolean> {
  const { userId, analysisId, slideKey, state } = params;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(checklistSlideStorageKey(userId, slideKey), JSON.stringify(state));
    } catch {
      /* ignore quota / privacy */
    }
  }

  if (!analysisId) return false;

  try {
    const res = await fetch('/api/analyses/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        analysisId,
        slideKey,
        checklist: state,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
