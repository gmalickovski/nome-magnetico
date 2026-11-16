/**
 * PDFTheme — paletas e configurações de identidade visual por produto.
 * Cada produto tem cores primárias, acento, fundo de capa e número destaque.
 */

export type ProductType = 'nome_social' | 'nome_bebe' | 'nome_empresa';
export type FeaturedNumberKey = 'expressao' | 'destino';
export type CoverShapeStyle = 'social' | 'bebe' | 'empresa' | 'atual';

export interface ProductTheme {
  /** Cor primária do produto (headings, bordas de destaque) */
  primaryColor: string;
  /** Cor de acento (detalhes, subheadings) */
  accentColor: string;
  /** Cor de fundo da capa */
  coverBgColor: string;
  /** Cor do nome em destaque na capa */
  coverTitleColor: string;
  /** Cor do logotipo / texto de marca na capa */
  coverLogoColor: string;
  /** Estilo de shapes SVG da capa */
  coverShapeStyle: CoverShapeStyle;
  /** Qual dos 5 números recebe o card em destaque */
  featuredNumberKey: FeaturedNumberKey;
  /** Label legível do número destaque */
  featuredNumberLabel: string;
  /** Descrição do número destaque para o sublabel */
  featuredNumberSublabel: string;
  /** Label do tipo de análise para capa */
  productLabel: string;
  /** Subtítulo da capa */
  coverSubtitle: string;
}

export const THEMES: Record<ProductType, ProductTheme> = {
  nome_social: {
    primaryColor: '#D4AF37',       // Gold
    accentColor: '#c084fc',        // Purple
    coverBgColor: '#131313',       // Void (Celestial Alchemist)
    coverTitleColor: '#FFFFFF',
    coverLogoColor: '#D4AF37',
    coverShapeStyle: 'social',
    featuredNumberKey: 'expressao',
    featuredNumberLabel: 'Expressão',
    featuredNumberSublabel: 'O Dom',
    productLabel: 'Análise de Nome Social',
    coverSubtitle: 'Numerologia Cabalística',
  },
  nome_bebe: {
    primaryColor: '#C97B63',       // Rose-gold escuro (legível em branco)
    accentColor: '#E8A598',        // Rose-gold claro
    coverBgColor: '#FFF5F0',       // Creme rosado
    coverTitleColor: '#5C2D1E',    // Marrom quente
    coverLogoColor: '#C97B63',
    coverShapeStyle: 'bebe',
    featuredNumberKey: 'destino',
    featuredNumberLabel: 'Destino',
    featuredNumberSublabel: 'O Chamado do Céu',
    productLabel: 'Análise de Nome para Bebê',
    coverSubtitle: 'O Portal do Nascimento',
  },
  nome_empresa: {
    primaryColor: '#4A7FC1',       // Azul corporativo
    accentColor: '#D4AF37',        // Gold acento
    coverBgColor: '#0F1C2E',       // Navy escuro
    coverTitleColor: '#E2F0FF',    // Azul claro
    coverLogoColor: '#4A7FC1',
    coverShapeStyle: 'empresa',
    featuredNumberKey: 'expressao',
    featuredNumberLabel: 'Expressão',
    featuredNumberSublabel: 'O Magnetismo',
    productLabel: 'Análise de Nome Empresarial',
    coverSubtitle: 'Numerologia Cabalística Aplicada',
  },
};

/** Tema extra usado apenas pelo NomeAtualPDF (análise gratuita) */
export const THEME_NOME_ATUAL: ProductTheme = {
  primaryColor: '#0F766E',        // Teal 700 (mais escuro para textos em fundo branco)
  accentColor: '#818CF8',         // Indigo claro
  coverBgColor: '#0D1F1E',        // Verde-escuro profundo
  coverTitleColor: '#CCFBF1',     // Teal glacial
  coverLogoColor: '#2DD4BF',
  coverShapeStyle: 'atual',
  featuredNumberKey: 'expressao',
  featuredNumberLabel: 'Expressão',
  featuredNumberSublabel: 'O Dom',
  productLabel: 'Análise do Nome de Nascimento',
  coverSubtitle: 'Análise Vibracional Gratuíta',
};

/** Cores comuns a todos os PDFs (conteúdo, não capa) */
export const PDF_COLORS = {
  gold: '#D4AF37',
  dark: '#131313',
  gray: '#4B5563',
  lightGray: '#E5E7EB',
  text: '#1a1a1a',
  purple: '#a78bfa',
  red: '#DC2626',
  green: '#059669',
  amber: '#D97706',
  blue: '#4A7FC1',
} as const;

/** Escala tipográfica canônica para documentos PDF (h1..h4 + parágrafos). */
export const PDF_TYPOGRAPHY = {
  h1: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 13,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 12,
  },
  h3: {
    fontSize: 11,
    letterSpacing: 0.3,
    paddingBottom: 4,
    marginBottom: 8,
  },
  h4: {
    fontSize: 10,
    color: PDF_COLORS.gray,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    color: PDF_COLORS.gray,
    lineHeight: 1.65,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 10,
    color: PDF_COLORS.gray,
    lineHeight: 1.55,
  },
} as const;
