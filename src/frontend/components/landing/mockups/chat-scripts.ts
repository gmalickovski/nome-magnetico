import type { HarmonySuggestionCardData } from '../ProductResultFrame.js';
import type { BabyGoodDayItem } from '../../shared/chat-ui/ChatSuggestionCard.js';
import type { ChatOptionPillItem } from '../../shared/chat-ui/ChatOptionPills.js';
import type { MockupTheme } from './types.js';

export interface ChatScriptExchange {
  id: string;
  jevPrompt: string;
  eyebrow?: string;
  chips: ChatOptionPillItem[];
  selectedChipIndex: number;
  userReply: string;
}

export interface ChatResultSuggestionExample {
  id: string;
  card: HarmonySuggestionCardData;
  principal?: boolean;
  maiorNota?: boolean;
  secao?: 'proximo' | 'novo';
  destaque?: string;
}

export interface ChatScript {
  id: string;
  theme: MockupTheme;
  pathLabel: string;
  birthExample: {
    nome: string;
    notaHoje: number;
    bloqueiosLabel: string;
  };
  exchanges: [ChatScriptExchange, ChatScriptExchange, ChatScriptExchange];
  jevClosingIntro: string;
  suggestions: ChatResultSuggestionExample[];
  babyGoodDays?: BabyGoodDayItem[];
  sidebarContextTags: string[];
  srSummary: string;
}

function toPills(idPrefix: string, labels: string[]): ChatOptionPillItem[] {
  return labels.map((label, idx) => ({ id: `${idPrefix}-${idx}`, label }));
}

/**
 * Roteiros de exemplo (dados fictícios, nunca de clientes reais).
 * Todos os nomes sugeridos cumprem a regra do produto: 0 bloqueios e nota >= 80.
 */
export const CHAT_SCRIPTS: Record<MockupTheme, ChatScript> = {
  social: {
    id: 'chat-social',
    theme: 'social',
    pathLabel: 'Harmonizar o meu nome',
    birthExample: {
      nome: 'Marina Pereira Costa',
      notaHoje: 58,
      bloqueiosLabel: '2 bloqueios no mapa atual',
    },
    exchanges: [
      {
        id: 'motivo',
        eyebrow: 'PASSO 1 DE 3',
        jevPrompt: 'O que você quer fazer hoje?',
        chips: toPills('social-q1', [
          'Harmonizar o meu nome',
          'Criar um nome artístico',
          'Nome do meu bebê',
        ]),
        selectedChipIndex: 0,
        userReply: 'Harmonizar o meu nome',
      },
      {
        id: 'foco',
        eyebrow: 'PASSO 2 DE 3',
        jevPrompt: 'Qual área mais pede a sua atenção hoje?',
        chips: toPills('social-q2', [
          'Carreira e prosperidade',
          'Relacionamentos',
          'Equilíbrio pessoal',
        ]),
        selectedChipIndex: 0,
        userReply: 'Carreira e prosperidade',
      },
      {
        id: 'preferencia',
        eyebrow: 'PASSO 3 DE 3',
        jevPrompt: 'Tem algo que quer manter na assinatura?',
        chips: toPills('social-q3', [
          'Manter sobrenome',
          'Pode ajustar acentos',
          'Aberto a sugestões',
        ]),
        selectedChipIndex: 0,
        userReply: 'Manter sobrenome',
      },
    ],
    jevClosingIntro: 'Pronto. Cruzei seu mapa e separei opções sem bloqueios:',
    suggestions: [
      {
        id: 'social-1',
        principal: true,
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
        id: 'social-2',
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
        id: 'social-3',
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
    sidebarContextTags: ['Carreira', 'Manter sobrenome', '4 Triângulos'],
    srSummary:
      'Simulação do chat para harmonizar o nome social: escolha do caminho, foco em carreira e apresentação de três assinaturas sem bloqueios com notas entre 85 e 93.',
  },
  artistico: {
    id: 'chat-artistico',
    theme: 'artistico',
    pathLabel: 'Criar um nome artístico',
    birthExample: {
      nome: 'Luciana Ribeiro Alves',
      notaHoje: 54,
      bloqueiosLabel: '1 bloqueio no mapa civil',
    },
    exchanges: [
      {
        id: 'area',
        eyebrow: 'CAMINHO ARTÍSTICO',
        jevPrompt: 'Em qual área artística você vai usar o nome?',
        chips: toPills('art-q1', ['Cantor ou cantora', 'Ator ou atriz', 'Criação de conteúdo']),
        selectedChipIndex: 0,
        userReply: 'Cantor ou cantora',
      },
      {
        id: 'imagem',
        eyebrow: 'PRESENÇA DE PALCO',
        jevPrompt: 'Qual imagem você quer passar com esse nome?',
        chips: toPills('art-q2', ['Marcante', 'Sofisticada', 'Misteriosa']),
        selectedChipIndex: 0,
        userReply: 'Marcante',
      },
      {
        id: 'tipo',
        eyebrow: 'DIREÇÃO DO NOME',
        jevPrompt: 'Próximo do seu nome ou totalmente diferente?',
        chips: toPills('art-q3', ['Próximo do meu', 'Totalmente diferente', 'As duas coisas']),
        selectedChipIndex: 2,
        userReply: 'As duas coisas',
      },
    ],
    jevClosingIntro: 'Separei nomes artísticos alinhados ao palco e ao seu Destino:',
    suggestions: [
      {
        id: 'art-1',
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
        id: 'art-2',
        secao: 'novo',
        principal: true,
        maiorNota: true,
        card: {
          nome: 'Véra Solis',
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
        id: 'art-3',
        secao: 'novo',
        card: {
          nome: 'Kora Luz',
          score: 87,
          compatibilidade: 'favoravel',
          expressao: 1,
          destino: 5,
          motivacao: 9,
          impressao: 1,
          missao: 6,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
    ],
    sidebarContextTags: ['Cantora', 'Marcante', 'Afinidade Palco'],
    srSummary:
      'Simulação do chat para criar nome artístico: escolha de área musical, imagem marcante e exibição de nomes próximos e totalmente novos sem bloqueios com notas de 87 a 94.',
  },
  bebe: {
    id: 'chat-bebe',
    theme: 'bebe',
    pathLabel: 'Escolher o nome do meu bebê',
    birthExample: {
      nome: 'Família Duarte · Janela prevista',
      notaHoje: 64,
      bloqueiosLabel: 'Simulação da janela de nascimento',
    },
    exchanges: [
      {
        id: 'situacao',
        eyebrow: 'CAMINHO DO BEBÊ',
        jevPrompt: 'Seu bebê já nasceu?',
        chips: toPills('bebe-q1', [
          'Ainda não nasceu',
          'Já nasceu, sem registro',
          'Já registrado',
        ]),
        selectedChipIndex: 0,
        userReply: 'Ainda não nasceu',
      },
      {
        id: 'sexo',
        eyebrow: 'PERFIL DO NOME',
        jevPrompt: 'Já sabem o sexo do bebê?',
        chips: toPills('bebe-q2', ['Menina', 'Menino', 'Ainda não sei']),
        selectedChipIndex: 0,
        userReply: 'Menina',
      },
      {
        id: 'estilo',
        eyebrow: 'ESTILO PREFERIDO',
        jevPrompt: 'Que estilo de nome vocês preferem?',
        chips: toPills('bebe-q3', ['Clássico', 'Moderno', 'Curto']),
        selectedChipIndex: 0,
        userReply: 'Clássico',
      },
    ],
    jevClosingIntro: 'Cruzei o sobrenome da família com a janela do parto:',
    suggestions: [
      {
        id: 'bebe-1',
        principal: true,
        maiorNota: true,
        card: {
          nome: 'Helena Duarte',
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
        id: 'bebe-2',
        card: {
          nome: 'Clara Duarte',
          score: 90,
          compatibilidade: 'favoravel',
          expressao: 9,
          destino: 6,
          motivacao: 1,
          impressao: 8,
          missao: 6,
          bloqueios: 0,
          vidaBloqueiosCodigos: [],
        },
      },
    ],
    babyGoodDays: [
      { dia: '12/05', nota: 84, bom: true },
      { dia: '13/05', nota: 71, bom: false },
      { dia: '14/05', nota: 95, bom: true },
      { dia: '15/05', nota: 91, bom: true },
      { dia: '16/05', nota: 78, bom: false },
    ],
    sidebarContextTags: ['Menina', 'Clássico', 'Janela do parto'],
    srSummary:
      'Simulação do chat para escolher o nome do bebê: confirmação de gravidez, sexo menina, estilo clássico e apresentação de nomes sem bloqueios com dias favoráveis da janela do parto.',
  },
};
