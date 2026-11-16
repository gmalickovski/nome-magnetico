import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_TYPOGRAPHY } from './PDFTheme';
import { TITLE_FONT, BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import type { Arquetipo } from '../../../../backend/numerology/archetypes';

const styles = StyleSheet.create({
  hugeTitle: {
    ...PDF_TYPOGRAPHY.h1,
    fontFamily: TITLE_FONT,
    textAlign: 'center',
    marginBottom: 16,
  },
  bodyText: {
    ...PDF_TYPOGRAPHY.paragraph,
    fontFamily: BODY_FONT,
  },
  cardBodyText: {
    ...PDF_TYPOGRAPHY.cardText,
    fontFamily: BODY_FONT,
  },
});

export interface PDFArquetipoDetailBlockProps {
  arquetipo: Arquetipo;
  expressao: number;
  anchorId: string;
  bookmarkTitle: string;
  subtitle: string;
  eyebrowLabel: string;
  relationNote?: string;
  accentColor?: string;
  essenceBgColor?: string;
  essenceLabelColor?: string;
}

/**
 * Bloco completo de Arquétipo Vibracional (página dedicada), compartilhado entre NomeSocialPDF e NomeAtualPDF.
 */
export function PDFArquetipoDetailBlock({
  arquetipo,
  expressao,
  anchorId,
  bookmarkTitle,
  subtitle,
  eyebrowLabel,
  relationNote,
  accentColor = '#D4AF37',
  essenceBgColor = 'rgba(212,175,55,0.07)',
  essenceLabelColor = '#8A661C',
}: PDFArquetipoDetailBlockProps) {
  return (
    <View break>
      <PDFSectionAnchor id={anchorId} bookmark={{ title: bookmarkTitle, fit: true }} />
      <View style={{ marginTop: 12, marginBottom: 12 }}>
        <Text style={[styles.hugeTitle, { color: accentColor }]}>Arquétipo Vibracional</Text>
        <Text
          style={{
            fontFamily: TITLE_FONT,
            fontSize: 10,
            color: accentColor,
            textAlign: 'center',
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          {subtitle}
        </Text>
      </View>

      {/* Banner do Arquétipo */}
      <View wrap={false} style={{ backgroundColor: '#4C1D95', borderRadius: 10, padding: 14, marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontSize: 8, color: '#DDD6FE', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
          Expressão {expressao} — {eyebrowLabel}
        </Text>
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 26, color: '#FFFFFF', textAlign: 'center', letterSpacing: 1.5, marginBottom: 4 }}>
          {arquetipo.nome}
        </Text>
        <Text style={{ fontSize: 10, color: '#C4B5FD', textAlign: 'center' }}>
          Sombra: {arquetipo.sombra}
        </Text>
      </View>

      {/* Essência */}
      <View
        wrap={false}
        style={{
          backgroundColor: essenceBgColor,
          borderWidth: 1,
          borderColor: accentColor,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 8, color: essenceLabelColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
          Essência
        </Text>
        <Text style={{ fontFamily: TITLE_FONT, fontSize: 13, color: accentColor, textAlign: 'center', letterSpacing: 0.5 }}>
          "{arquetipo.essencia}"
        </Text>
      </View>

      {relationNote && (
        <View
          wrap={false}
          style={{
            backgroundColor: '#F5F3FF',
            borderLeftWidth: 3,
            borderLeftColor: '#7C3AED',
            borderRadius: 6,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <Text style={[styles.cardBodyText, { color: '#4C1D95', fontFamily: BODY_FONT_BOLD }]}>
            {relationNote}
          </Text>
        </View>
      )}

      {/* Intro */}
      <Text style={[styles.bodyText, { marginBottom: 10 }]}>
        Na Numerologia Cabalística, o número de Expressão do nome revela não apenas qualidades — mas um padrão arquetípico profundo, uma força narrativa que organiza como você age, lidera e se relaciona com o mundo. O arquétipo não é uma limitação: é a estrutura de potencial máximo disponível para quem carrega esse campo vibracional.
      </Text>

      {/* Descrição */}
      <Text style={[styles.bodyText, { marginBottom: 14 }]}>
        {arquetipo.descricao}
      </Text>

      {/* Expressão positiva vs Sombra */}
      <View wrap={false} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#166534', borderRadius: 8, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#166534', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Expressão Positiva
          </Text>
          {arquetipo.expressaoPositiva.map((item, i) => (
            <Text key={i} style={[styles.cardBodyText, { marginBottom: 4 }]}>
              ✓ {item}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#DC2626', borderRadius: 8, padding: 10 }}>
          <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#DC2626', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Expressão Sombra
          </Text>
          {arquetipo.expressaoSombra.map((item, i) => (
            <Text key={i} style={[styles.cardBodyText, { marginBottom: 4 }]}>
              ! {item}
            </Text>
          ))}
        </View>
      </View>

      {/* Figuras míticas */}
      <View wrap={false} style={{ borderRadius: 7, backgroundColor: '#F5F3FF', padding: 10 }}>
        <Text style={{ fontSize: 9, fontFamily: BODY_FONT_BOLD, color: '#7C3AED', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Figuras que Carregam Este Arquétipo
        </Text>
        <Text style={styles.cardBodyText}>
          {arquetipo.figurasMiticas.join('  ·  ')}
        </Text>
      </View>
    </View>
  );
}
