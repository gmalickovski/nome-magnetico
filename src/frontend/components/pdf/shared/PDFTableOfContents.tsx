import { Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import { PDFPageHeader } from './PDFPageHeader';
import { PDFFooter } from './PDFFooter';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';

export type PdfTocEntry = {
  /** Destino interno (#id) — deve coincidir com id na Page/View alvo */
  id: string;
  title: string;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 65,
    paddingHorizontal: 45,
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 11,
    fontFamily: BODY_FONT,
    color: '#1E293B',
    textDecoration: 'none',
  },
});

export function PDFTableOfContents({
  entries,
  subtitle,
}: {
  entries: PdfTocEntry[];
  subtitle: string;
}) {
  return (
    <Page
      size="A4"
      style={styles.page}
      id="pdf-sumario"
      bookmark={{ title: 'Sumário', fit: true }}
    >
      <PDFPageHeader subtitle={subtitle} />
      <Text style={styles.title}>Sumário</Text>
      <Text style={styles.intro}>
        Use os links abaixo para ir direto a cada seção deste PDF.
      </Text>
      <View>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <Link src={`#${entry.id}`} style={{ textDecoration: 'none', flex: 1 }}>
              <Text style={styles.linkText}>{entry.title}</Text>
            </Link>
          </View>
        ))}
      </View>
      <PDFFooter />
    </Page>
  );
}
