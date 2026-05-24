/**
 * PDFPageHeader — cabeçalho fixo reutilizável para todas as páginas de conteúdo.
 *
 * Lado esquerdo: logo PNG (logo-nomemagnetico-header-pdf.png) se disponível,
 *                senão texto "NOME MAGNETICO" como fallback.
 * Lado direito:  subtítulo com nome/data do cliente.
 */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './PDFTheme';
import { HEADER_LOGO_SRC } from './PDFFonts';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.lightGray,
    paddingBottom: 8,
    marginBottom: 24,
  },
  brand: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.gold,
    letterSpacing: 1,
  },
  info: {
    fontSize: 8,
    color: PDF_COLORS.gray,
    textAlign: 'right',
  },
});

interface PDFPageHeaderProps {
  brand?: string;
  subtitle: string;
  bgColor?: string;
}

export function PDFPageHeader({ brand = 'NOME MAGNETICO', subtitle, bgColor }: PDFPageHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        bgColor
          ? {
              backgroundColor: bgColor,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderBottomWidth: 0,
              marginBottom: 20,
            }
          : {},
      ]}
      fixed
    >
      {HEADER_LOGO_SRC ? (
        <Image src={HEADER_LOGO_SRC} style={{ height: 14, objectFit: 'contain' }} />
      ) : (
        <Text style={styles.brand}>{brand}</Text>
      )}
      <Text style={styles.info}>{subtitle}</Text>
    </View>
  );
}
