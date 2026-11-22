/**
 * Blocos base do layout dos PDFs (DEV-322): selo de parte, títulos H1–H4, parágrafo,
 * card, selo (chip) e número em destaque. Tudo lê o tema (`pdfLayoutTheme.ts`).
 */
import type { ReactNode } from 'react';
import { View, Text } from '@react-pdf/renderer';
import { estiloCard, LAYOUT_THEME_PADRAO, type PdfLayoutTheme } from './pdfLayoutTheme';

type T = { theme?: PdfLayoutTheme };
const th = (t?: PdfLayoutTheme) => t ?? LAYOUT_THEME_PADRAO;

export function SeloParte({ children, theme }: { children: ReactNode } & T) {
  const t = th(theme);
  return (
    <View style={{ flexDirection: 'row', marginBottom: 12 }}>
      <View style={{ backgroundColor: t.tinta, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Text style={{ fontSize: 8, fontFamily: t.fonteTextoBold, color: '#F3E7C4', letterSpacing: 1.4, textTransform: 'uppercase' }}>{children}</Text>
      </View>
    </View>
  );
}

export function H1({ children, theme }: { children: ReactNode } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTitulo, fontSize: 22, color: t.destaqueTexto, letterSpacing: 0.8, marginBottom: 6 }}>{children}</Text>;
}

export function H2({ children, theme }: { children: ReactNode } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTitulo, fontSize: 14, color: t.tinta, letterSpacing: 0.5, marginTop: 10, marginBottom: 6 }}>{children}</Text>;
}

export function H3({ children, theme, color }: { children: ReactNode; color?: string } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTextoBold, fontSize: 8, color: color ?? '#6B5A2E', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 3 }}>{children}</Text>;
}

export function H4({ children, theme, color }: { children: ReactNode; color?: string } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTextoBold, fontSize: 10, color: color ?? t.tinta, marginBottom: 2 }}>{children}</Text>;
}

export function P({ children, theme, size = 10, color }: { children: ReactNode; size?: number; color?: string } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTexto, fontSize: size, lineHeight: 1.55, color: color ?? t.tintaSuave }}>{children}</Text>;
}

export function Nota({ children, theme }: { children: ReactNode } & T) {
  const t = th(theme);
  return <Text style={{ fontFamily: t.fonteTexto, fontSize: 8, color: t.apagado, lineHeight: 1.45 }}>{children}</Text>;
}

/** Card do tema. `fundo` sobrescreve (ex.: card de bloqueio). */
export function Card({ children, theme, alt, fundo, style }: { children: ReactNode; alt?: boolean; fundo?: string; style?: Record<string, unknown> } & T) {
  const t = th(theme);
  const base = estiloCard(t, alt);
  return (
    <View wrap={false} style={{ ...base, ...(fundo ? { backgroundColor: fundo } : {}), padding: 10, ...(style ?? {}) }}>
      {children}
    </View>
  );
}

export function Chip({ children, fundo, cor, theme }: { children: ReactNode; fundo: string; cor: string } & T) {
  const t = th(theme);
  return (
    <View style={{ backgroundColor: fundo, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 7.5, fontFamily: t.fonteTextoBold, color: cor }}>{children}</Text>
    </View>
  );
}
