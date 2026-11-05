import { View, Text, StyleSheet, Svg, Polygon, Line, Text as SvgText } from '@react-pdf/renderer';
import {
  computeMotorRadarAxes,
  motorRadarToRecord,
  type MotorRadarKey,
} from '../../../../shared/interactive-engine/motor-radar';
import { getScoreTierVisual } from '../../landing/score-tier-visual';
import { PDFSectionAnchor } from './PDFSectionAnchor';
import { BODY_FONT, BODY_FONT_BOLD } from './PDFFonts';

const GRAY = '#4B5563';
const GOLD = '#C89000';

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#FFFBF5',
  },
  title: {
    fontSize: 16,
    fontFamily: BODY_FONT_BOLD,
    color: '#8A661C',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: GRAY,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 1.45,
  },
  intro: {
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.55,
    marginBottom: 12,
    textAlign: 'justify',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 8.5, color: GRAY },
  axisBlock: { marginBottom: 6 },
  axisTitle: { fontSize: 8.5, fontFamily: BODY_FONT_BOLD, color: '#1E293B', marginBottom: 2 },
  axisBody: { fontSize: 8, color: GRAY, lineHeight: 1.45, textAlign: 'justify' },
  footerNote: {
    fontSize: 8,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

const AXIS_CONFIG: { key: MotorRadarKey; angle: number; label: string; description: string }[] = [
  {
    key: 'expressao',
    angle: -Math.PI / 2,
    label: 'Foco do Momento',
    description:
      'mostra o quanto o seu nome conversa com a área que você escolheu no questionário. Sem uma área escolhida, mostra a afinidade entre a sua Expressão e o seu Destino.',
  },
  {
    key: 'motivacao',
    angle: -Math.PI / 2 + (2 * Math.PI) / 5,
    label: 'Equilíbrio da Alma',
    description:
      'mostra o equilíbrio do seu Triângulo Pessoal e a harmonia entre a sua Motivação e a sua Expressão.',
  },
  {
    key: 'destino',
    angle: -Math.PI / 2 + (4 * Math.PI) / 5,
    label: 'Sintonia de Destino',
    description: 'mostra a compatibilidade entre a sua Expressão e o seu Destino.',
  },
  {
    key: 'harmonia_triangulo',
    angle: -Math.PI / 2 + (6 * Math.PI) / 5,
    label: 'Magnetismo Social',
    description:
      'mostra o equilíbrio do seu Triângulo Social e a afinidade da sua Impressão com o contexto em que você mais usa a assinatura.',
  },
  {
    key: 'sequencias',
    angle: -Math.PI / 2 + (8 * Math.PI) / 5,
    label: 'Fluidez',
    description:
      'mostra o quanto o seu Triângulo da Vida está livre de sequências repetidas. Quanto mais perto da ponta, menos sequências foram encontradas.',
  },
];

function polygonPoints(data: Record<MotorRadarKey, number>, cx: number, cy: number, radius: number) {
  return AXIS_CONFIG.map((axis) => {
    const val = Math.max(0.08, Math.min(1, data[axis.key] ?? 0.35));
    const r = radius * val;
    const x = cx + r * Math.cos(axis.angle);
    const y = cy + r * Math.sin(axis.angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function RadarChart({
  birth,
  overlay,
  birthScore,
  overlayScore,
}: {
  birth: Record<MotorRadarKey, number>;
  overlay: Record<MotorRadarKey, number>;
  birthScore: number;
  overlayScore: number;
}) {
  const cx = 125;
  const cy = 105;
  const radius = 58;
  const rings = [0.25, 0.5, 0.75, 1];
  const birthColor = getScoreTierVisual(birthScore).stroke;
  const overlayColor = getScoreTierVisual(overlayScore).stroke;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={250} height={210} viewBox="0 0 250 210">
        {rings.map((ringVal) => {
          const pts = AXIS_CONFIG.map((axis) => {
            const r = radius * ringVal;
            return `${(cx + r * Math.cos(axis.angle)).toFixed(1)},${(cy + r * Math.sin(axis.angle)).toFixed(1)}`;
          }).join(' ');
          return (
            <Polygon key={ringVal} points={pts} fill="none" stroke="#E5E7EB" strokeWidth={0.6} />
          );
        })}
        {AXIS_CONFIG.map((axis, i) => {
          const { x, y } = (() => {
            const r = radius;
            return { x: cx + r * Math.cos(axis.angle), y: cy + r * Math.sin(axis.angle) };
          })();
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={0.5} />;
        })}
        <Polygon
          points={polygonPoints(birth, cx, cy, radius)}
          fill={getScoreTierVisual(birthScore).fill}
          stroke={birthColor}
          strokeWidth={1.2}
        />
        <Polygon
          points={polygonPoints(overlay, cx, cy, radius)}
          fill={getScoreTierVisual(overlayScore).fill}
          stroke={overlayColor}
          strokeWidth={1.4}
        />
        {AXIS_CONFIG.map((axis, i) => {
          const labelR = radius + 14;
          const x = cx + labelR * Math.cos(axis.angle);
          const y = cy + labelR * Math.sin(axis.angle);
          const pctBirth = Math.round((birth[axis.key] ?? 0) * 100);
          const pctOverlay = Math.round((overlay[axis.key] ?? 0) * 100);
          return (
            <SvgText
              key={`lbl-${i}`}
              x={x}
              y={y}
              fill="#475569"
              style={{ fontSize: 6.5, textAnchor: 'middle' }}
            >
              {`${axis.label} ${pctBirth}% / ${pctOverlay}%`}
            </SvgText>
          );
        })}
      </Svg>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: birthColor }]} />
          <Text style={styles.legendText}>Nome de nascimento</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: overlayColor }]} />
          <Text style={styles.legendText}>Assinatura sugerida</Text>
        </View>
      </View>
    </View>
  );
}

export function PDFMapaAlinhamentoVibracional({
  nomeNascimento,
  nomeHarmonizado,
  dataNascimento,
  scoreNascimento,
  scoreHarmonizado,
}: {
  nomeNascimento: string;
  nomeHarmonizado: string;
  dataNascimento: string;
  scoreNascimento: number;
  scoreHarmonizado: number;
}) {
  const birth = motorRadarToRecord(computeMotorRadarAxes(nomeNascimento, dataNascimento, null));
  const overlay = motorRadarToRecord(computeMotorRadarAxes(nomeHarmonizado, dataNascimento, null));

  return (
    <View wrap={false} style={styles.card}>
      <PDFSectionAnchor
        id="pdf-mapa-alinhamento"
        bookmark={{ title: 'Mapa de Alinhamento Vibracional', fit: true }}
      />
      <Text style={styles.title}>Mapa de Alinhamento Vibracional</Text>
      <Text style={styles.subtitle}>Ressonância da sua assinatura com o seu momento de vida</Text>
      <Text style={styles.intro}>
        Cada ponta do gráfico mostra um aspecto da sua análise, de 0% no centro a 100% no vértice. Os valores vêm da
        nota do seu nome e das respostas do seu questionário. Compare as duas formas: uma representa o seu nome de
        nascimento e a outra, a assinatura sugerida. É uma leitura simbólica para você conhecer melhor o seu nome.
      </Text>

      <RadarChart
        birth={birth}
        overlay={overlay}
        birthScore={scoreNascimento}
        overlayScore={scoreHarmonizado}
      />

      {AXIS_CONFIG.map((axis, i) => (
        <View key={axis.key} style={styles.axisBlock}>
          <Text style={styles.axisTitle}>
            {i + 1}. {axis.label}:
          </Text>
          <Text style={styles.axisBody}>{axis.description}</Text>
        </View>
      ))}

      <Text style={styles.footerNote}>Os percentuais servem para comparar as duas formas do nome.</Text>
    </View>
  );
}
