/**
 * Arquétipos Junguianos/Narrativos — camada narrativa sobre os números cabalísticos.
 * Derivados do número de Expressão já calculado — sem alteração no sistema numerológico.
 */

import {
  ARCHETYPE_SUMMARIES,
  getArchetypeSummaryByExpressao,
} from '../../shared/archetype-summary';

export interface Arquetipo {
  numero: number;
  nome: string;
  sombra: string;
  essencia: string;
  descricao: string;
  expressaoPositiva: string[];
  expressaoSombra: string[];
  figurasMiticas: string[];
  /** Marca o(a)s famosas que carregam esse arquétipo — uso no produto Nome Empresa */
  marcasReferencia: string[];
  /** Como esse arquétipo se posiciona no mercado — uso no produto Nome Empresa */
  posicionamento: string;
}

const ARCHETYPE_COMPANY_EXTRAS: Record<number, { marcasReferencia: string[]; posicionamento: string }> = {
  1: {
    marcasReferencia: ['Nike', 'Red Bull', 'Duracell'],
    posicionamento:
      'Posiciona-se como referência de excelência e superação. Atrai clientes que querem vencer desafios e se destacar.',
  },
  2: {
    marcasReferencia: ['Johnson & Johnson', 'UNICEF', 'Natura'],
    posicionamento:
      'Posiciona-se como marca de confiança, cuidado e relações humanas. Atrai clientes que valorizam pertencimento e segurança.',
  },
  3: {
    marcasReferencia: ['Apple', 'LEGO', 'Adobe'],
    posicionamento:
      'Posiciona-se como referência em inovação, design e cultura. Atrai clientes criativos, visionários e que valorizam estética.',
  },
  4: {
    marcasReferencia: ['IKEA', 'Caterpillar', 'Bosch'],
    posicionamento:
      'Posiciona-se como marca de confiança, durabilidade e qualidade comprovada. Atrai clientes que valorizam segurança e longo prazo.',
  },
  5: {
    marcasReferencia: ['Airbnb', 'GoPro', 'The North Face'],
    posicionamento:
      'Posiciona-se como marca de liberdade, aventura e inovação disruptiva. Atrai clientes que querem transformar sua rotina e sair do convencional.',
  },
  6: {
    marcasReferencia: ['Chanel', 'Häagen-Dazs', 'Hallmark'],
    posicionamento:
      'Posiciona-se como marca de luxo sensorial, experiência e emoção. Atrai clientes que buscam qualidade, beleza e conexão.',
  },
  7: {
    marcasReferencia: ['Google', 'McKinsey', 'The Economist'],
    posicionamento:
      'Posiciona-se como autoridade em conhecimento, inteligência e expertise. Atrai clientes que valorizam profundidade, dados e resultados comprovados.',
  },
  8: {
    marcasReferencia: ['Rolex', 'Mercedes-Benz', 'Goldman Sachs'],
    posicionamento:
      'Posiciona-se como marca premium de poder e excelência. Atrai clientes bem-sucedidos que buscam o melhor e associam a marca ao seu próprio status.',
  },
  9: {
    marcasReferencia: ['Patagonia', 'TOMS', 'Médicos Sem Fronteiras'],
    posicionamento:
      'Posiciona-se como marca de propósito e impacto social. Atrai clientes conscientes que querem que suas escolhas reflitam seus valores.',
  },
  11: {
    marcasReferencia: ['TED Talks', 'Greenpeace', 'Oprah Winfrey Network'],
    posicionamento:
      'Posiciona-se como marca de inspiração e transformação. Atrai seguidores que buscam significado, propósito e pertencimento a algo maior.',
  },
  22: {
    marcasReferencia: ['SpaceX', 'LVMH', 'Berkshire Hathaway'],
    posicionamento:
      'Posiciona-se como marca de legado e excelência máxima. Atrai clientes visionários que pensam em décadas, não em trimestres.',
  },
};

export const ARQUETIPOS: Record<number, Arquetipo> = Object.fromEntries(
  Object.entries(ARCHETYPE_SUMMARIES).map(([key, base]) => {
    const num = Number(key);
    const extra = ARCHETYPE_COMPANY_EXTRAS[num]!;
    return [
      num,
      {
        ...base,
        sombra: base.sombra ?? '',
        figurasMiticas: base.figurasMiticas ?? [],
        marcasReferencia: extra.marcasReferencia,
        posicionamento: extra.posicionamento,
      },
    ];
  }),
);

/**
 * Retorna o arquétipo correspondente ao número fornecido.
 * Reduz números > 9 que não sejam 11 ou 22.
 */
export function getArquetipo(numero: number): Arquetipo {
  const base = getArchetypeSummaryByExpressao(numero);
  return ARQUETIPOS[base.numero] ?? ARQUETIPOS[1]!;
}
