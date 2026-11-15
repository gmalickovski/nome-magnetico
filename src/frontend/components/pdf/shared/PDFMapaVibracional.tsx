import { View, Text, Svg, Polygon, Line, Circle, Rect, StyleSheet } from '@react-pdf/renderer';
import type { ContextualRadarAxis } from '../../../../shared/interactive-engine/motor-radar';
import { BODY_FONT, BODY_FONT_BOLD, TITLE_FONT } from './PDFFonts';
import { getScoreTierVisual } from '../../landing/score-tier-visual';
import { RADAR_SERIES_FILL_OPACITY } from '../../../../shared/interactive-engine/radar-visual';

const styles = StyleSheet.create({
  title: { fontFamily: TITLE_FONT, fontSize: 16, color: '#92640F', marginBottom: 10 },
  text: { fontFamily: BODY_FONT, fontSize: 9, lineHeight: 1.5, color: '#374151', marginBottom: 8 },
  row: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6 },
});
const point = (index: number, value: number) => {
  const angle = -Math.PI / 2 + index * 2 * Math.PI / 5;
  return { x: 235 + 100 * value * Math.cos(angle), y: 123 + 100 * value * Math.sin(angle) };
};
const points = (values: number[]) => values.map((v, i) => { const p = point(i, v); return `${p.x},${p.y}`; }).join(' ');

/** Séries calculadas no servidor, pelo mesmo motor e contexto usado no app. */
export function PDFMapaVibracional({ birth, selected, birthScore, selectedScore, hasContext, areaFoco, usos }: {
  birth: ContextualRadarAxis[];
  selected: ContextualRadarAxis[];
  birthScore: number;
  selectedScore: number;
  hasContext: boolean;
  areaFoco?: string | null;
  usos: string[];
}) {
  const birthVisual = getScoreTierVisual(birthScore);
  const selectedVisual = getScoreTierVisual(selectedScore);
  return <View>
    <Text style={styles.title}>Mapa Vibracional</Text>
    <Text style={styles.text}>Nome de Nascimento × Assinatura Selecionada, sob o mesmo contexto. Índices de 0 a 100; diferenças em pontos de índice.</Text>
    <Text style={styles.text}>{hasContext
      ? `Área de foco: ${areaFoco ? birth[0].label.replace('Foco: ', '') : 'não informada'}. Uso: ${usos.join(', ') || 'não informado'}.`
      : 'Calculado sem área de foco ou contexto de uso informados. Leitura geral do motor, sem personalização.'}</Text>
    <View wrap={false}>
      <Svg viewBox="0 -4 470 263" width="100%" height={240} style={{ marginTop: 6, marginBottom: 4 }}>
        {[0.25, 0.5, 0.75, 1].map(v => <Polygon key={v} points={points(birth.map(() => v))} fill="none" stroke="#CBD5E1" strokeWidth={0.7} />)}
        {birth.map((_, i) => { const p = point(i, 1); return <Line key={i} x1={235} y1={123} x2={p.x} y2={p.y} stroke="#CBD5E1" strokeWidth={0.5} />; })}
        <Polygon points={points(birth.map(a => a.value))} fill={birthVisual.stroke} fillOpacity={RADAR_SERIES_FILL_OPACITY} stroke={birthVisual.stroke} strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray="1.5 3" />
        {birth.map((a, i) => { const p = point(i, a.value); return <Rect key={a.key} x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} fill={birthVisual.stroke} opacity={0.55} />; })}
        {/* A assinatura é pintada por último, inclusive sobre os marcadores de nascimento. */}
        <Polygon points={points(selected.map(a => a.value))} fill={selectedVisual.stroke} fillOpacity={RADAR_SERIES_FILL_OPACITY} stroke={selectedVisual.stroke} strokeWidth={2.4} />
        {selected.map((a, i) => { const p = point(i, a.value); return <Circle key={a.key} cx={p.x} cy={p.y} r={3.5} fill={selectedVisual.stroke} />; })}
        {birth.map((a, i) => { const p = point(i, 1.22); return <Text key={a.key} x={p.x} y={i === 0 ? 12 : p.y} style={{ fontFamily: BODY_FONT, fontSize: 9 }} textAnchor={i === 0 ? 'middle' : i < 3 ? 'start' : 'end'} fill="#374151">{a.label}</Text>; })}
      </Svg>
      <Text style={styles.text}>Nascimento: linha pontilhada discreta e quadrados. Assinatura selecionada: linha contínua em destaque e círculos, sempre por cima.</Text>
      <Text style={styles.text}>Cores por faixa de score: nascimento {birthScore}/100 ({birthVisual.label}); assinatura {selectedScore}/100 ({selectedVisual.label}).</Text>
      <View style={[styles.row, { backgroundColor: '#F3F4F6', fontFamily: BODY_FONT_BOLD, fontSize: 8 }]}>
        <Text style={{ flex: 1 }}>Eixo</Text><Text style={{ width: 65 }}>Nascimento</Text><Text style={{ width: 65 }}>Assinatura</Text><Text style={{ width: 55 }}>Diferença</Text>
      </View>
      {birth.map((a, i) => {
        const b = selected[i]; const delta = b.valuePercent - a.valuePercent;
        return <View key={a.key} style={[styles.row, { fontFamily: BODY_FONT, fontSize: 8, backgroundColor: i % 2 ? '#F9FAFB' : '#FFFFFF' }]}>
          <Text style={{ flex: 1 }}>{a.label}</Text><Text style={{ width: 65 }}>{a.valuePercent}</Text><Text style={{ width: 65 }}>{b.valuePercent}</Text><Text style={{ width: 55 }}>{delta > 0 ? '+' : ''}{delta} pts</Text>
        </View>;
      })}
    </View>
    <View style={{ marginTop: 12 }}>
      {birth.map((a, i) => <View key={a.key} wrap={false} style={{ marginBottom: 8 }}>
        <Text style={[styles.text, { fontFamily: BODY_FONT_BOLD, marginBottom: 2 }]}>{a.label}</Text>
        <Text style={styles.text}>Nascimento: {a.description}. Assinatura: {selected[i].description}.</Text>
      </View>)}
    </View>
    <Text style={styles.text}>O Mapa não altera o score e os índices não representam probabilidade de sucesso. Pessoal e Social são leituras contextuais, sem desconto direto na nota global. A Estrela dos cinco números é uma leitura distinta; número numerológico maior não significa qualidade melhor.</Text>
  </View>;
}
