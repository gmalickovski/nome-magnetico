import { Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import type { PdfLayoutTheme } from '../layout/pdfLayoutTheme';
import { PDFFooter } from './PDFFooter';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import { PDFSectionAnchor } from './PDFSectionAnchor';

export type PdfTocEntry = {
  /** Destino interno (#id) — deve coincidir com id na Page/View alvo */
  id: string;
  title: string;
  /** 0 = capítulo; 1/2/3 = subassuntos com recuos progressivos. */
  level?: 0 | 1 | 2 | 3;
  /** Preenchido na renderização final (1-based, inclui capa e sumário) */
  page?: number;
};

// Mesmas tonalidades dos divisores dos capítulos em NomeSocialPDF.
const CHAPTER_COLORS: Record<string, { text: string; background: string }> = {
  'pdf-essencia': { text: '#991B1B', background: '#FEF2F2' },
  'pdf-harmonizacao': { text: '#8A661C', background: '#FFFBEB' },
  'pdf-nome-harmonizado': { text: '#166534', background: '#F0FDF4' },
  'pdf-anexos': { text: '#1E293B', background: '#F1F5F9' },
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 108,
    paddingBottom: 80,
    paddingHorizontal: 45,
    backgroundColor: '#FFFFFF',
  },
  header: { position: 'absolute', top: 28, left: 45, right: 45 },
  title: {
    fontSize: 18,
    fontFamily: TITLE_FONT,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  intro: {
    fontSize: 10,
    fontFamily: BODY_FONT,
    color: '#4B5563',
    lineHeight: 1.55,
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 7,
  },
  linkTextL0: {
    fontSize: 11,
    fontFamily: BODY_FONT_BOLD,
    color: '#1E293B',
  },
  linkTextL1: {
    fontSize: 9.5,
    fontFamily: BODY_FONT,
    color: '#334155',
  },
  linkTextL2: {
    fontSize: 8.5,
    fontFamily: BODY_FONT,
    color: '#475569',
  },
  pageNum: {
    fontSize: 9,
    fontFamily: BODY_FONT_BOLD,
    color: '#64748B',
    marginLeft: 8,
    minWidth: 18,
    textAlign: 'right',
  },
});

function entryStyles(level: 0 | 1 | 2 | 3 = 0) {
  const pad = level === 3 ? 40 : level === 2 ? 28 : level === 1 ? 16 : 0;
  const textStyle =
    level >= 2 ? styles.linkTextL2 : level === 1 ? styles.linkTextL1 : styles.linkTextL0;
  return { pad, textStyle };
}

export function PDFTableOfContents({
  entries,
  subtitle,
  pageNumbers,
  layoutTheme,
}: {
  /** Layout base DEV-322: sem linhas, capítulos em cartão do tema. */
  layoutTheme?: PdfLayoutTheme;
  entries: PdfTocEntry[];
  subtitle: string;
  /** Mapa id → número de página (render final). Fallback: entry.page */
  pageNumbers?: Record<string, number>;
}) {
  const enriched = entries.map((e) => ({
    ...e,
    page: pageNumbers?.[e.id] ?? e.page,
  }));
  return (
    <Page size="A4" style={[styles.page, ...(layoutTheme ? [{ backgroundColor: layoutTheme.paginaFundo }] : [])]} wrap>
      <View fixed style={{ position: 'absolute', top: 0, left: 0, height: 1, width: 1 }}
        render={({ subPageNumber = 1 }) => <PDFSectionAnchor
          id={subPageNumber === 1 ? 'pdf-sumario' : `pdf-sumario-cont-${subPageNumber}`}
          bookmark={{ title: subPageNumber === 1 ? 'Sumário' : `Sumário (${subPageNumber})`, fit: true }} />}
      />
      <View fixed style={styles.header}>
        <PDFPageHeader subtitle={subtitle} />
      </View>
      <Text fixed style={{ ...styles.title, position: 'absolute', top: 64, left: 45, right: 45, fontSize: layoutTheme ? 20 : 16, ...(layoutTheme ? { color: layoutTheme.destaqueTexto } : {}) }}
        render={({ subPageNumber = 1 }) => subPageNumber === 1 ? 'Sumário' : 'Sumário (continuação)'} />
      <Text style={styles.intro}>
        Use os links abaixo para ir direto a cada seção deste PDF.
      </Text>
      <View>
        {enriched.map((entry) => {
          const level = entry.level ?? 0;
          const { pad, textStyle } = entryStyles(level);
          const chapter = level === 0 && !layoutTheme ? CHAPTER_COLORS[entry.id] : undefined;
          const rowStyle = layoutTheme
            ? [styles.row, { borderBottomWidth: 0, paddingVertical: 5 }, ...(level === 0 ? [{ backgroundColor: layoutTheme.cardFundoAlt, borderRadius: 8, paddingHorizontal: 8, marginTop: 8 }] : [])]
            : [styles.row, ...(level === 0 ? [{ backgroundColor: chapter?.background ?? '#F3F4F6', paddingHorizontal: 6 }] : [])];
          return (
            <View key={`${entry.id}-${entry.title}`} wrap={false} minPresenceAhead={level === 0 ? 28 : 0}
              style={rowStyle}>
              <Link src={`#${entry.id}`} style={{ textDecoration: 'none', flex: 1, paddingLeft: pad }}>
                <Text style={[textStyle, ...(chapter ? [{ color: chapter.text }] : [])]}>{entry.title}</Text>
              </Link>
              {entry.page != null && <Text style={[styles.pageNum, ...(chapter ? [{ color: chapter.text }] : [])]}>{entry.page}</Text>}
            </View>
          );
        })}
      </View>
      <PDFFooter />
    </Page>
  );
}
