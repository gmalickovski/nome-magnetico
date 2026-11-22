import type { MockupTheme } from './types.js';

export interface ChatScriptExchange {
  id: string;
  jevPrompt: string;
  eyebrow?: string;
  chips: string[];
  selectedChipIndex: number;
  userReply: string;
}

export interface ChatResultSuggestionExample {
  nome: string;
  score: number;
  expressao: number;
  destino: number;
  badgeText: string;
  groupLabel?: string;
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
  sidebarContextTags: string[];
  srSummary: string;
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
        chips: ['Harmonizar o meu nome', 'Criar um nome artístico', 'Nome do meu bebê'],
        selectedChipIndex: 0,
        userReply: 'Harmonizar o meu nome',
      },
      {
        id: 'foco',
        eyebrow: 'PASSO 2 DE 3',
        jevPrompt: 'Qual área mais pede a sua atenção hoje?',
        chips: ['Carreira e prosperidade', 'Relacionamentos', 'Equilíbrio pessoal'],
        selectedChipIndex: 0,
        userReply: 'Carreira e prosperidade',
      },
      {
        id: 'preferencia',
        eyebrow: 'PASSO 3 DE 3',
        jevPrompt: 'Tem algo que quer manter na assinatura?',
        chips: ['Manter sobrenome', 'Pode ajustar acentos', 'Aberto a sugestões'],
        selectedChipIndex: 0,
        userReply: 'Manter sobrenome',
      },
    ],
    jevClosingIntro: 'Pronto. Cruzei seu mapa e separei opções sem bloqueios:',
    suggestions: [
      {
        nome: 'Marina Côsta',
        score: 93,
        expressao: 6,
        destino: 6,
        badgeText: '0 bloqueios',
      },
      {
        nome: 'Márina Costa',
        score: 89,
        expressao: 11,
        destino: 6,
        badgeText: '0 bloqueios',
      },
      {
        nome: 'Marina Costá',
        score: 85,
        expressao: 3,
        destino: 6,
        badgeText: '0 bloqueios',
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
        chips: ['Cantor ou cantora', 'Ator ou atriz', 'Criação de conteúdo'],
        selectedChipIndex: 0,
        userReply: 'Cantor ou cantora',
      },
      {
        id: 'imagem',
        eyebrow: 'PRESENÇA DE PALCO',
        jevPrompt: 'Qual imagem você quer passar com esse nome?',
        chips: ['Marcante', 'Sofisticada', 'Misteriosa'],
        selectedChipIndex: 0,
        userReply: 'Marcante',
      },
      {
        id: 'tipo',
        eyebrow: 'DIREÇÃO DO NOME',
        jevPrompt: 'Próximo do seu nome ou totalmente diferente?',
        chips: ['Próximo do meu', 'Totalmente diferente', 'As duas coisas'],
        selectedChipIndex: 2,
        userReply: 'As duas coisas',
      },
    ],
    jevClosingIntro: 'Separei nomes artísticos alinhados ao palco e ao seu Destino:',
    suggestions: [
      {
        nome: 'Véra Solis',
        score: 94,
        expressao: 3,
        destino: 5,
        badgeText: '0 bloqueios',
        groupLabel: 'Totalmente novo',
      },
      {
        nome: 'Lúna Ribeiro',
        score: 91,
        expressao: 5,
        destino: 5,
        badgeText: '0 bloqueios',
        groupLabel: 'Próximo do seu',
      },
      {
        nome: 'Kora Luz',
        score: 87,
        expressao: 1,
        destino: 5,
        badgeText: '0 bloqueios',
        groupLabel: 'Totalmente novo',
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
        chips: ['Ainda não nasceu', 'Já nasceu, sem registro', 'Já registrado'],
        selectedChipIndex: 0,
        userReply: 'Ainda não nasceu',
      },
      {
        id: 'sexo',
        eyebrow: 'PERFIL DO NOME',
        jevPrompt: 'Já sabem o sexo do bebê?',
        chips: ['Menina', 'Menino', 'Ainda não sei'],
        selectedChipIndex: 0,
        userReply: 'Menina',
      },
      {
        id: 'estilo',
        eyebrow: 'ESTILO PREFERIDO',
        jevPrompt: 'Que estilo de nome vocês preferem?',
        chips: ['Clássico', 'Moderno', 'Curto'],
        selectedChipIndex: 0,
        userReply: 'Clássico',
      },
    ],
    jevClosingIntro: 'Cruzei o sobrenome da família com a janela do parto:',
    suggestions: [
      {
        nome: 'Helena Duarte',
        score: 95,
        expressao: 6,
        destino: 6,
        badgeText: '0 bloqueios',
      },
      {
        nome: 'Clara Duarte',
        score: 90,
        expressao: 9,
        destino: 6,
        badgeText: '0 bloqueios',
      },
      {
        nome: 'Laura Duarte',
        score: 86,
        expressao: 1,
        destino: 6,
        badgeText: '0 bloqueios',
      },
    ],
    sidebarContextTags: ['Menina', 'Clássico', 'Janela do parto'],
    srSummary:
      'Simulação do chat para escolher o nome do bebê: confirmação de gravidez, sexo menina, estilo clássico e apresentação de três nomes sem bloqueios com notas entre 86 e 95.',
  },
};
