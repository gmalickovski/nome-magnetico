import { Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import { PDFFooter } from './PDFFooter';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';

export type PdfTocEntry = {
  /** Destino interno (#id) — deve coincidir com id na Page/View alvo */
  id: string;
  title: string;
  /** 0 = parte principal; 1/2 = subassunto com recuo e fonte menor */
  level?: 0 | 1 | 2;
  /** Preenchido na renderização final (1-based, inclui capa e sumário) */
  page?: number;
};

const ENTRIES_PER_PAGE = 22;

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 65,
    paddingHorizontal: 45,
    backgroundColor: '#FFFFFF',
  },
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
    fontFamily: BODY_FONT,
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

function entryStyles(level: 0 | 1 | 2 = 0) {
  const pad = level === 1 ? 16 : level === 2 ? 28 : 0;
  const textStyle =
    level === 2 ? styles.linkTextL2 : level === 1 ? styles.linkTextL1 : styles.linkTextL0;
  return { pad, textStyle };
}

function chunkEntries(entries: PdfTocEntry[]): PdfTocEntry[][] {
  const chunks: PdfTocEntry[][] = [];
  for (let i = 0; i < entries.length; i += ENTRIES_PER_PAGE) {
    chunks.push(entries.slice(i, i + ENTRIES_PER_PAGE));
  }
  return chunks.length > 0 ? chunks : [[]];
}

export function PDFTableOfContents({
  entries,
  subtitle,
  pageNumbers,
}: {
  entries: PdfTocEntry[];
  subtitle: string;
  /** Mapa id → número de página (render final). Fallback: entry.page */
  pageNumbers?: Record<string, number>;
}) {
  const enriched = entries.map((e) => ({
    ...e,
    page: pageNumbers?.[e.id] ?? e.page,
  }));
  const chunks = chunkEntries(enriched);

  return (
    <>
      {chunks.map((chunk, chunkIndex) => {
        const pageId = chunkIndex === 0 ? 'pdf-sumario' : `pdf-sumario-cont-${chunkIndex + 1}`;
        const bookmarkTitle =
          chunkIndex === 0 ? 'Sumário' : `Sumário (${chunkIndex + 1})`;
        return (
          <Page
            key={pageId}
            size="A4"
            style={styles.page}
            id={pageId}
            bookmark={{ title: bookmarkTitle, fit: true }}
          >
            {chunkIndex === 0 && <PDFPageHeader subtitle={subtitle} />}
            {chunkIndex === 0 && <Text style={styles.title}>Sumário</Text>}
            {chunkIndex === 0 && (
              <Text style={styles.intro}>
                Use os links abaixo para ir direto a cada seção deste PDF.
              </Text>
            )}
            {chunkIndex > 0 && (
              <Text style={{ ...styles.title, fontSize: 14, marginBottom: 12 }}>
                Sumário (continuação)
              </Text>
            )}
            <View>
              {chunk.map((entry) => {
                const level = (entry.level ?? 0) as 0 | 1 | 2;
                const { pad, textStyle } = entryStyles(level);
                return (
                  <View key={`${entry.id}-${entry.title}`} style={styles.row}>
                    <Link
                      src={`#${entry.id}`}
                      style={{ textDecoration: 'none', flex: 1, paddingLeft: pad }}
                    >
                      <Text style={textStyle}>{entry.title}</Text>
                    </Link>
                    {entry.page != null && (
                      <Text style={styles.pageNum}>{entry.page}</Text>
                    )}
                  </View>
                );
              })}
            </View>
            <PDFFooter />
          </Page>
        );
      })}
    </>
  );
}
