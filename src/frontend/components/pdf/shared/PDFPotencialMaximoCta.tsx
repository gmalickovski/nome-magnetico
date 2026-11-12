import { Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import { TITLE_FONT, BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';
import { obterNivelV3 } from '../../../../shared/score-v3';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import { POTENCIAL_CTA_URL_CURTA } from './pdfPotencialCtaUrl';

const GOLD = '#D4AF37';
const MUTED = '#A0A0A0';
const TEXT_LIGHT = '#E5E2E1';
const CARD_BG = '#1C1C1C';
const PAGE_BG = '#111111';
const DIVIDER = '#2A2A2A';
const BTN_TEXT = '#111111';
const GREEN = '#22C55E';

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
  titleCta: {
    fontFamily: TITLE_FONT,
    fontSize: 21,
    color: GOLD,
    marginBottom: 12,
    lineHeight: 1.25,
  },
  titleNeutro: {
    fontFamily: TITLE_FONT,
    fontSize: 21,
    color: TEXT_LIGHT,
    marginBottom: 12,
    lineHeight: 1.25,
  },
  body: {
    fontSize: 10,
    color: TEXT_LIGHT,
    lineHeight: 1.55,
    marginBottom: 16,
    textAlign: 'justify',
  },
  columns: {
    flexDirection: 'row',
    marginBottom: 14,
    minHeight: 72,
  },
  colLeft: {
    flex: 1,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colRight: {
    flex: 1,
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colSingle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  labelMuted: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scoreAtual: {
    fontFamily: TITLE_FONT,
    fontSize: 36,
  },
  scorePotencial: {
    fontFamily: TITLE_FONT,
    fontSize: 56,
    color: GOLD,
  },
  scoreUnico: {
    fontFamily: TITLE_FONT,
    fontSize: 48,
  },
  barTrack: {
    height: 6,
    backgroundColor: DIVIDER,
    borderRadius: 3,
    marginBottom: 6,
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 3,
  },
  barScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  barScaleText: {
    fontSize: 7,
    color: MUTED,
  },
  markerRow: {
    height: 14,
    position: 'relative',
    marginBottom: 8,
  },
  markerOutline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    position: 'absolute',
    marginLeft: -5,
    top: 2,
  },
  markerGold: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GOLD,
    position: 'absolute',
    marginLeft: -5,
    top: 2,
  },
  deltaLabel: {
    fontSize: 8,
    color: GREEN,
    textAlign: 'center',
    marginBottom: 12,
  },
  contextLine: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 14,
    textAlign: 'center',
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
  linkDiscreto: {
    fontSize: 9,
    color: MUTED,
    marginTop: 14,
    textAlign: 'center',
  },
});

export function formatNotaPdf(nota: number): string {
  if (!Number.isFinite(nota)) return '—';
  return Number.isInteger(nota) ? String(nota) : String(nota);
}

type Props = {
  notaBase: number;
  potencialMax: number;
  variant: 'com_cta' | 'sem_cta';
  ctaUrl: string;
  qrDataUrl?: string;
};

function clampPercent(score: number): number {
  return Math.max(0, Math.min(100, score));
}

const BAR_TRACK_PT = 400;

function ScoreBar({
  notaBase,
  potencialMax,
  notaBaseColor,
}: {
  notaBase: number;
  potencialMax: number;
  notaBaseColor: string;
}) {
  const left = clampPercent(notaBase);
  const right = clampPercent(potencialMax);
  const delta = potencialMax - notaBase;
  const leftPt = (left / 100) * BAR_TRACK_PT;
  const rightPt = (right / 100) * BAR_TRACK_PT;
  const fillWidth = Math.max(0, rightPt - leftPt);

  return (
    <View>
      <View style={[styles.barScale, { width: BAR_TRACK_PT }]}>
        <Text style={styles.barScaleText}>0</Text>
        <Text style={styles.barScaleText}>100</Text>
      </View>
      <View style={{ width: BAR_TRACK_PT, marginBottom: 4 }}>
        <View style={[styles.barTrack, { width: BAR_TRACK_PT }]}>
          <View
            style={[
              styles.barFill,
              {
                left: leftPt,
                width: fillWidth,
              },
            ]}
          />
        </View>
        <View style={[styles.markerRow, { width: BAR_TRACK_PT }]}>
          <View
            style={[
              styles.markerOutline,
              {
                left: leftPt,
                borderColor: notaBaseColor,
              },
            ]}
          />
          <View style={[styles.markerGold, { left: rightPt }]} />
        </View>
      </View>
      {delta > 0 ? (
        <Text style={styles.deltaLabel}>+{formatNotaPdf(delta)} pts</Text>
      ) : null}
    </View>
  );
}

export function PDFPotencialMaximoCtaPage({
  notaBase,
  potencialMax,
  variant,
  ctaUrl,
  qrDataUrl,
}: Props) {
  const notaBaseColor = obterNivelV3(notaBase).corHex;
  const notaUnicaColor = notaBaseColor;
  const comCta = variant === 'com_cta';

  return (
    <Page size="A4" style={styles.page} wrap>
      <PDFSectionAnchor
        id="pdf-nome-social"
        bookmark={{ title: 'Potencial da sua assinatura', fit: true }}
      />
      <View wrap={false} style={comCta ? styles.card : [styles.card, styles.cardSemDestaque]}>
        <Text style={comCta ? styles.titleCta : styles.titleNeutro}>
          {comCta
            ? `O seu nome pode chegar a ${formatNotaPdf(potencialMax)}`
            : 'O seu nome já tem a nota mais alta que encontramos'}
        </Text>

        <Text style={styles.body}>
          {comCta
            ? `Fizemos uma análise prévia com o seu nome e a sua data de nascimento. Hoje, a nota do seu nome é ${formatNotaPdf(notaBase)}, e a assinatura com a nota mais alta que encontramos chega a ${formatNotaPdf(potencialMax)}. Na análise completa, você vê as opções de assinatura, escolhe o que quer manter e compara cada uma antes de decidir.`
            : `Fizemos uma análise prévia e não encontramos uma assinatura com nota maior que a do seu nome de nascimento (${formatNotaPdf(notaBase)}). Por isso, não indicamos a análise completa para você agora. Você pode seguir usando o seu nome como está.`}
        </Text>

        {comCta ? (
          <>
            <View style={styles.columns}>
              <View style={styles.colLeft}>
                <Text style={styles.labelMuted}>Sua nota atual</Text>
                <Text style={[styles.scoreAtual, { color: notaBaseColor }]}>
                  {formatNotaPdf(notaBase)}
                </Text>
              </View>
              <View style={styles.colRight}>
                <Text style={styles.labelMuted}>Potencial máximo</Text>
                <Text style={styles.scorePotencial}>{formatNotaPdf(potencialMax)}</Text>
              </View>
            </View>

            <ScoreBar
              notaBase={notaBase}
              potencialMax={potencialMax}
              notaBaseColor={notaBaseColor}
            />

            <Text style={styles.contextLine}>
              Maior nota encontrada entre as sugestões calculadas para a sua data de nascimento.
            </Text>

            <View style={styles.ctaRow}>
              <View style={styles.ctaButtonWrap}>
                <Link src={ctaUrl} style={{ textDecoration: 'none' }}>
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaButtonText}>Ver minhas opções de assinatura</Text>
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

            <Text style={styles.aviso}>
              {`${formatNotaPdf(potencialMax)} é a nota mais alta possível antes das suas escolhas. Ela pode diminuir conforme o que você quiser manter na conversa, como sobrenomes ou o quanto o nome pode mudar. Só mostramos opções com nota acima de ${formatNotaPdf(notaBase)}.`}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.colSingle}>
              <Text style={styles.labelMuted}>Sua nota atual</Text>
              <Text style={[styles.scoreUnico, { color: notaUnicaColor }]}>
                {formatNotaPdf(notaBase)}
              </Text>
            </View>
            <Link src="https://www.nomemagnetico.com.br" style={{ textDecoration: 'none' }}>
              <Text style={styles.linkDiscreto}>Saiba mais em nomemagnetico.com.br</Text>
            </Link>
          </>
        )}
      </View>
    </Page>
  );
}
