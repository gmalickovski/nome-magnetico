/**
 * Preset multi-brand (`data-brand="studio-mlk"`) para reuso futuro no Briefing Conversacional da Studio MLK.
 * Mantém a mesma arquitetura System One (`@typesafe-ai/sdk` · `choice`, `score`, `noul`, `box`)
 * e não aparece em nenhuma tela do Nome Magnético.
 */

import { box, choice, noul, score, type DiagramNodeSpec } from '../primitives';

export const STUDIO_MLK_BRAND = 'studio-mlk' as const;

export type PacoteStudioMlkId =
  | 'essencial_1990'
  | 'completo_3490'
  | 'estrategico_6900'
  | 'personalizado';

export interface StudioMlkPacoteSpec {
  id: PacoteStudioMlkId;
  nome: string;
  investimentoTexto: string;
  foco: string;
}

export const STUDIO_MLK_PACOTES: Record<PacoteStudioMlkId, StudioMlkPacoteSpec> = {
  essencial_1990: {
    id: 'essencial_1990',
    nome: 'Pacote Essencial',
    investimentoTexto: 'R$ 1.990',
    foco: 'Landing page de alta conversão com identidade enxuta e entrega rápida',
  },
  completo_3490: {
    id: 'completo_3490',
    nome: 'Pacote Completo',
    investimentoTexto: 'R$ 3.490',
    foco: 'Site institucional ou funil multi-página com automações e tracking completo',
  },
  estrategico_6900: {
    id: 'estrategico_6900',
    nome: 'Pacote Estratégico',
    investimentoTexto: 'R$ 6.900',
    foco: 'Produto digital, área logada ou ecossistema web sob medida com integrações de IA',
  },
  personalizado: {
    id: 'personalizado',
    nome: 'Projeto Personalizado',
    investimentoTexto: 'Sob consulta',
    foco: 'Arquitetura dedicada para demandas enterprise ou múltiplos produtos',
  },
};

export function buildStudioMlkJevQuestions() {
  return {
    escopo_pronto: noul(
      'O briefing enviado pelo cliente já descreve o objetivo do projeto e o tipo de entrega desejada?',
      {
        true: 'O cliente descreveu o produto ou serviço e o que espera construir.',
        false: 'O texto ainda está genérico e sem definição do tipo de projeto.',
      }
    ),
    maturidade_briefing: score(
      'Qual é o grau de definição técnica e comercial do briefing?',
      [
        'Ideia inicial sem escopo ou prazo definidos.',
        'Objetivo comercial claro com referências visuais ou de páginas.',
        'Escopo detalhado com integrações, prazos e metas de conversão.',
      ] as const
    ),
    pacote_recomendado: choice('Qual pacote melhor atende o cenário descrito pelo cliente?', {
      essencial_1990: 'Landing page única de conversão rápida (R$ 1.990)',
      completo_3490: 'Site completo ou funil estruturado com integrações (R$ 3.490)',
      estrategico_6900: 'Aplicação web, SaaS ou ecossistema completo com IA (R$ 6.900)',
      personalizado: 'Escopo customizado ou múltiplas frentes sob medida',
    }),
    regiao_destaque_referencia: box('A seção principal de destaque ou CTA na imagem de referência enviada'),
  };
}

export function buildStudioMlkDiagramNodes(pacote: PacoteStudioMlkId): DiagramNodeSpec[] {
  const spec = STUDIO_MLK_PACOTES[pacote];
  return [
    {
      id: 'origem',
      kind: 'origem',
      eyebrow: 'CENÁRIO ATUAL',
      label: 'Presença digital abaixo do potencial comercial',
    },
    {
      id: 'reflexo',
      kind: 'reflexo',
      eyebrow: 'GARGALO IDENTIFICADO',
      label: 'Visitantes saem sem entender o valor',
    },
    {
      id: 'ajuste',
      kind: 'ajuste',
      eyebrow: 'SOLUÇÃO RECOMENDADA',
      label: `${spec.nome} alinhado ao seu momento`,
    },
    {
      id: 'alvo',
      kind: 'alvo',
      eyebrow: 'RESULTADO ESPERADO',
      label: 'Jornada rápida convertendo clientes todos dias',
    },
  ];
}
