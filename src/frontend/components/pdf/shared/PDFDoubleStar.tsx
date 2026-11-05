import { View, Text, StyleSheet, Svg, Polygon, Text as SvgText, G } from '@react-pdf/renderer';
import { getScoreTierVisual } from '../../landing/score-tier-visual';
import { PDF_COLORS } from './PDFTheme';
import { BODY_FONT } from './PDFFonts';

const GRAY = PDF_COLORS.gray;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 9,
    color: GRAY,
    fontFamily: BODY_FONT,
  },
  supportText: {
    fontSize: 9,
    color: GRAY,
    fontFamily: BODY_FONT,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 1.45,
    maxWidth: 420,
  },
});

export interface DoubleStarNumbers {
  destino: number | null;
  expressao: number | null;
  motivacao: number | null;
  missao: number | null;
  impressao: number | null;
}

interface PDFDoubleStarProps {
  nascimento: DoubleStarNumbers;
  harmonizado: DoubleStarNumbers;
  /** Scores v3 para cores por faixa (HTML / getScoreTierVisual) — não altera geometria */
  scoreNascimento?: number | null;
  scoreHarmonizado?: number | null;
}

function getStarPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = ((-90 + i * 72) * Math.PI) / 180;
    pts.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    const innerAngle = ((-90 + 36 + i * 72) * Math.PI) / 180;
    pts.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return pts.join(' ');
}

function tipPosition(cx: number, cy: number, r: number, i: number) {
  const angle = ((-90 + i * 72) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function PDFDoubleStar({
  nascimento,
  harmonizado,
  scoreNascimento,
  scoreHarmonizado,
}: PDFDoubleStarProps) {
  const W = 510;
  const H = 430;
  const cx = W / 2;
  const cy = H / 2 + 8;

  const innerOuterR = 72;
  const innerInnerR = innerOuterR * 0.382;
  const outerOuterR = 145;
  const outerInnerR = outerOuterR * 0.382;

  const birthVisual =
    scoreNascimento != null ? getScoreTierVisual(scoreNascimento) : { stroke: '#DC2626', text: '#DC2626', fill: 'rgba(220,38,38,0.12)' };
  const harmVisual =
    scoreHarmonizado != null ? getScoreTierVisual(scoreHarmonizado) : { stroke: '#D4AF37', text: '#D4AF37', fill: 'rgba(212,175,55,0.12)' };

  const keys: (keyof DoubleStarNumbers)[] = ['destino', 'expressao', 'motivacao', 'missao', 'impressao'];
  const labels = ['Destino', 'Expressão', 'Motivação', 'Missão', 'Impressão'];

  const innerPts = getStarPoints(cx, cy, innerOuterR, innerInnerR);
  const outerPts = getStarPoints(cx, cy, outerOuterR, outerInnerR);

  return (
    <View style={styles.container} wrap={false}>
      <Svg width={W} height={H}>
        <Polygon
          points={outerPts}
          fill={harmVisual.stroke}
          fillOpacity={0.12}
          stroke={harmVisual.stroke}
          strokeWidth={2}
        />
        <Polygon
          points={innerPts}
          fill={birthVisual.stroke}
          fillOpacity={0.15}
          stroke={birthVisual.stroke}
          strokeWidth={1.5}
        />

        {keys.map((key, i) => {
          const nNasc = nascimento[key];
          const nHarm = harmonizado[key];
          const outerTip = tipPosition(cx, cy, outerOuterR + 14, i);
          const innerTip = tipPosition(cx, cy, innerOuterR + 14, i);
          const labelPos = tipPosition(cx, cy, outerOuterR + 32, i);

          let anchor: 'middle' | 'start' | 'end' = 'middle';
          let ldx = 0;
          let ldy = 0;
          if (i === 0) {
            ldy = -4;
          } else if (i === 1) {
            anchor = 'start';
            ldx = 4;
          } else if (i === 2) {
            anchor = 'start';
            ldx = 4;
            ldy = 6;
          } else if (i === 3) {
            anchor = 'end';
            ldx = -4;
            ldy = 6;
          } else if (i === 4) {
            anchor = 'end';
            ldx = -4;
          }

          return (
            <G key={`star-tip-${i}`}>
              <SvgText
                x={labelPos.x + ldx}
                y={labelPos.y + ldy}
                fill="#4B5563"
                style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
                textAnchor={anchor}
              >
                {labels[i]}
              </SvgText>
              {nHarm !== null && (
                <SvgText
                  x={outerTip.x}
                  y={outerTip.y + 4}
                  fill={harmVisual.text}
                  style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}
                  textAnchor="middle"
                >
                  {nHarm}
                </SvgText>
              )}
              {nNasc !== null && (
                <SvgText
                  x={innerTip.x}
                  y={innerTip.y + 3}
                  fill={birthVisual.text}
                  style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}
                  textAnchor="middle"
                >
                  {nNasc}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: birthVisual.fill, borderColor: birthVisual.stroke }]} />
          <Text style={styles.legendText}>Nome de nascimento</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: harmVisual.fill, borderColor: harmVisual.stroke }]} />
          <Text style={styles.legendText}>Assinatura selecionada</Text>
        </View>
      </View>
      <Text style={styles.supportText}>
        Compare os valores calculados para cada nome na legenda do gráfico.
      </Text>
    </View>
  );
}
