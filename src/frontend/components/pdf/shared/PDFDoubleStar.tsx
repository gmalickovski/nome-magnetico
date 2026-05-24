import { View, Text, StyleSheet, Svg, Polygon, Text as SvgText, G } from '@react-pdf/renderer';
import { PDF_COLORS } from './PDFTheme';

const GOLD = '#D4AF37';
const RED = '#DC2626';
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
  legendDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: RED,
  },
  legendDotGold: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  legendText: {
    fontSize: 9,
    color: GRAY,
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
}

// Gera os pontos do pentagrama (estrela de 5 pontas)
// starts at top (-90°), clockwise
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

// Retorna a posição XY da ponta i (0=topo, 1=direita-cima, 2=direita-baixo, 3=esquerda-baixo, 4=esquerda-cima)
function tipPosition(cx: number, cy: number, r: number, i: number) {
  const angle = ((-90 + i * 72) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), deg: -90 + i * 72 };
}

export function PDFDoubleStar({ nascimento, harmonizado }: PDFDoubleStarProps) {
  // Canvas precisa ter espaço extra para labels fora da estrela maior
  const W = 510;
  const H = 430;
  const cx = W / 2; // 255
  const cy = H / 2 + 8; // 223

  // ── Raios ─────────────────────────────────────────────────────────────────
  const innerOuterR = 72;               // ponta da estrela interna (vermelha)
  const innerInnerR = innerOuterR * 0.382;
  const outerOuterR = 145;             // ponta da estrela externa (dourada)
  const outerInnerR = outerOuterR * 0.382;

  // Onde os números ficam: exatamente na ponta mas ligeiramente para fora
  const numRadiusInner = innerOuterR + 12; // números vermelhos: fora da ponta da estrela menor
  const numRadiusOuter = outerOuterR + 14; // números dourados: fora da ponta da estrela maior
  const labelRadius    = outerOuterR + 32; // labels de texto: ainda mais fora

  const keys: (keyof DoubleStarNumbers)[] = ['destino', 'expressao', 'motivacao', 'missao', 'impressao'];
  const labels = ['Destino', 'Expressão', 'Motivação', 'Missão', 'Impressão'];

  const innerPts = getStarPoints(cx, cy, innerOuterR, innerInnerR);
  const outerPts = getStarPoints(cx, cy, outerOuterR, outerInnerR);

  return (
    <View style={styles.container} wrap={false}>
      <Svg width={W} height={H}>

        {/* ── Estrela externa (Dourada — Harmonização) ── */}
        <Polygon
          points={outerPts}
          fill={GOLD}
          fillOpacity={0.12}
          stroke={GOLD}
          strokeWidth={2}
        />

        {/* ── Estrela interna (Vermelha — Nascimento) ── */}
        <Polygon
          points={innerPts}
          fill={RED}
          fillOpacity={0.15}
          stroke={RED}
          strokeWidth={1.5}
        />

        {/* ── Números e Labels nas 5 pontas ── */}
        {keys.map((key, i) => {
          const nNasc = nascimento[key];
          const nHarm = harmonizado[key];

          // Ponta da estrela externa (dourada) — número fica logo fora da ponta
          const outerTip = tipPosition(cx, cy, outerOuterR + 14, i);
          // Ponta da estrela interna (vermelha) — número fica logo fora da ponta, dentro do espaço entre as estrelas
          const innerTip = tipPosition(cx, cy, innerOuterR + 14, i);
          // Label do nome da ponta — fica bem fora da estrela dourada
          const labelPos = tipPosition(cx, cy, outerOuterR + 32, i);

          // Alinhamento do label
          let anchor: 'middle' | 'start' | 'end' = 'middle';
          let ldx = 0, ldy = 0;
          if (i === 0) { ldy = -4; }
          else if (i === 1) { anchor = 'start'; ldx = 4; }
          else if (i === 2) { anchor = 'start'; ldx = 4; ldy = 6; }
          else if (i === 3) { anchor = 'end';   ldx = -4; ldy = 6; }
          else if (i === 4) { anchor = 'end';   ldx = -4; }

          return (
            <G key={`star-tip-${i}`}>
              {/* Label da ponta */}
              <SvgText
                x={labelPos.x + ldx}
                y={labelPos.y + ldy}
                fill="#4B5563"
                style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}
                textAnchor={anchor}
              >
                {labels[i]}
              </SvgText>

              {/* Número dourado (harmonizado) — fora da ponta da estrela maior */}
              {nHarm !== null && (
                <G>
                  {/* Círculo de fundo para legibilidade */}
                  <SvgText
                    x={outerTip.x}
                    y={outerTip.y + 4}
                    fill={GOLD}
                    style={{ fontSize: 14, fontFamily: 'Helvetica-Bold' }}
                    textAnchor="middle"
                  >
                    {nHarm}
                  </SvgText>
                </G>
              )}

              {/* Número vermelho (nascimento) — entre as duas estrelas, na ponta da interna */}
              {nNasc !== null && (
                <SvgText
                  x={innerTip.x}
                  y={innerTip.y + 3}
                  fill={RED}
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

      {/* Legenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.legendDotRed} />
          <Text style={styles.legendText}>Essência de Nascimento</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDotGold} />
          <Text style={styles.legendText}>Harmonização Social (Proteção)</Text>
        </View>
      </View>
    </View>
  );
}
