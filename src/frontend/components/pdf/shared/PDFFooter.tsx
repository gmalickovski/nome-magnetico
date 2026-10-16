/**
 * PDFFooter — rodapé fixo reutilizável para todas as páginas de conteúdo.
 */
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS } from './PDFTheme';
import { AVISO_AUTOCONHECIMENTO } from '../../../../shared/legal';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'column',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.lightGray,
    paddingTop: 8,
  },
  legal: {
    fontSize: 6,
    color: PDF_COLORS.gray,
    lineHeight: 1.35,
    marginBottom: 6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  email: {
    fontSize: 8,
    color: PDF_COLORS.gray,
  },
  site: {
    fontSize: 8,
    color: PDF_COLORS.gray,
  },
  page: {
    fontSize: 8,
    color: PDF_COLORS.gray,
  },
});

interface PDFFooterProps {
  email?: string;
  site?: string;
  bgColor?: string;
}

export function PDFFooter({
  email = 'contato@nomemagnetico.com.br',
  site = 'www.nomemagnetico.com.br',
  bgColor,
}: PDFFooterProps) {
  return (
    <View
      style={[
        styles.footer,
        bgColor
          ? {
              backgroundColor: bgColor,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderTopWidth: 0,
              bottom: 18,
            }
          : {},
      ]}
      fixed
    >
      <Text style={styles.legal}>{AVISO_AUTOCONHECIMENTO}</Text>
      <View style={styles.row}>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.site}>{site}</Text>
        <Text
          style={styles.page}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>
    </View>
  );
}
