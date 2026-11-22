/**
 * Tema do layout base dos PDFs (DEV-322). Ver docs/architecture/dev-322-pdf-layout-base.md.
 *
 * Tudo que é visual nos blocos novos vem daqui, para permitir no futuro o tema por marca
 * (plano profissional): logo, cor de destaque, formato e estilo de card e fontes.
 * Fixos em qualquer tema: cálculo, faixas da nota, vermelho de bloqueio e aviso.
 */
import { getScoreTierVisual } from '../../landing/score-tier-visual';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from '../shared/PDFFonts';

export type FormatoCard = 'arredondado' | 'suave' | 'quadrado';
export type EstiloCard = 'preenchido' | 'borda' | 'linha';

export interface PdfLayoutTheme {
  marca: string;
  paginaFundo: string;
  tinta: string;
  tintaSuave: string;
  apagado: string;
  destaque: string;
  destaqueTexto: string;
  cardFundo: string;
  cardFundoAlt: string;
  formatoCard: FormatoCard;
  estiloCard: EstiloCard;
  fonteTitulo: string;
  fonteTexto: string;
  fonteTextoBold: string;
}

export const LAYOUT_THEME_PADRAO: PdfLayoutTheme = {
  marca: 'NOME MAGNÉTICO',
  paginaFundo: '#FBF9F4',
  tinta: '#2A2620',
  tintaSuave: '#3D372D',
  apagado: '#6E6658',
  destaque: '#D4AF37',
  destaqueTexto: '#8A6A12',
  cardFundo: '#FFFFFF',
  cardFundoAlt: '#F4F0E6',
  formatoCard: 'arredondado',
  estiloCard: 'preenchido',
  fonteTitulo: TITLE_FONT,
  fonteTexto: BODY_FONT,
  fonteTextoBold: BODY_FONT_BOLD,
};

/** Cores fixas (não mudam com a marca). */
export const COR_FIXA = {
  bloqueio: '#B3261E',
  bloqueioFundo: '#FBE9E7',
  bloqueioTexto: '#9B1C14',
  arcano: '#6D4FC2',
  arcanoFundo: '#EDE6FF',
  arcanoTexto: '#4B2E9E',
  igualFundo: '#ECE9E2',
  igualTexto: '#4A443A',
  melhorouFundo: '#F3E7C4',
  melhorouTexto: '#6B4E00',
} as const;

export function raioCard(t: PdfLayoutTheme): number {
  return t.formatoCard === 'quadrado' ? 0 : t.formatoCard === 'suave' ? 6 : 14;
}

/** Estilo de card conforme o tema. `alt` usa o fundo secundário. */
export function estiloCard(t: PdfLayoutTheme, alt = false): Record<string, string | number> {
  const r = raioCard(t);
  if (t.estiloCard === 'borda') return { backgroundColor: t.cardFundo, borderWidth: 1, borderColor: t.destaque, borderRadius: r };
  if (t.estiloCard === 'linha') return { borderBottomWidth: 1, borderBottomColor: t.destaque, borderRadius: 0 };
  return { backgroundColor: alt ? t.cardFundoAlt : t.cardFundo, borderRadius: r };
}

export interface FaixaNotaPapel {
  traco: string;
  texto: string;
  fundo: string;
  rotulo: string;
}

const TEXTO_FAIXA: Record<string, { texto: string; fundo: string }> = {
  N5: { texto: '#047857', fundo: '#D1FAE5' },
  N4: { texto: '#4D7C0F', fundo: '#ECFCCB' },
  N3: { texto: '#A16207', fundo: '#FEF9C3' },
  N2: { texto: '#C2410C', fundo: '#FFEDD5' },
  N1: { texto: '#B91C1C', fundo: '#FEE2E2' },
};

/** Faixa da nota para papel claro: mesma regra do site (getScoreTierVisual), texto em tom escuro. */
export function faixaNotaPapel(score: number): FaixaNotaPapel {
  const v = getScoreTierVisual(score);
  const t = TEXTO_FAIXA[v.code] ?? TEXTO_FAIXA.N3!;
  return { traco: v.stroke, texto: t.texto, fundo: t.fundo, rotulo: v.label };
}

export function rotuloCompatibilidade(c: 'favoravel' | 'neutro' | 'desfavoravel'): string {
  if (c === 'favoravel') return 'Favorável';
  if (c === 'neutro') return 'Vibração Neutra';
  return 'Tensão Vibracional';
}
