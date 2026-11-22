import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDF_TYPOGRAPHY } from './PDFTheme';
import { TITLE_FONT } from './PDFFonts';
import { TrianguloPiramideInline, type TrianguloData } from './PDFMarkdownRenderer';
import { BloqueiosBlock, type BloqueioData } from './PDFKarmicBlock';
import { PDFArcanosBlock } from './PDFArcanosBlock';
import type { PdfLayoutTheme } from '../layout/pdfLayoutTheme';
import { COR_FIXA } from '../layout/pdfLayoutTheme';
import { BloqueiosLayout } from '../layout/KarmaLayoutBlocks';
import { Card, H3, H4, Nota, P } from '../layout/PDFLayoutBlocks';
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
  /** Layout base DEV-322: bloqueios e arcano regente no estilo novo. */
  layoutTheme?: PdfLayoutTheme;
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
  layoutTheme,
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

      {layoutTheme ? (
        <View style={{ marginTop: 12, gap: 6 }}>
          {filteredBloqueios.length > 0 ? (
            <>
              <H3 theme={layoutTheme} color={COR_FIXA.bloqueioTexto}>{bloqueiosTitle}</H3>
              <BloqueiosLayout theme={layoutTheme} bloqueios={filteredBloqueios} />
            </>
          ) : null}
          {arc ? (
            <Card theme={layoutTheme} fundo={COR_FIXA.arcanoFundo}>
              <H3 theme={layoutTheme} color={COR_FIXA.arcanoTexto}>{arcanosTitle}</H3>
              <H4 theme={layoutTheme} color="#2E1B6B">{`${data.arcanoRegente} · ${arc.nome}`}</H4>
              <P theme={layoutTheme} size={9}>{arc.descricao}</P>
              <Nota theme={layoutTheme}>É o número da ponta do triângulo, marcado em roxo.</Nota>
            </Card>
          ) : null}
        </View>
      ) : null}

      {!layoutTheme && filteredBloqueios.length > 0 && (
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

      {!layoutTheme && data.arcanoRegente != null && (
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
