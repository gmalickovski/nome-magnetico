import type { HarmonySuggestionCardData } from '../ProductResultFrame.js';
import type { BabyGoodDayItem } from '../../shared/chat-ui/ChatSuggestionCard.js';
import type { MockupTheme } from './types.js';
import type { TimelineStep } from './mockup-timeline-core.js';

export type StarSceneAction = 'birth_only' | 'morph_numbers' | 'dual_star';

export const STAR_SCENE_STEPS: ReadonlyArray<TimelineStep<StarSceneAction>> = [
  { at: 0, action: 'birth_only' },
  { at: 2200, action: 'morph_numbers' },
  { at: 4200, action: 'dual_star' },
];

export type TriangleSceneAction =
  | 'letters'
  | 'rows_top'
  | 'rows_mid'
  | 'rows_all'
  | 'blocks_lit'
  | 'apex_lit'
  | 'harmonized_rows'
  | 'harmonized_clean';

export const TRIANGLE_SCENE_STEPS: ReadonlyArray<TimelineStep<TriangleSceneAction>> = [
  { at: 0, action: 'letters' },
  { at: 650, action: 'rows_top' },
  { at: 1300, action: 'rows_mid' },
  { at: 1950, action: 'rows_all' },
  { at: 2600, action: 'blocks_lit' },
  { at: 3350, action: 'apex_lit' },
  { at: 4400, action: 'harmonized_rows' },
  { at: 5350, action: 'harmonized_clean' },
];

export type ScoreCounterAction = 'birth' | 'step_1' | 'step_2' | 'step_3' | 'final';

export const SCORE_COUNTER_STEPS: ReadonlyArray<TimelineStep<ScoreCounterAction>> = [
  { at: 0, action: 'birth' },
  { at: 1400, action: 'step_1' },
  { at: 2800, action: 'step_2' },
  { at: 4200, action: 'step_3' },
  { at: 5600, action: 'final' },
];

export type SuggestionCardsAction =
  | 'intro'
  | 'card_1'
  | 'card_2'
  | 'card_3'
  | 'days_or_focus'
  | 'complete';

export const SUGGESTION_CARDS_STEPS: ReadonlyArray<TimelineStep<SuggestionCardsAction>> = [
  { at: 0, action: 'intro' },
  { at: 600, action: 'card_1' },
  { at: 1350, action: 'card_2' },
  { at: 2100, action: 'card_3' },
  { at: 2900, action: 'days_or_focus' },
  { at: 3700, action: 'complete' },
];

export type PdfFlipAction = 'page_1' | 'page_2' | 'page_3' | 'page_4';

export const PDF_FLIP_STEPS: ReadonlyArray<TimelineStep<PdfFlipAction>> = [
  { at: 0, action: 'page_1' },
  { at: 1450, action: 'page_2' },
  { at: 2900, action: 'page_3' },
  { at: 4350, action: 'page_4' },
];

export type DashboardSceneAction =
  | 'birth_selected'
  | 'select_tap'
  | 'harmonized_selected'
  | 'pdf_tap';

export const DASHBOARD_SCENE_STEPS: ReadonlyArray<TimelineStep<DashboardSceneAction>> = [
  { at: 0, action: 'birth_selected' },
  { at: 1400, action: 'select_tap' },
  { at: 2150, action: 'harmonized_selected' },
  { at: 3450, action: 'pdf_tap' },
];

export interface TriangleExampleData {
  nome: string;
  nota: number;
  bloqueiosCodigos: string[];
  regente: number;
  regenteNome: string;
  /** Valores cabalísticos na ordem [Destino, Expressão, Motivação, Missão, Impressão]. */
  starNums: [number, number, number, number, number];
  linhas: ReadonlyArray<ReadonlyArray<number>>;
}

export interface ResultSuggestionExample {
  id: string;
  card: HarmonySuggestionCardData;
  principal?: boolean;
  maiorNota?: boolean;
  secao?: 'proximo' | 'novo';
  destaque?: string;
}

export interface PdfMockupPageMeta {
  pageNumber: number;
  label: string;
  sourceDoc: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface DashboardExampleItem {
  id: string;
  nome: string;
  dateLabel: string;
  origemLabel: string;
  origemTone: 'nascimento' | 'sistema';
  score: number;
  vidaBloqueiosCodigos: string[];
  isFavorite: boolean;
  starNums: [number, number, number, number, number];
  contextChips: string[];
}

export interface ResultThemeScript {
  theme: MockupTheme;
  birth: TriangleExampleData;
  harmonized: TriangleExampleData;
  scoreSteps: [number, number, number, number, number];
  /** Nome de nascimento (2 sobrenomes) e as 4 variações, da menor para a maior nota (60, 70, 80, 90). */
  scoreStepNames: [string, string, string, string, string];
  affinityHighlight?: {
    titulo: string;
    detalhe: string;
    afinidades: string[];
  };
  suggestionsIntro: string;
  suggestions: ResultSuggestionExample[];
  babyGoodDays?: BabyGoodDayItem[];
  pdfReportName: string;
  pdfPages: [PdfMockupPageMeta, PdfMockupPageMeta, PdfMockupPageMeta, PdfMockupPageMeta];
  dashboardItems: [DashboardExampleItem, DashboardExampleItem, DashboardExampleItem];
}

/**
 * Dados fictícios e matematicamente autênticos por tema para as 6 cenas de resultado (DEV-337).
 * Todas as matrizes de triângulo foram validadas em `triangle.ts` (linhas e bloqueios exatos).
 */
export const RESULT_SCRIPTS: Record<MockupTheme, ResultThemeScript> = {
  social: {
    theme: 'social',
    birth: {
      nome: 'MARINA PEREIRA',
      nota: 58,
      bloqueiosCodigos: ['222'],
      regente: 5,
      regenteNome: 'O Hierofante',
      starNums: [6, 4, 2, 7, 2],
      linhas: [
        [4, 1, 2, 1, 5, 1, 8, 5, 2, 5, 1, 2, 1],
        [5, 3, 3, 6, 6, 9, 4, 7, 7, 6, 3, 3],
        [8, 6, 9, 3, 6, 4, 2, 5, 4, 9, 6],
        [5, 6, 3, 9, 1, 6, 7, 9, 4, 6],
        [2, 9, 3, 1, 7, 4, 7, 4, 1],
        [2, 3, 4, 8, 2, 2, 2, 5],
        [5, 7, 3, 1, 4, 4, 7],
        [3, 1, 4, 5, 8, 2],
        [4, 5, 9, 4, 1],
        [9, 5, 4, 5],
        [5, 9, 9],
        [5, 9],
        [5],
      ],
    },
    harmonized: {
      nome: 'MARINA CÔSTA',
      nota: 93,
      bloqueiosCodigos: [],
      regente: 7,
      regenteNome: 'O Carro',
      starNums: [6, 6, 2, 3, 4],
      linhas: [
        [4, 1, 2, 1, 5, 1, 3, 5, 3, 4, 1],
        [5, 3, 3, 6, 6, 4, 8, 8, 7, 5],
        [8, 6, 9, 3, 1, 3, 7, 6, 3],
        [5, 6, 3, 4, 4, 1, 4, 9],
        [2, 9, 7, 8, 5, 5, 4],
        [2, 7, 6, 4, 1, 9],
        [9, 4, 1, 5, 1],
        [4, 5, 6, 6],
        [9, 2, 3],
        [2, 5],
        [7],
      ],
    },
    scoreSteps: [58, 64, 74, 83, 93],
    scoreStepNames: ['Marina Pereira Costa', 'Marina P. Costa', 'Marina Costa', 'Marina Pereira Côsta', 'Marina Côsta'],
    suggestionsIntro: 'Três assinaturas sem bloqueios e compatíveis com seu Destino 6:',
    suggestions: [
      {
        id: 'res-social-1',
        maiorNota: true,
        card: {
          nome: 'Marina Côsta',
          score: 93,
          compatibilidade: 'favoravel',
          expressao: 6,
          destino: 6,
          motivacao: 2,
          impressao: 4,
          missao: 3,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-social-2',
        principal: true,
        card: {
          nome: 'Márina Costa',
          score: 89,
          compatibilidade: 'favoravel',
          expressao: 11,
          destino: 6,
          motivacao: 5,
          impressao: 6,
          missao: 8,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-social-3',
        card: {
          nome: 'Marina Costá',
          score: 85,
          compatibilidade: 'favoravel',
          expressao: 3,
          destino: 6,
          motivacao: 9,
          impressao: 3,
          missao: 9,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
    ],
    pdfReportName: 'Marina Côsta · Relatório Nome Social',
    pdfPages: [
      {
        pageNumber: 1,
        label: 'Capa',
        sourceDoc: 'Main.dc.html',
        eyebrow: 'Harmonização do Nome Social',
        title: 'Marina Côsta',
        subtitle: 'Capa escura Celestial Alchemist com estrela comparativa.',
      },
      {
        pageNumber: 2,
        label: 'Resumo',
        sourceDoc: 'Resumo.dc.html',
        eyebrow: 'Seu relatório em 1 página',
        title: 'Nota 58 → 93 · Bloqueios 2 → 0',
        subtitle: 'Antes e depois dos 5 números e compatibilidade.',
      },
      {
        pageNumber: 3,
        label: 'Parte 1 · Essência',
        sourceDoc: 'Essencia.dc.html',
        eyebrow: 'Parte 1 · Você hoje',
        title: 'Estrela + 5 Números de Nascimento',
        subtitle: 'Base cabalística completa comparada com o nome novo.',
      },
      {
        pageNumber: 4,
        label: 'Triângulo da Vida',
        sourceDoc: 'Triangulo.dc.html',
        eyebrow: 'A Essência · Triângulo',
        title: 'Sequências em vermelho e Arcano 7',
        subtitle: 'Pirâmide letra a letra com ponta regente em roxo.',
      },
    ],
    dashboardItems: [
      {
        id: 'dash-social-birth',
        nome: 'Marina Pereira',
        dateLabel: 'Analisado em 18 nov',
        origemLabel: 'Nome de Nascimento',
        origemTone: 'nascimento',
        score: 58,
        vidaBloqueiosCodigos: ['222'],
        isFavorite: false,
        starNums: [6, 4, 2, 7, 2],
        contextChips: ['Nome Civil', 'Triângulo 222'],
      },
      {
        id: 'dash-social-1',
        nome: 'Marina Côsta',
        dateLabel: 'Salvo em 18 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 93,
        vidaBloqueiosCodigos: [],
        isFavorite: true,
        starNums: [6, 6, 2, 3, 4],
        contextChips: ['Carreira', 'Manter sobrenome', '0 bloqueios'],
      },
      {
        id: 'dash-social-2',
        nome: 'Márina Costa',
        dateLabel: 'Salvo em 18 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 89,
        vidaBloqueiosCodigos: [],
        isFavorite: false,
        starNums: [6, 11, 5, 8, 6],
        contextChips: ['Carreira', 'Expressão 11'],
      },
    ],
  },
  artistico: {
    theme: 'artistico',
    birth: {
      nome: 'LARISSA MACEDO',
      nota: 54,
      bloqueiosCodigos: ['111'],
      regente: 5,
      regenteNome: 'O Hierofante',
      starNums: [5, 4, 2, 9, 2],
      linhas: [
        [3, 1, 2, 1, 3, 3, 1, 4, 1, 3, 5, 4, 7],
        [4, 3, 3, 4, 6, 4, 5, 5, 4, 8, 9, 2],
        [7, 6, 7, 1, 1, 9, 1, 9, 3, 8, 2],
        [4, 4, 8, 2, 1, 1, 1, 3, 2, 1],
        [8, 3, 1, 3, 2, 2, 4, 5, 3],
        [2, 4, 4, 5, 4, 6, 9, 8],
        [6, 8, 9, 9, 1, 6, 8],
        [5, 8, 9, 1, 7, 5],
        [4, 8, 1, 8, 3],
        [3, 9, 9, 2],
        [3, 9, 2],
        [3, 2],
        [5],
      ],
    },
    harmonized: {
      nome: 'LUNA VALE',
      nota: 94,
      bloqueiosCodigos: [],
      regente: 1,
      regenteNome: 'O Mago',
      starNums: [5, 3, 7, 8, 5],
      linhas: [
        [3, 6, 5, 1, 6, 1, 3, 5],
        [9, 2, 6, 7, 7, 4, 8],
        [2, 8, 4, 5, 2, 3],
        [1, 3, 9, 7, 5],
        [4, 3, 7, 3],
        [7, 1, 1],
        [8, 2],
        [1],
      ],
    },
    scoreSteps: [54, 63, 72, 84, 94],
    scoreStepNames: ['Luciana Ribeiro Alves', 'Luciana R. Alves', 'Lu Ribeiro', 'Luna Ribeiro', 'Luna Vale'],
    affinityHighlight: {
      titulo: 'Afinidade número × área · Alta',
      detalhe: 'Expressão 3 (comunicação e presença) alinhada a quem canta e se apresenta.',
      afinidades: ['Top 3', 'Altas 5 · 6 · 11', '0 bloqueios'],
    },
    suggestionsIntro: 'Opções próximas do seu nome civil e nomes totalmente novos para palco:',
    suggestions: [
      {
        id: 'res-art-1',
        principal: true,
        secao: 'proximo',
        card: {
          nome: 'Lúna Ribeiro',
          score: 91,
          compatibilidade: 'favoravel',
          expressao: 5,
          destino: 5,
          motivacao: 1,
          impressao: 4,
          missao: 1,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-art-2',
        maiorNota: true,
        secao: 'novo',
        destaque: 'Alta afinidade · Expressão 3 · Comunicação e palco',
        card: {
          nome: 'Luna Vale',
          score: 94,
          compatibilidade: 'favoravel',
          expressao: 3,
          destino: 5,
          motivacao: 7,
          impressao: 5,
          missao: 8,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-art-3',
        secao: 'novo',
        card: {
          nome: 'Véra Solis',
          score: 88,
          compatibilidade: 'favoravel',
          expressao: 6,
          destino: 5,
          motivacao: 4,
          impressao: 2,
          missao: 2,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
    ],
    pdfReportName: 'Luna Vale · Relatório Nome Artístico',
    pdfPages: [
      {
        pageNumber: 1,
        label: 'Capa palco',
        sourceDoc: 'ArtCapa.dc.html',
        eyebrow: 'Apresentando',
        title: 'LUNA VALE',
        subtitle: 'Capa de palco escura com holofote dourado e roxo.',
      },
      {
        pageNumber: 2,
        label: 'Resumo artístico',
        sourceDoc: 'ArtResumo.dc.html',
        eyebrow: 'Seu nome artístico em 1 página',
        title: 'Nota 94 · Afinidade Alta com Palco',
        subtitle: 'Comparativo entre opções próximas e totalmente novas.',
      },
      {
        pageNumber: 3,
        label: 'Parte 1 · Área',
        sourceDoc: 'ArtArea.dc.html',
        eyebrow: 'Você e sua área',
        title: 'Cantora · Marcante · Expressão 3',
        subtitle: 'Por que o número escolhido conversa com a sua carreira.',
      },
      {
        pageNumber: 4,
        label: 'Parte 3 · No palco',
        sourceDoc: 'ArtPalco.dc.html',
        eyebrow: 'Uso prático e assinatura',
        title: 'Assinatura de capas, créditos e redes',
        subtitle: 'Aviso informativo de contratos mantendo o nome civil.',
      },
    ],
    dashboardItems: [
      {
        id: 'dash-art-birth',
        nome: 'Larissa Macedo',
        dateLabel: 'Analisado em 19 nov',
        origemLabel: 'Nome de Nascimento',
        origemTone: 'nascimento',
        score: 54,
        vidaBloqueiosCodigos: ['111'],
        isFavorite: false,
        starNums: [5, 4, 2, 9, 2],
        contextChips: ['Nome Civil', 'Triângulo 111'],
      },
      {
        id: 'dash-art-1',
        nome: 'Luna Vale',
        dateLabel: 'Salvo em 19 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 94,
        vidaBloqueiosCodigos: [],
        isFavorite: true,
        starNums: [5, 3, 7, 8, 5],
        contextChips: ['Cantora', 'Totalmente novo', 'Expressão 3'],
      },
      {
        id: 'dash-art-2',
        nome: 'Lúna Ribeiro',
        dateLabel: 'Salvo em 19 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 91,
        vidaBloqueiosCodigos: [],
        isFavorite: false,
        starNums: [5, 5, 1, 1, 4],
        contextChips: ['Próximo do civil', '0 bloqueios'],
      },
    ],
  },
  bebe: {
    theme: 'bebe',
    birth: {
      nome: 'ALICE LIMA',
      nota: 61,
      bloqueiosCodigos: ['444'],
      regente: 8,
      regenteNome: 'A Justiça',
      starNums: [6, 4, 7, 1, 6],
      linhas: [
        [1, 3, 1, 3, 5, 3, 1, 4, 1],
        [4, 4, 4, 8, 8, 4, 5, 5],
        [8, 8, 3, 7, 3, 9, 1],
        [7, 2, 1, 1, 3, 1],
        [9, 3, 2, 4, 4],
        [3, 5, 6, 8],
        [8, 2, 5],
        [1, 7],
        [8],
      ],
    },
    harmonized: {
      nome: 'SOFIA LIMA',
      nota: 95,
      bloqueiosCodigos: [],
      regente: 8,
      regenteNome: 'A Justiça',
      starNums: [6, 6, 3, 3, 3],
      linhas: [
        [3, 7, 8, 1, 1, 3, 1, 4, 1],
        [1, 6, 9, 2, 4, 4, 5, 5],
        [7, 6, 2, 6, 8, 9, 1],
        [4, 8, 8, 5, 8, 1],
        [3, 7, 4, 4, 9],
        [1, 2, 8, 4],
        [3, 1, 3],
        [4, 4],
        [8],
      ],
    },
    scoreSteps: [57, 66, 75, 86, 95],
    scoreStepNames: ['Laura Silva Costa', 'Laura Costa', 'Clara Silva Costa', 'Laura Lima', 'Sofia Lima'],
    suggestionsIntro: 'Nomes avaliados para o sobrenome da família na janela prevista do parto:',
    suggestions: [
      {
        id: 'res-bebe-1',
        maiorNota: true,
        destaque: 'Bom em 26 de 29 dias da janela prevista',
        card: {
          nome: 'Sofia Lima',
          score: 95,
          compatibilidade: 'favoravel',
          expressao: 6,
          destino: 6,
          motivacao: 3,
          impressao: 3,
          missao: 3,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-bebe-2',
        principal: true,
        destaque: 'Bom em 24 de 29 dias da janela prevista',
        card: {
          nome: 'Laura Lima',
          score: 91,
          compatibilidade: 'favoravel',
          expressao: 5,
          destino: 6,
          motivacao: 1,
          impressao: 4,
          missao: 2,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
      {
        id: 'res-bebe-3',
        destaque: 'Bom em 22 de 29 dias da janela prevista',
        card: {
          nome: 'Clara Lima',
          score: 88,
          compatibilidade: 'favoravel',
          expressao: 3,
          destino: 6,
          motivacao: 2,
          impressao: 1,
          missao: 9,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
    ],
    babyGoodDays: [
      { dia: '12/05', nota: 86, bom: true },
      { dia: '13/05', nota: 72, bom: false },
      { dia: '14/05', nota: 95, bom: true },
      { dia: '15/05', nota: 92, bom: true },
      { dia: '16/05', nota: 89, bom: true },
    ],
    pdfReportName: 'Sofia Lima · Manual para os Pais',
    pdfPages: [
      {
        pageNumber: 1,
        label: 'Capa bebê',
        sourceDoc: 'BebeCapa.dc.html',
        eyebrow: 'Manual para os pais',
        title: 'Sofia Lima',
        subtitle: 'Capa acolhedora em tons pastel com a janela do parto.',
      },
      {
        pageNumber: 2,
        label: 'Carta aos pais',
        sourceDoc: 'BebeCarta.dc.html',
        eyebrow: 'Boas-vindas e guia',
        title: 'Para receber você com carinho',
        subtitle: 'Tendências e qualidades do nome, sem prazos engessados.',
      },
      {
        pageNumber: 3,
        label: 'Parte 1 · Estrela',
        sourceDoc: 'BebeQuemChega.dc.html',
        eyebrow: 'Parte 1 · Quem está chegando',
        title: 'Destino 6 · Estrela dos 5 números',
        subtitle: 'Resumo dos 26 dias harmônicos na janela prevista.',
      },
      {
        pageNumber: 4,
        label: 'Parte 2 · Nomes e Dias',
        sourceDoc: 'BebeNomes.dc.html',
        eyebrow: 'Comparativo e calendário',
        title: 'Nomes pensados × sugestões sem bloqueio',
        subtitle: 'Grade dos 29 dias ao redor da data prevista.',
      },
    ],
    dashboardItems: [
      {
        id: 'dash-bebe-birth',
        nome: 'Alice Lima',
        dateLabel: 'Simulado em 20 nov',
        origemLabel: 'Nome de Nascimento',
        origemTone: 'nascimento',
        score: 61,
        vidaBloqueiosCodigos: ['444'],
        isFavorite: false,
        starNums: [6, 4, 7, 1, 6],
        contextChips: ['Janela prevista', 'Triângulo 444'],
      },
      {
        id: 'dash-bebe-1',
        nome: 'Sofia Lima',
        dateLabel: 'Salvo em 20 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 95,
        vidaBloqueiosCodigos: [],
        isFavorite: true,
        starNums: [6, 6, 3, 3, 3],
        contextChips: ['26/29 dias bons', '0 bloqueios'],
      },
      {
        id: 'dash-bebe-2',
        nome: 'Laura Lima',
        dateLabel: 'Salvo em 20 nov',
        origemLabel: 'Sugestões do Sistema',
        origemTone: 'sistema',
        score: 91,
        vidaBloqueiosCodigos: [],
        isFavorite: false,
        starNums: [6, 5, 1, 2, 4],
        contextChips: ['24/29 dias bons', 'Clássico'],
      },
    ],
  },
};
