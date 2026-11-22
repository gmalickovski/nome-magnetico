import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_TYPOGRAPHY } from './PDFTheme';
import { TITLE_FONT } from './PDFFonts';
import { TrianguloPiramideInline, type TrianguloData } from './PDFMarkdownRenderer';
import { BloqueiosBlock, type BloqueioData } from './PDFKarmicBlock';
import { PDFArcanosBlock } from './PDFArcanosBlock';
import { getArcano } from '../../../../backend/numerology/arcanos';

const styles = StyleSheet.create({
  bloqueiosTitle: {
    ...PDF_TYPOGRAPHY.h2,
    fontFamily: TITLE_FONT,
    color: '#DC2626',
    borderBottomColor: '#DC2626',
    fontSize: 11,
    marginBottom: 8,
  },
});

export interface PDFTriangleArcanoData extends TrianguloData {
  arcanosDePassagem?: number[];
  arcanoAtual?: {
    numero: number | null;
    periodo: string;
    idadeInicio: number;
    idadeFim: number;
    indice?: number;
  };
}

export interface PDFTriangleDetailsBlockProps {
  data: PDFTriangleArcanoData;
  triangulo: 'vida' | 'pessoal' | 'social' | 'destino';
  pyramidLabel: string;
  cellSize: number;
  letras: string[];
  bloqueiosTitle: string;
  arcanosTitle: string;
  allBloqueios: BloqueioData[];
  bloqueiosFootnote?: string;
  /** Anexos (DEV-322): só o arcano regente, sem passagens e trânsito. */
  compact?: boolean;
}

/**
 * Renderiza pirâmide do triângulo seguida imediatamente pelos seus Bloqueios (se houver)
 * e, na sequência, pelo bloco de Arcanos. Compartilhado entre NomeAtualPDF e NomeSocialPDF.
 */
export function PDFTriangleDetailsBlock({
  data,
  triangulo,
  pyramidLabel,
  cellSize,
  letras,
  bloqueiosTitle,
  arcanosTitle,
  allBloqueios,
  bloqueiosFootnote,
  compact = false,
}: PDFTriangleDetailsBlockProps) {
  const filteredBloqueios = allBloqueios.filter((b: any) =>
    b.triangulos?.includes(triangulo),
  );
  const arc = data.arcanoRegente != null ? getArcano(data.arcanoRegente) : null;
  const arcAtual = data.arcanoAtual?.numero ? getArcano(data.arcanoAtual.numero) : null;

  return (
    <>
      <TrianguloPiramideInline
        data={data}
        label={pyramidLabel}
        cellSize={cellSize}
        letras={letras}
      />

      {filteredBloqueios.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.bloqueiosTitle}>{bloqueiosTitle}</Text>
          <BloqueiosBlock
            bloqueios={filteredBloqueios}
            hideTriangulos={true}
            isNomeSocial={true}
            triangulo={triangulo}
          />
          {bloqueiosFootnote ? (
            <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
              {bloqueiosFootnote}
            </Text>
          ) : null}
        </View>
      )}

      {data.arcanoRegente != null && (
        <PDFArcanosBlock
          title={arcanosTitle}
          titleColor="#7C3AED"
          arcanoRegente={arc}
          arcanosDePassagem={compact ? undefined : data.arcanosDePassagem}
          arcanoAtual={compact ? undefined : data.arcanoAtual}
          arcanoAtualDescricao={!compact && arcAtual ? arcAtual.descricao : undefined}
        />
      )}
    </>
  );
}
