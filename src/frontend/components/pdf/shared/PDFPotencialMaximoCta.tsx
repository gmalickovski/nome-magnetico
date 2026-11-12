import { Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import { TITLE_FONT, BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import { POTENCIAL_CTA_URL_CURTA } from './pdfPotencialCtaUrl';
import {
  buildPotencialPdfCopyComCta,
  buildPotencialPdfCopySemCta,
} from './pdfPotencialMaximoCopy';

export { formatNotaPdf } from './pdfPotencialMaximoCopy';

const GOLD = '#D4AF37';
const MUTED = '#A0A0A0';
const TEXT_LIGHT = '#E5E2E1';
const CARD_BG = '#1C1C1C';
const PAGE_BG = '#111111';
const BTN_TEXT = '#111111';

const MM = 2.834645669;
const pagePad = 18 * MM;
const cardPad = 14 * MM;
const btnHeight = 12 * MM;
const qrSize = 29 * MM;

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAGE_BG,
    paddingTop: pagePad,
    paddingBottom: pagePad,
    paddingHorizontal: pagePad,
    fontFamily: BODY_FONT,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    padding: cardPad,
    marginTop: 24,
  },
  cardSemDestaque: {
    borderColor: 'rgba(42, 42, 42, 0.9)',
  },
  destaqueCta: {
    fontFamily: TITLE_FONT,
    fontSize: 18,
    color: GOLD,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  destaqueNeutro: {
    fontFamily: TITLE_FONT,
    fontSize: 18,
    color: TEXT_LIGHT,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  apoio: {
    fontSize: 10,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 10,
    color: TEXT_LIGHT,
    lineHeight: 1.55,
    marginBottom: 16,
    textAlign: 'justify',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 14,
  },
  ctaButtonWrap: {
    flex: 1,
  },
  ctaButton: {
    backgroundColor: GOLD,
    height: btnHeight,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  ctaButtonText: {
    fontFamily: BODY_FONT_BOLD,
    fontSize: 10,
    color: BTN_TEXT,
    textAlign: 'center',
  },
  qrCol: {
    width: qrSize,
    alignItems: 'center',
  },
  qrImage: {
    width: qrSize,
    height: qrSize,
  },
  qrCaption: {
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
    textAlign: 'center',
  },
  urlLine: {
    fontSize: 9,
    color: MUTED,
    marginTop: 10,
    textAlign: 'center',
  },
  aviso: {
    fontSize: 8,
    color: MUTED,
    lineHeight: 1.45,
    marginTop: 12,
  },
});

type Props = {
  notaBase: number;
  potencialMax: number;
  variant: 'com_cta' | 'sem_cta';
  ctaUrl: string;
  qrDataUrl?: string;
};

export function PDFPotencialMaximoCtaPage({
  notaBase,
  potencialMax,
  variant,
  ctaUrl,
  qrDataUrl,
}: Props) {
  const comCta = variant === 'com_cta';

  return (
    <Page size="A4" style={styles.page} wrap>
      <PDFSectionAnchor
        id="pdf-nome-social"
        bookmark={{ title: 'Potencial da sua assinatura', fit: true }}
      />
      <View wrap={false} style={comCta ? styles.card : [styles.card, styles.cardSemDestaque]}>
        {comCta ? (
          <>
            {(() => {
              const copy = buildPotencialPdfCopyComCta(notaBase, potencialMax);
              return (
                <>
                  <Text style={styles.destaqueCta}>{copy.destaque}</Text>
                  <Text style={styles.apoio}>{copy.apoio}</Text>
                  <Text style={styles.body}>{copy.texto}</Text>
                  <View style={styles.ctaRow}>
                    <View style={styles.ctaButtonWrap}>
                      <Link src={ctaUrl} style={{ textDecoration: 'none' }}>
                        <View style={styles.ctaButton}>
                          <Text style={styles.ctaButtonText}>{copy.botao}</Text>
                        </View>
                      </Link>
                    </View>
                    {qrDataUrl ? (
                      <View style={styles.qrCol}>
                        <Image style={styles.qrImage} src={qrDataUrl} />
                        <Text style={styles.qrCaption}>Aponte a câmera</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.urlLine}>{POTENCIAL_CTA_URL_CURTA}</Text>
                  <Text style={styles.aviso}>{copy.aviso}</Text>
                </>
              );
            })()}
          </>
        ) : (
          <>
            {(() => {
              const copy = buildPotencialPdfCopySemCta(notaBase);
              return (
                <>
                  <Text style={styles.destaqueNeutro}>{copy.destaque}</Text>
                  <Text style={styles.body}>{copy.texto}</Text>
                </>
              );
            })()}
          </>
        )}
      </View>
    </Page>
  );
}
